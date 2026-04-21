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
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  heightCm: z.coerce.number().min(120).max(250),
  weightKg: z.coerce.number().min(35).max(300),
  age: z.coerce.number().int().min(15).max(100),
  sex: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["weight_loss", "maintenance", "weight_gain", "muscle_building"]),
});

export type ProfileActionState = {
  status: "idle" | "error";
  message?: string;
};

const defaultState: ProfileActionState = { status: "idle" };

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
      heightCm: formData.get("heightCm"),
      weightKg: formData.get("weightKg"),
      age: formData.get("age"),
      sex: formData.get("sex"),
      activityLevel: formData.get("activityLevel"),
      goal: formData.get("goal"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid form values.",
      };
    }

    const payload = parsed.data;
    const targets = calculateNutritionTargets({
      weightKg: payload.weightKg,
      heightCm: payload.heightCm,
      age: payload.age,
      sex: payload.sex as BiologicalSex,
      activityLevel: payload.activityLevel as ActivityLevel,
      goal: payload.goal as Goal,
    });

    const supabase = await createClient();
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      height_cm: payload.heightCm,
      weight_kg: payload.weightKg,
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
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    redirect("/onboarding/preferences");
  } catch {
    return {
      status: "error",
      message: "Could not save profile. Please try again.",
    };
  }
}
