import { getCurrentWeekStart, getMockWeekPlan } from "@/lib/mock-data";
import { aggregateIngredientsFromWeekPlan } from "@/lib/grocery/aggregate";
import { createClient } from "@/lib/supabase/server";
import { generateWeekPlanFromSpoonacular, getDietFromRestrictions } from "./generate";
import { fetchWeekPlan, persistWeekPlan } from "./store";
import type { MealType, WeekMealItem, WeekPlan } from "./types";

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

type TweakPreset = "protein_bar" | "sweet_treat";

const tweakPresets: Record<
  TweakPreset,
  {
    title: string;
    calories: number;
    macros: WeekMealItem["macros"];
    cost_cents: number;
  }
> = {
  protein_bar: {
    title: "Protein bar",
    calories: 210,
    macros: { protein_g: 20, carbs_g: 22, fats_g: 6 },
    cost_cents: 225,
  },
  sweet_treat: {
    title: "Sweet treat bowl",
    calories: 290,
    macros: { protein_g: 7, carbs_g: 40, fats_g: 11 },
    cost_cents: 280,
  },
};

const replacementByMealType: Record<
  MealType,
  {
    title: string;
    calories: number;
    macros: WeekMealItem["macros"];
    cost_cents: number;
  }
> = {
  breakfast: {
    title: "Cottage cheese fruit bowl",
    calories: 360,
    macros: { protein_g: 28, carbs_g: 34, fats_g: 11 },
    cost_cents: 420,
  },
  lunch: {
    title: "Turkey hummus wrap",
    calories: 480,
    macros: { protein_g: 34, carbs_g: 42, fats_g: 19 },
    cost_cents: 620,
  },
  dinner: {
    title: "Herb salmon rice bowl",
    calories: 620,
    macros: { protein_g: 43, carbs_g: 45, fats_g: 25 },
    cost_cents: 980,
  },
  snack: tweakPresets.protein_bar,
};

export type PlanTweak =
  | { type: "remove_meal"; mealId: string }
  | { type: "replace_meal"; mealId: string }
  | { type: "add_tweak"; dayOfWeek: WeekMealItem["day_of_week"]; preset: TweakPreset }
  | { type: "confirm_plan" };

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

function recalculateTotalCost(items: WeekMealItem[]) {
  return items.reduce((sum, item) => sum + (item.cost_cents ?? 0), 0);
}

export async function applyPlanTweak(userId: string, weekStart: string, tweak: PlanTweak) {
  const effectiveWeekStart = normalizeWeekStart(weekStart);
  const existingPlan = await getOrCreateWeekPlan(userId, effectiveWeekStart);

  if (existingPlan.status !== "draft" && tweak.type !== "confirm_plan") {
    throw new Error("Only draft plans can be edited.");
  }

  let nextItems = existingPlan.items.slice();
  let nextStatus = existingPlan.status;

  switch (tweak.type) {
    case "remove_meal": {
      const filtered = nextItems.filter((item) => item.id !== tweak.mealId);
      if (filtered.length === nextItems.length) {
        throw new Error("Meal not found.");
      }
      nextItems = filtered;
      break;
    }
    case "replace_meal": {
      const index = nextItems.findIndex((item) => item.id === tweak.mealId);
      if (index < 0) {
        throw new Error("Meal not found.");
      }
      const current = nextItems[index];
      const replacement = replacementByMealType[current.meal_type];
      nextItems[index] = {
        ...current,
        title: replacement.title,
        calories: replacement.calories,
        macros: replacement.macros,
        cost_cents: replacement.cost_cents,
        recipe_source: "manual",
        external_recipe_id: null,
        recipe_snapshot_json: { replaced_from: current.external_recipe_id ?? current.id },
      };
      break;
    }
    case "add_tweak": {
      const preset = tweakPresets[tweak.preset];
      nextItems.push({
        id: crypto.randomUUID(),
        day_of_week: tweak.dayOfWeek,
        meal_type: "snack",
        title: preset.title,
        servings: 1,
        calories: preset.calories,
        macros: preset.macros,
        cost_cents: preset.cost_cents,
        recipe_source: "manual",
        external_recipe_id: null,
        recipe_snapshot_json: { preset: tweak.preset },
      });
      break;
    }
    case "confirm_plan":
      nextStatus = "confirmed";
      break;
    default:
      break;
  }

  const nextPlan: WeekPlan = {
    ...existingPlan,
    status: nextStatus,
    total_cost_cents: recalculateTotalCost(nextItems),
    items: nextItems,
  };

  await persistWeekPlan(userId, nextPlan);
  const saved = await fetchWeekPlan(userId, effectiveWeekStart);
  return saved ?? nextPlan;
}

export async function createWeekPlanFromHistory(
  userId: string,
  sourceWeekStart: string,
  targetWeekStart = getCurrentWeekStart(),
) {
  const sourceWeek = normalizeWeekStart(sourceWeekStart);
  const targetWeek = normalizeWeekStart(targetWeekStart);

  const sourcePlan = await fetchWeekPlan(userId, sourceWeek);
  if (!sourcePlan) {
    throw new Error("Source week not found.");
  }

  const plannerInputs = await loadPlannerInputs(userId);
  const copiedItems = sourcePlan.items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
  }));

  const newPlan: WeekPlan = {
    id: crypto.randomUUID(),
    week_start_date: targetWeek,
    status: "draft",
    daily_calorie_target: plannerInputs.dailyCalorieTarget,
    total_cost_cents: recalculateTotalCost(copiedItems),
    budget_cents: plannerInputs.budgetCents,
    items: copiedItems,
  };

  await persistWeekPlan(userId, newPlan);
  const saved = await fetchWeekPlan(userId, targetWeek);
  return saved ?? newPlan;
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
