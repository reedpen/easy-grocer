import {
  fetchGroceryListForPlan,
  persistGroceryListForPlan,
} from "@/lib/grocery/store";
import type { GroceryList, WeekPlan } from "@/lib/planner/types";
import { WalmartProvider } from "@/lib/providers/walmart";

const walmartProvider = new WalmartProvider();

function normalizeBudgetStatus(deltaCents: number): GroceryList["budget_status"] {
  if (deltaCents > 0) return "over";
  if (deltaCents < 0) return "under";
  return "on_target";
}

export async function getOrCreateGroceryList(userId: string, plan: WeekPlan) {
  const existing = await fetchGroceryListForPlan(userId, plan.id, "walmart");
  if (existing && existing.items.length > 0) {
    return existing;
  }

  const generated = await walmartProvider.buildList({ userId, plan });
  const saved = await persistGroceryListForPlan(
    userId,
    plan,
    generated.provider,
    generated.cartUrl,
    generated.items,
  );

  return {
    ...saved,
    estimated_total_cents: generated.estimatedTotalCents,
    budget_delta_cents: generated.estimatedTotalCents - plan.budget_cents,
    budget_status: normalizeBudgetStatus(generated.estimatedTotalCents - plan.budget_cents),
  } satisfies GroceryList;
}
