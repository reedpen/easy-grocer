import { getCurrentWeekStart, getMockWeekPlan } from "@/lib/mock-data";
import { aggregateIngredientsFromWeekPlan } from "@/lib/grocery/aggregate";
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
  mealsPerDay: number;
  includeSnacks: boolean;
  snacksPerDay: number;
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
      mealsPerDay: plannerInputs.mealsPerDay,
      includeSnacks: plannerInputs.includeSnacks,
      snacksPerDay: plannerInputs.snacksPerDay,
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
          "weekly_budget_cents,restrictions,intolerances,disliked_ingredients,meals_per_day,include_snacks,snacks_per_day",
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
    mealsPerDay: (preferences?.meals_per_day as number | null) ?? 3,
    includeSnacks: (preferences?.include_snacks as boolean | null) ?? false,
    snacksPerDay: (preferences?.snacks_per_day as number | null) ?? 0,
  };
}

export function buildGroceryItemsFromWeekPlan(plan: WeekPlan) {
  return aggregateIngredientsFromWeekPlan(plan);
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
