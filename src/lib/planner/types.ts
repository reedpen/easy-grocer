export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MacroTotals = {
  protein_g: number;
  carbs_g: number;
  fats_g: number;
};

export type WeekMealItem = {
  id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  meal_type: MealType;
  title: string;
  servings: number;
  calories: number;
  macros: MacroTotals;
  cost_cents?: number;
  recipe_source?: string;
  external_recipe_id?: string | null;
  recipe_snapshot_json?: unknown;
};

export type WeekPlan = {
  id: string;
  week_start_date: string;
  status: "draft" | "confirmed" | "ordered";
  daily_calorie_target: number;
  total_cost_cents: number;
  budget_cents: number;
  items: WeekMealItem[];
};

export type HistoryItem = {
  id: string;
  week_start_date: string;
  avg_calories_per_day: number;
  estimated_total_cents: number;
  status: "draft" | "confirmed" | "ordered";
};
