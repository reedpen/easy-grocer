import { getCurrentWeekStart, getMockWeekPlan } from "@/lib/mock-data";
import { hasSpoonacularApiKey } from "@/lib/services/spoonacular";
import {
  generateWeeklyMealPlan,
  getRecipeInformation,
} from "@/lib/services/spoonacular";
import type { WeekMealItem, WeekPlan } from "./types";

const dayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const mealTypeByIndex: Array<WeekMealItem["meal_type"]> = [
  "breakfast",
  "lunch",
  "dinner",
];

function parseMacroValue(
  nutrients: Array<{ name?: string; amount?: number }> | undefined,
  name: string,
) {
  const nutrient = nutrients?.find((item) => item.name === name);
  return Math.round(nutrient?.amount ?? 0);
}

export async function generateWeekPlanFromSpoonacular(input: {
  weekStart: string;
  dailyCalorieTarget: number;
  budgetCents: number;
  diet?: string;
  intolerances?: string[];
  dislikedIngredients?: string[];
  fastingPattern?: string | null;
}): Promise<WeekPlan> {
  if (!hasSpoonacularApiKey()) {
    return getMockWeekPlan(input.weekStart, input.budgetCents);
  }

  const response = await generateWeeklyMealPlan({
    targetCalories: input.dailyCalorieTarget,
    diet: input.diet,
    intolerances: input.intolerances,
    excludeIngredients: input.dislikedIngredients,
  });

  const allMeals = dayKeys.flatMap((dayKey, dayIndex) => {
    const day = response.week[dayKey];
    return day.meals.map((meal, mealIndex) => ({
      dayOfWeek: dayIndex as WeekMealItem["day_of_week"],
      mealType: mealTypeByIndex[mealIndex] ?? "snack",
      meal,
    }));
  });

  const filteredMeals =
    input.fastingPattern && input.fastingPattern.trim() !== ""
      ? allMeals.filter((item) => item.mealType !== "breakfast")
      : allMeals;

  const recipeDetails = await Promise.all(
    filteredMeals.map((item) => getRecipeInformation(item.meal.id)),
  );

  const items: WeekMealItem[] = filteredMeals.map((item, index) => {
    const details = recipeDetails[index];
    const nutrients = details.nutrition?.nutrients;

    const servings = Number(details.servings ?? item.meal.servings ?? 1);
    const pricePerServing = Math.round(Number(details.pricePerServing ?? 0));
    const costCents = Math.max(0, Math.round(pricePerServing * servings));

    return {
      id: crypto.randomUUID(),
      day_of_week: item.dayOfWeek,
      meal_type: item.mealType,
      title: details.title ?? item.meal.title,
      servings,
      calories: parseMacroValue(nutrients, "Calories"),
      macros: {
        protein_g: parseMacroValue(nutrients, "Protein"),
        carbs_g: parseMacroValue(nutrients, "Carbohydrates"),
        fats_g: parseMacroValue(nutrients, "Fat"),
      },
      cost_cents: costCents,
      recipe_source: "spoonacular",
      external_recipe_id: String(item.meal.id),
      recipe_snapshot_json: details,
    };
  });

  const totalCost = items.reduce((sum, item) => sum + (item.cost_cents ?? 0), 0);

  return {
    id: crypto.randomUUID(),
    week_start_date: input.weekStart || getCurrentWeekStart(),
    status: "draft",
    daily_calorie_target: input.dailyCalorieTarget,
    total_cost_cents: totalCost,
    budget_cents: input.budgetCents,
    items,
  };
}

export function getDietFromRestrictions(restrictions: string[]) {
  const normalized = restrictions.map((item) => item.toLowerCase());
  if (normalized.includes("vegan")) return "vegan";
  if (normalized.includes("vegetarian")) return "vegetarian";
  if (normalized.includes("gluten-free")) return "gluten free";
  if (normalized.includes("dairy-free")) return "dairy free";
  return undefined;
}
