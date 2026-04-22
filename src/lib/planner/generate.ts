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

type PlannedMealSlot = {
  dayOfWeek: WeekMealItem["day_of_week"];
  mealType: WeekMealItem["meal_type"];
  meal: {
    id: number;
    title: string;
    servings: number;
  };
  scale: number;
};

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
  mealsPerDay?: number;
  includeSnacks?: boolean;
  snacksPerDay?: number;
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

  const mealsPerDay = Math.min(Math.max(Math.round(input.mealsPerDay ?? 3), 2), 3);
  const includeSnacks = Boolean(input.includeSnacks);
  const snacksPerDay = includeSnacks
    ? Math.min(Math.max(Math.round(input.snacksPerDay ?? 1), 0), 3)
    : 0;
  const usesFasting = Boolean(input.fastingPattern && input.fastingPattern.trim() !== "");

  const slots: PlannedMealSlot[] = dayKeys.flatMap((dayKey, dayIndex) => {
    const day = response.week[dayKey];
    const baseMeals = day.meals.map((meal, mealIndex) => ({
      dayOfWeek: dayIndex as WeekMealItem["day_of_week"],
      mealType: mealTypeByIndex[mealIndex] ?? "snack",
      meal,
      scale: 1,
    }));

    const mainCandidates = usesFasting
      ? baseMeals.filter((item) => item.mealType !== "breakfast")
      : baseMeals;
    const targetMainMeals = Math.min(Math.max(mealsPerDay, 2), 3);
    const selectedMainMeals = mainCandidates.slice(0, targetMainMeals);
    while (selectedMainMeals.length < targetMainMeals && mainCandidates.length > 0) {
      selectedMainMeals.push({
        ...mainCandidates[selectedMainMeals.length % mainCandidates.length],
      });
    }
    const snackCandidates = mainCandidates.slice(selectedMainMeals.length);

    const snackSlots: PlannedMealSlot[] = [];
    if (snacksPerDay > 0) {
      for (let i = 0; i < snacksPerDay; i += 1) {
        const candidate = snackCandidates[i] ?? selectedMainMeals[i % selectedMainMeals.length];
        if (!candidate) continue;
        snackSlots.push({
          dayOfWeek: candidate.dayOfWeek,
          mealType: "snack",
          meal: candidate.meal,
          scale: snackCandidates[i] ? 1 : 0.5,
        });
      }
    }

    return [...selectedMainMeals, ...snackSlots];
  });

  const recipeDetails = await Promise.all(
    slots.map((item) => getRecipeInformation(item.meal.id)),
  );

  const items: WeekMealItem[] = slots.map((item, index) => {
    const details = recipeDetails[index];
    const nutrients = details.nutrition?.nutrients;

    const baseServings = Number(details.servings ?? item.meal.servings ?? 1);
    const servings = Math.max(0.5, Math.round(baseServings * item.scale * 10) / 10);
    const pricePerServing = Math.round(Number(details.pricePerServing ?? 0));
    const baseCostCents = Math.max(0, Math.round(pricePerServing * servings));

    return {
      id: crypto.randomUUID(),
      day_of_week: item.dayOfWeek,
      meal_type: item.mealType,
      title:
        item.mealType === "snack"
          ? `Snack: ${details.title ?? item.meal.title}`
          : details.title ?? item.meal.title,
      servings,
      calories: Math.max(0, Math.round(parseMacroValue(nutrients, "Calories") * item.scale)),
      macros: {
        protein_g: Math.max(0, Math.round(parseMacroValue(nutrients, "Protein") * item.scale)),
        carbs_g: Math.max(
          0,
          Math.round(parseMacroValue(nutrients, "Carbohydrates") * item.scale),
        ),
        fats_g: Math.max(0, Math.round(parseMacroValue(nutrients, "Fat") * item.scale)),
      },
      cost_cents: baseCostCents,
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
