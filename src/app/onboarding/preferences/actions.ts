"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const arrayField = z
  .string()
  .transform((raw) => {
    if (!raw) return [] as string[];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .slice(0, 30)
        .filter(Boolean);
    } catch {
      return [] as string[];
    }
  })
  .pipe(z.array(z.string().min(1).max(80)));

const preferencesSchema = z.object({
  restrictions: arrayField,
  intolerances: arrayField,
  likedCuisines: arrayField,
  dislikedIngredients: arrayField,
  weeklyBudget: z.coerce.number().min(0).max(5000).optional().default(0),
  fastingPattern: z.string().trim().max(30).optional().default(""),
  eatingWindow: z.string().trim().max(30).optional().default(""),
});

export type PreferencesActionState = {
  status: "idle" | "error";
  message?: string;
};

const defaultState: PreferencesActionState = { status: "idle" };

function parseEatingWindow(window: string) {
  if (!window) {
    return { start: null as string | null, end: null as string | null };
  }

  const normalized = window.replace(/\s+/g, "");
  const [start, end] = normalized.split("-");
  const hhmm = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;
  if (!start || !end || !hhmm.test(start) || !hhmm.test(end)) {
    return { start: null as string | null, end: null as string | null };
  }

  const normalizeHour = (value: string) => {
    const [hour, minute] = value.split(":");
    return `${hour.padStart(2, "0")}:${minute}:00`;
  };

  return { start: normalizeHour(start), end: normalizeHour(end) };
}

export async function savePreferences(
  previous: PreferencesActionState = defaultState,
  formData: FormData,
): Promise<PreferencesActionState> {
  try {
    void previous;

    if (!hasSupabaseEnv()) {
      return {
        status: "error",
        message:
          "Supabase is not configured. Add env values before saving preferences.",
      };
    }

    const user = await requireUser();
    const parsed = preferencesSchema.safeParse({
      restrictions: formData.get("restrictions"),
      intolerances: formData.get("intolerances"),
      likedCuisines: formData.get("likedCuisines"),
      dislikedIngredients: formData.get("dislikedIngredients"),
      weeklyBudget: formData.get("weeklyBudget"),
      fastingPattern: formData.get("fastingPattern"),
      eatingWindow: formData.get("eatingWindow"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid form values.",
      };
    }

    const data = parsed.data;
    const supabase = await createClient();
    const now = new Date().toISOString();
    const weeklyBudgetCents = Math.round(data.weeklyBudget * 100);

    const { error: preferencesError } = await supabase
      .from("dietary_preferences")
      .upsert({
        user_id: user.id,
        restrictions: data.restrictions,
        intolerances: data.intolerances,
        liked_cuisines: data.likedCuisines,
        disliked_ingredients: data.dislikedIngredients,
        weekly_budget_cents: weeklyBudgetCents,
        updated_at: now,
      });

    if (preferencesError) {
      return { status: "error", message: preferencesError.message };
    }

    const { start, end } = parseEatingWindow(data.eatingWindow);
    const pattern = data.fastingPattern || null;

    const { error: fastingError } = await supabase
      .from("fasting_schedules")
      .upsert({
        user_id: user.id,
        pattern,
        active_days: [],
        window_start_time: start,
        window_end_time: end,
        updated_at: now,
      });

    if (fastingError) {
      return { status: "error", message: fastingError.message };
    }

    redirect("/dashboard");
  } catch {
    return {
      status: "error",
      message: "Could not save preferences. Please try again.",
    };
  }
}
