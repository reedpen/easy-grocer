import { createClient } from "@/lib/supabase/server";
import type { GroceryLineItem, GroceryList, WeekPlan } from "@/lib/planner/types";
import type { GroceryProviderId } from "@/lib/providers/types";

type GroceryListRow = {
  id: string;
  provider: GroceryProviderId;
  cart_url: string | null;
  estimated_total_cents: number;
  budget_cents: number;
  budget_delta_cents: number;
  budget_status: "under" | "over" | "on_target";
};

type GroceryListItemRow = {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
  category: string;
  provider_product_id: string | null;
  provider_product_url: string | null;
  resolution_confidence: number | null;
  source: "catalog" | "estimate";
};

export type CachedProductRow = {
  provider_product_id: string;
  provider_product_url: string | null;
  unit_price_cents: number;
  resolution_confidence: number | null;
};

function normalizeBudgetStatus(deltaCents: number): GroceryList["budget_status"] {
  if (deltaCents > 0) return "over";
  if (deltaCents < 0) return "under";
  return "on_target";
}

export function makeIngredientCacheKey(ingredientName: string, unit: string) {
  return `${ingredientName.trim().toLowerCase()}::${unit.trim().toLowerCase()}`;
}

export async function fetchGroceryListForPlan(
  userId: string,
  mealPlanId: string,
  provider: GroceryProviderId,
): Promise<GroceryList | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_lists")
    .select(
      "id,provider,cart_url,estimated_total_cents,budget_cents,budget_delta_cents,budget_status,grocery_list_items(id,ingredient_name,quantity,unit,unit_price_cents,line_total_cents,category,provider_product_id,provider_product_url,resolution_confidence,source)",
    )
    .eq("user_id", userId)
    .eq("meal_plan_id", mealPlanId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const row = data as GroceryListRow & { grocery_list_items: GroceryListItemRow[] };
  return {
    id: row.id,
    provider: row.provider,
    cart_url: row.cart_url,
    estimated_total_cents: row.estimated_total_cents,
    budget_cents: row.budget_cents,
    budget_delta_cents: row.budget_delta_cents,
    budget_status: row.budget_status,
    items: (row.grocery_list_items ?? []).map((item) => ({
      id: item.id,
      ingredient_name: item.ingredient_name,
      quantity: Number(item.quantity),
      unit: item.unit,
      unit_price_cents: item.unit_price_cents,
      line_total_cents: item.line_total_cents,
      category: item.category,
      provider_product_id: item.provider_product_id,
      provider_product_url: item.provider_product_url,
      resolution_confidence: item.resolution_confidence,
      source: item.source,
    })),
  };
}

export async function persistGroceryListForPlan(
  userId: string,
  plan: WeekPlan,
  provider: GroceryProviderId,
  cartUrl: string | null,
  items: GroceryLineItem[],
) {
  const supabase = await createClient();
  const estimatedTotalCents = items.reduce((sum, item) => sum + item.line_total_cents, 0);
  const budgetDeltaCents = estimatedTotalCents - plan.budget_cents;
  const budgetStatus = normalizeBudgetStatus(budgetDeltaCents);

  const { data: listRow, error: listError } = await supabase
    .from("grocery_lists")
    .upsert({
      user_id: userId,
      meal_plan_id: plan.id,
      provider,
      cart_url: cartUrl,
      estimated_total_cents: estimatedTotalCents,
      budget_cents: plan.budget_cents,
      budget_delta_cents: budgetDeltaCents,
      budget_status: budgetStatus,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (listError) {
    throw new Error(listError.message);
  }

  const groceryListId = listRow.id as string;
  const { error: deleteError } = await supabase
    .from("grocery_list_items")
    .delete()
    .eq("grocery_list_id", groceryListId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (items.length > 0) {
    const { error: insertError } = await supabase.from("grocery_list_items").insert(
      items.map((item) => ({
        grocery_list_id: groceryListId,
        ingredient_name: item.ingredient_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price_cents: item.unit_price_cents,
        line_total_cents: item.line_total_cents,
        category: item.category,
        provider_product_id: item.provider_product_id ?? null,
        provider_product_url: item.provider_product_url ?? null,
        resolution_confidence: item.resolution_confidence ?? null,
        source: item.source ?? "estimate",
      })),
    );
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return {
    id: groceryListId,
    provider,
    cart_url: cartUrl,
    estimated_total_cents: estimatedTotalCents,
    budget_cents: plan.budget_cents,
    budget_delta_cents: budgetDeltaCents,
    budget_status: budgetStatus,
    items,
  } satisfies GroceryList;
}

export async function fetchCachedProduct(
  userId: string,
  provider: GroceryProviderId,
  ingredientKey: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredient_product_cache")
    .select("provider_product_id,provider_product_url,unit_price_cents,resolution_confidence")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("ingredient_key", ingredientKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return (data as CachedProductRow | null) ?? null;
}

export async function upsertCachedProduct(
  userId: string,
  provider: GroceryProviderId,
  ingredientKey: string,
  product: CachedProductRow,
  rawJson: unknown,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("ingredient_product_cache").upsert({
    user_id: userId,
    provider,
    ingredient_key: ingredientKey,
    provider_product_id: product.provider_product_id,
    provider_product_url: product.provider_product_url,
    unit_price_cents: product.unit_price_cents,
    resolution_confidence: product.resolution_confidence,
    last_seen_at: new Date().toISOString(),
    raw_json: rawJson ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}
