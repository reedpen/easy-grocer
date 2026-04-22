import { getSerpApiKey } from "@/lib/env";
import { aggregateIngredientsFromWeekPlan } from "@/lib/grocery/aggregate";
import {
  fetchCachedProduct,
  makeIngredientCacheKey,
  upsertCachedProduct,
} from "@/lib/grocery/store";
import type { GroceryLineItem } from "@/lib/planner/types";
import type { GroceryProvider, GroceryProviderInput, GroceryProviderResult } from "./types";

type SerpApiWalmartResponse = {
  shopping_results?: Array<{
    title?: string;
    product_id?: string;
    us_item_id?: string;
    product_page_url?: string;
    link?: string;
    extracted_price?: number;
    price?: string;
  }>;
};

const SERP_API_ENDPOINT = "https://serpapi.com/search.json";
const REQUEST_TIMEOUT_MS = 8000;
const RESOLUTION_CONCURRENCY = 4;

function parsePriceToCents(value?: number | string | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.round(value * 100));
  }
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.round(numeric * 100);
    }
  }
  return null;
}

async function resolveWalmartProduct(ingredientName: string) {
  const apiKey = getSerpApiKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const params = new URLSearchParams({
      engine: "walmart",
      query: ingredientName,
      api_key: apiKey,
      num: "1",
    });

    const response = await fetch(`${SERP_API_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as SerpApiWalmartResponse;
    const match = payload.shopping_results?.[0];
    if (!match) return null;

    const providerProductId = match.us_item_id || match.product_id;
    const unitPriceCents = parsePriceToCents(match.extracted_price ?? match.price);
    if (!providerProductId || !unitPriceCents) return null;

    return {
      provider_product_id: providerProductId,
      provider_product_url: match.product_page_url || match.link || null,
      unit_price_cents: unitPriceCents,
      resolution_confidence: 0.85,
      raw_json: match,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function withResolvedPrice(item: GroceryLineItem, unitPriceCents: number): GroceryLineItem {
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 1;
  const lineTotal = Math.max(1, Math.round(unitPriceCents * Math.max(quantity, 1)));
  return {
    ...item,
    unit_price_cents: unitPriceCents,
    line_total_cents: lineTotal,
  };
}

function buildWalmartCartUrl(items: GroceryLineItem[]) {
  const cartItems = items
    .filter((item) => Boolean(item.provider_product_id))
    .slice(0, 25)
    .map((item) => `${item.provider_product_id}_1`);

  if (cartItems.length === 0) {
    return null;
  }

  return `https://www.walmart.com/cart/addToCart?items=${encodeURIComponent(cartItems.join(","))}`;
}

async function mapWithConcurrency<TInput, TOutput>(
  input: TInput[],
  concurrency: number,
  mapper: (item: TInput) => Promise<TOutput>,
) {
  const output = new Array<TOutput>(input.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= input.length) {
        return;
      }
      output[index] = await mapper(input[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), input.length) }, () =>
      worker(),
    ),
  );

  return output;
}

export class WalmartProvider implements GroceryProvider {
  readonly id = "walmart" as const;

  async buildList(input: GroceryProviderInput): Promise<GroceryProviderResult> {
    const baseItems = aggregateIngredientsFromWeekPlan(input.plan);
    const resolvedItems = await mapWithConcurrency(
      baseItems,
      RESOLUTION_CONCURRENCY,
      async (item) => {
        const key = makeIngredientCacheKey(item.ingredient_name, item.unit);
        let resolved = await fetchCachedProduct(input.userId, this.id, key);

        if (!resolved) {
          const fresh = await resolveWalmartProduct(item.ingredient_name);
          if (fresh) {
            await upsertCachedProduct(input.userId, this.id, key, fresh, fresh.raw_json);
            resolved = fresh;
          }
        }

        if (!resolved) {
          return {
            ...item,
            source: "estimate" as const,
          };
        }

        return {
          ...withResolvedPrice(item, resolved.unit_price_cents),
          provider_product_id: resolved.provider_product_id,
          provider_product_url: resolved.provider_product_url,
          resolution_confidence: resolved.resolution_confidence,
          source: "catalog" as const,
        };
      },
    );

    const estimatedTotalCents = resolvedItems.reduce(
      (sum, item) => sum + item.line_total_cents,
      0,
    );

    return {
      provider: this.id,
      cartUrl: buildWalmartCartUrl(resolvedItems),
      estimatedTotalCents,
      items: resolvedItems,
    };
  }
}
