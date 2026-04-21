const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

export type SpoonGenerateWeekResponse = {
  week: {
    monday: SpoonDayPlan;
    tuesday: SpoonDayPlan;
    wednesday: SpoonDayPlan;
    thursday: SpoonDayPlan;
    friday: SpoonDayPlan;
    saturday: SpoonDayPlan;
    sunday: SpoonDayPlan;
  };
};

export type SpoonDayPlan = {
  meals: Array<{
    id: number;
    title: string;
    readyInMinutes: number;
    servings: number;
    sourceUrl?: string;
  }>;
  nutrients?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
  };
};

export type SpoonRecipeInformation = {
  id: number;
  title: string;
  servings?: number;
  pricePerServing?: number;
  nutrition?: {
    nutrients?: Array<{ name?: string; amount?: number }>;
  };
  extendedIngredients?: Array<{
    aisle?: string;
    name?: string;
    nameClean?: string;
    amount?: number;
    unit?: string;
  }>;
};

function getSpoonacularApiKey() {
  return process.env.SPOONACULAR_API_KEY ?? "";
}

export function hasSpoonacularApiKey() {
  return Boolean(getSpoonacularApiKey());
}

async function spoonFetch<T>(path: string, params: Record<string, string | number>) {
  const apiKey = getSpoonacularApiKey();
  if (!apiKey) {
    throw new Error("SPOONACULAR_API_KEY is missing.");
  }

  const query = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
    apiKey,
  });

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(
        `${SPOONACULAR_BASE_URL}${path}?${query.toString()}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text();
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          attempt += 1;
          continue;
        }
        throw new Error(`Spoonacular error ${response.status}: ${body}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      const isAbortError =
        error instanceof Error && error.name === "AbortError";
      if ((isAbortError || attempt < MAX_RETRIES) && attempt < MAX_RETRIES) {
        attempt += 1;
        continue;
      }
      throw new Error("Failed to reach Spoonacular API.");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("Failed to fetch Spoonacular response.");
}

export async function generateWeeklyMealPlan(input: {
  targetCalories: number;
  diet?: string;
  intolerances?: string[];
  excludeIngredients?: string[];
}) {
  return spoonFetch<SpoonGenerateWeekResponse>("/mealplanner/generate", {
    timeFrame: "week",
    targetCalories: input.targetCalories,
    ...(input.diet ? { diet: input.diet } : {}),
    ...(input.intolerances?.length
      ? { intolerances: input.intolerances.join(",") }
      : {}),
    ...(input.excludeIngredients?.length
      ? { exclude: input.excludeIngredients.join(",") }
      : {}),
  });
}

export async function getRecipeInformation(recipeId: number) {
  return spoonFetch<SpoonRecipeInformation>(`/recipes/${recipeId}/information`, {
    includeNutrition: "true",
  });
}
