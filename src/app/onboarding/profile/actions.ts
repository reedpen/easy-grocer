"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { hasSupabaseEnv } from "@/lib/env";
import {
  type ActivityLevel,
  calculateNutritionTargets,
  type Goal,
  type BiologicalSex,
} from "@/lib/nutrition/tdee";
import {
  type HeightUnit,
  type WeightUnit,
} from "@/lib/nutrition/units";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  heightUnit: z.enum(["cm", "ft_in"]),
  heightCm: z.string().optional().default(""),
  heightFeet: z.string().optional().default(""),
  heightInches: z.string().optional().default(""),
  weightUnit: z.enum(["kg", "lb"]),
  weightKg: z.string().optional().default(""),
  weightLb: z.string().optional().default(""),
  age: z.coerce.number().int().min(15).max(100),
  sex: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["weight_loss", "maintenance", "weight_gain", "muscle_building"]),
  redirectTo: z.string().optional().default(""),
});

export type ProfileActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const defaultState: ProfileActionState = { status: "idle" };

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeMetricInputs(payload: z.infer<typeof profileSchema>) {
  let heightCm: number | null = null;
  if (payload.heightUnit === "cm") {
    heightCm = parsePositiveNumber(payload.heightCm);
  } else {
    const feet = parsePositiveNumber(payload.heightFeet);
    const rawInches = payload.heightInches.trim();
    const inches = rawInches ? Number(rawInches) : 0;
    if (
      feet === null ||
      !Number.isFinite(inches) ||
      inches < 0 ||
      inches >= 12
    ) {
      return { error: "Enter a valid height in feet and inches." } as const;
    }
    heightCm = (feet * 12 + inches) * 2.54;
  }

  if (heightCm === null || heightCm < 120 || heightCm > 250) {
    return {
      error: "Height must be between 120 and 250 cm (about 3'11\" to 8'2\").",
    } as const;
  }

  let weightKg: number | null = null;
  if (payload.weightUnit === "kg") {
    weightKg = parsePositiveNumber(payload.weightKg);
  } else {
    const weightLb = parsePositiveNumber(payload.weightLb);
    if (weightLb === null) {
      return { error: "Enter a valid weight in pounds." } as const;
    }
    weightKg = weightLb * 0.45359237;
  }

  if (weightKg === null || weightKg < 35 || weightKg > 300) {
    return {
      error: "Weight must be between 35 and 300 kg (about 77 to 661 lb).",
    } as const;
  }

  return {
    heightCm: Math.round(heightCm * 10) / 10,
    weightKg: Math.round(weightKg * 10) / 10,
  } as const;
}

function sanitizeNextPath(candidate: string) {
  if (!candidate) return "/onboarding/preferences";
  if (!candidate.startsWith("/")) return "/onboarding/preferences";
  if (candidate.startsWith("//")) return "/onboarding/preferences";
  return candidate;
}

export async function saveProfile(
  previous: ProfileActionState = defaultState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    if (!hasSupabaseEnv()) {
      return {
        status: "error",
        message:
          "Supabase is not configured. Add env values before saving profile.",
      };
    }

    void previous;
    const user = await requireUser();
    const parsed = profileSchema.safeParse({
      heightUnit: formData.get("heightUnit"),
      heightCm: formData.get("heightCm"),
      heightFeet: formData.get("heightFeet"),
      heightInches: formData.get("heightInches"),
      weightUnit: formData.get("weightUnit"),
      weightKg: formData.get("weightKg"),
      weightLb: formData.get("weightLb"),
      age: formData.get("age"),
      sex: formData.get("sex"),
      activityLevel: formData.get("activityLevel"),
      goal: formData.get("goal"),
      redirectTo: formData.get("redirectTo"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid form values.",
      };
    }

    const payload = parsed.data;
    const normalized = normalizeMetricInputs(payload);
    if ("error" in normalized) {
      return {
        status: "error",
        message: normalized.error,
      };
    }

    const targets = calculateNutritionTargets({
      weightKg: normalized.weightKg,
      heightCm: normalized.heightCm,
      age: payload.age,
      sex: payload.sex as BiologicalSex,
      activityLevel: payload.activityLevel as ActivityLevel,
      goal: payload.goal as Goal,
    });

    const supabase = await createClient();
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      height_cm: normalized.heightCm,
      weight_kg: normalized.weightKg,
      preferred_height_unit: payload.heightUnit as HeightUnit,
      preferred_weight_unit: payload.weightUnit as WeightUnit,
      age: payload.age,
      sex: payload.sex,
      activity_level: payload.activityLevel,
      goal: payload.goal,
      bmr: targets.bmr,
      tdee: targets.tdee,
      daily_calorie_target: targets.dailyCalories,
      protein_g: targets.proteinGrams,
      carbs_g: targets.carbsGrams,
      fats_g: targets.fatsGrams,
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    const nextPath = sanitizeNextPath(payload.redirectTo);
    redirect(nextPath);
  } catch {
    return {
      status: "error",
      message: "Could not save profile. Please try again.",
    };
  }
}
