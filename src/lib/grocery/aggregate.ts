import type { GroceryLineItem, WeekPlan } from "@/lib/planner/types";

export function aggregateIngredientsFromWeekPlan(plan: WeekPlan): GroceryLineItem[] {
  const aggregate = new Map<
    string,
    {
      ingredient_name: string;
      quantity: number;
      unit: string;
      unit_price_cents: number;
      line_total_cents: number;
      category: string;
    }
  >();

  for (const item of plan.items) {
    const snapshot = item.recipe_snapshot_json as
      | {
          extendedIngredients?: Array<{
            aisle?: string;
            nameClean?: string;
            name?: string;
            amount?: number;
            unit?: string;
          }>;
        }
      | undefined;

    const ingredients = snapshot?.extendedIngredients ?? [];
    const distributedCost =
      ingredients.length > 0
        ? Math.max(1, Math.round((item.cost_cents ?? 0) / ingredients.length))
        : 0;

    for (const ingredient of ingredients) {
      const name = ingredient.nameClean || ingredient.name || "Ingredient";
      const unit = ingredient.unit || "unit";
      const amount = Number(ingredient.amount ?? 1);
      const key = `${name.toLowerCase()}::${unit.toLowerCase()}`;
      const current = aggregate.get(key);

      if (current) {
        current.quantity += amount;
        current.line_total_cents += distributedCost;
      } else {
        aggregate.set(key, {
          ingredient_name: name,
          quantity: amount,
          unit,
          unit_price_cents: distributedCost,
          line_total_cents: distributedCost,
          category: ingredient.aisle || "General",
        });
      }
    }
  }

  return Array.from(aggregate.values()).map((item, index) => ({
    id: `ingredient-${index + 1}`,
    ...item,
    source: "estimate",
  }));
}
