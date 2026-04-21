import { getCurrentWeekStart, getMockWeekPlan } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { generateWeekPlanFromSpoonacular, getDietFromRestrictions } from "./generate";
import { fetchWeekPlan, persistWeekPlan } from "./store";
import type { WeekPlan } from "./types";

type PlannerInputs = {
  dailyCalorieTarget: number;
  budgetCents: number;
  restrictions: string[];
  intolerances: string[];
  dislikedIngredients: string[];
  fastingPattern: string | null;
};

function normalizeWeekStart(weekStart?: string) {
  if (!weekStart || weekStart === "current-week") return getCurrentWeekStart();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return getCurrentWeekStart();
  return weekStart;
}

export async function getOrCreateWeekPlan(userId: string, weekStart?: string) {
  const effectiveWeekStart = normalizeWeekStart(weekStart);

  const existing = await fetchWeekPlan(userId, effectiveWeekStart);
  if (existing) {
    return existing;
  }

  const plannerInputs = await loadPlannerInputs(userId);
  let generated: WeekPlan;
  try {
    generated = await generateWeekPlanFromSpoonacular({
      weekStart: effectiveWeekStart,
      dailyCalorieTarget: plannerInputs.dailyCalorieTarget,
      budgetCents: plannerInputs.budgetCents,
      diet: getDietFromRestrictions(plannerInputs.restrictions),
      intolerances: plannerInputs.intolerances,
      dislikedIngredients: plannerInputs.dislikedIngredients,
      fastingPattern: plannerInputs.fastingPattern,
    });
  } catch {
    generated = getMockWeekPlan(effectiveWeekStart, plannerInputs.budgetCents);
  }

  await persistWeekPlan(userId, generated);
  const saved = await fetchWeekPlan(userId, effectiveWeekStart);
  return saved ?? generated;
}

export async function loadPlannerInputs(userId: string): Promise<PlannerInputs> {
  const supabase = await createClient();
  const [{ data: profile, error: profileError }, { data: preferences }, { data: fasting }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("daily_calorie_target")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("dietary_preferences")
        .select(
          "weekly_budget_cents,restrictions,intolerances,disliked_ingredients",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("fasting_schedules")
        .select("pattern")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (profileError || !profile) {
    throw new Error("Missing profile for planner.");
  }

  return {
    dailyCalorieTarget: profile.daily_calorie_target as number,
    budgetCents: (preferences?.weekly_budget_cents as number | null) ?? 0,
    restrictions: (preferences?.restrictions as string[] | null) ?? [],
    intolerances: (preferences?.intolerances as string[] | null) ?? [],
    dislikedIngredients:
      (preferences?.disliked_ingredients as string[] | null) ?? [],
    fastingPattern: (fasting?.pattern as string | null) ?? null,
  };
}

export function buildGroceryItemsFromWeekPlan(plan: WeekPlan) {
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
        ? Math.round((item.cost_cents ?? 0) / ingredients.length)
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
  }));
}

export function buildWalmartCartUrlFromWeekPlan(plan: WeekPlan) {
  const spoonacularIds = plan.items
    .map((item) => item.external_recipe_id)
    .filter((value): value is string => Boolean(value));

  if (spoonacularIds.length === 0) {
    return null;
  }

  const pseudoItems = spoonacularIds.slice(0, 10).map((id) => `${id}_1`).join(",");
  return `https://www.walmart.com/cart/addToCart?items=${encodeURIComponent(pseudoItems)}`;
}
