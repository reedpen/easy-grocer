export type BiologicalSex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Goal =
  | "weight_loss"
  | "maintenance"
  | "weight_gain"
  | "muscle_building";

type MacroRatios = {
  protein: number;
  carbs: number;
  fats: number;
};

export type NutritionTargets = {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
};

const activityMultiplier: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const goalDeltaCalories: Record<Goal, number> = {
  weight_loss: -500,
  maintenance: 0,
  weight_gain: 350,
  muscle_building: 250,
};

const macroRatiosByGoal: Record<Goal, MacroRatios> = {
  weight_loss: { protein: 0.35, carbs: 0.35, fats: 0.3 },
  maintenance: { protein: 0.3, carbs: 0.4, fats: 0.3 },
  weight_gain: { protein: 0.25, carbs: 0.5, fats: 0.25 },
  muscle_building: { protein: 0.3, carbs: 0.45, fats: 0.25 },
};

export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex,
) {
  const sexOffset = sex === "male" ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
}

export function calculateNutritionTargets(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  goal: Goal;
}): NutritionTargets {
  const bmr = calculateBmr(input.weightKg, input.heightCm, input.age, input.sex);
  const tdee = bmr * activityMultiplier[input.activityLevel];
  const dailyCalories = Math.max(1200, Math.round(tdee + goalDeltaCalories[input.goal]));
  const macroRatios = macroRatiosByGoal[input.goal];

  const proteinGrams = Math.round((dailyCalories * macroRatios.protein) / 4);
  const carbsGrams = Math.round((dailyCalories * macroRatios.carbs) / 4);
  const fatsGrams = Math.round((dailyCalories * macroRatios.fats) / 9);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalories,
    proteinGrams,
    carbsGrams,
    fatsGrams,
  };
}
