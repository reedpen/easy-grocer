import { createClient } from "@/lib/supabase/server";
import type { HistoryItem, WeekMealItem, WeekPlan } from "./types";

type MealPlanRow = {
  id: string;
  week_start_date: string;
  status: "draft" | "confirmed" | "ordered";
  daily_calorie_target: number;
  total_cost_cents: number;
  budget_cents: number;
};

type MealPlanItemRow = {
  id: string;
  day_of_week: number;
  meal_type: WeekMealItem["meal_type"];
  title: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  cost_cents: number;
  recipe_source: string | null;
  external_recipe_id: string | null;
  recipe_snapshot_json: unknown;
};

export async function fetchWeekPlan(userId: string, weekStart: string) {
  const supabase = await createClient();
  const { data: plan, error } = await supabase
    .from("meal_plans")
    .select(
      "id,week_start_date,status,daily_calorie_target,total_cost_cents,budget_cents,meal_plan_items(id,day_of_week,meal_type,title,servings,calories,protein_g,carbs_g,fats_g,cost_cents,recipe_source,external_recipe_id,recipe_snapshot_json)",
    )
    .eq("user_id", userId)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!plan) return null;

  return normalizePlan(plan as MealPlanRow & { meal_plan_items: MealPlanItemRow[] });
}

export async function fetchMostRecentWeekPlan(userId: string) {
  const supabase = await createClient();
  const { data: plan, error } = await supabase
    .from("meal_plans")
    .select(
      "id,week_start_date,status,daily_calorie_target,total_cost_cents,budget_cents,meal_plan_items(id,day_of_week,meal_type,title,servings,calories,protein_g,carbs_g,fats_g,cost_cents,recipe_source,external_recipe_id,recipe_snapshot_json)",
    )
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!plan) return null;

  return normalizePlan(plan as MealPlanRow & { meal_plan_items: MealPlanItemRow[] });
}

export async function persistWeekPlan(userId: string, weekPlan: WeekPlan) {
  if (!userId) {
    throw new Error("Missing user id.");
  }

  const supabase = await createClient();
  const itemsPayload = weekPlan.items.map((item) => ({
    day_of_week: item.day_of_week,
    meal_type: item.meal_type,
    title: item.title,
    servings: item.servings,
    calories: item.calories,
    protein_g: item.macros.protein_g,
    carbs_g: item.macros.carbs_g,
    fats_g: item.macros.fats_g,
    cost_cents: item.cost_cents ?? 0,
    recipe_source: item.recipe_source ?? "spoonacular",
    external_recipe_id: item.external_recipe_id ?? null,
    recipe_snapshot_json: item.recipe_snapshot_json ?? {},
  }));

  const { data: mealPlanId, error } = await supabase.rpc("upsert_meal_plan_with_items", {
    p_week_start_date: weekPlan.week_start_date,
    p_status: weekPlan.status,
    p_daily_calorie_target: weekPlan.daily_calorie_target,
    p_total_cost_cents: weekPlan.total_cost_cents,
    p_budget_cents: weekPlan.budget_cents,
    p_items: itemsPayload,
  });

  if (error) {
    throw new Error(error.message);
  }

  return mealPlanId as string;
}

export async function fetchPlanHistory(userId: string): Promise<HistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("id,week_start_date,status,total_cost_cents,meal_plan_items(calories)")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((plan) => {
    const items = (plan.meal_plan_items ?? []) as Array<{ calories: number }>;
    const avgCalories =
      items.length > 0
        ? Math.round(items.reduce((sum, item) => sum + item.calories, 0) / 7)
        : 0;

    return {
      id: plan.id as string,
      week_start_date: plan.week_start_date as string,
      avg_calories_per_day: avgCalories,
      estimated_total_cents: plan.total_cost_cents as number,
      status: plan.status as HistoryItem["status"],
    };
  });
}

function normalizePlan(plan: MealPlanRow & { meal_plan_items: MealPlanItemRow[] }): WeekPlan {
  return {
    id: plan.id,
    week_start_date: plan.week_start_date,
    status: plan.status,
    daily_calorie_target: plan.daily_calorie_target,
    total_cost_cents: plan.total_cost_cents,
    budget_cents: plan.budget_cents,
    items: (plan.meal_plan_items ?? [])
      .slice()
      .sort((a, b) => a.day_of_week - b.day_of_week)
      .map((item) => ({
        id: item.id,
        day_of_week: item.day_of_week as WeekMealItem["day_of_week"],
        meal_type: item.meal_type,
        title: item.title,
        servings: Number(item.servings),
        calories: item.calories,
        macros: {
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fats_g: item.fats_g,
        },
        cost_cents: item.cost_cents,
        recipe_source: item.recipe_source ?? undefined,
        external_recipe_id: item.external_recipe_id,
        recipe_snapshot_json: item.recipe_snapshot_json,
      })),
  };
}
