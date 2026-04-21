import { requireUser } from "@/lib/auth/guards";
import { ErrorState } from "@/components/ui/error-state";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PreferencesForm } from "./preferences-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPreferencesPage() {
  const user = await requireUser();
  let loadError: string | null = null;
  let initialDraft: Parameters<typeof PreferencesForm>[0]["initialDraft"] = {};

  const supabase = await createClient();

  const [{ data: profile, error: profileError }, { data: dietary, error: dietaryError }, { data: fasting, error: fastingError }] =
    await Promise.all([
      supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("dietary_preferences")
        .select(
          "restrictions,intolerances,liked_cuisines,disliked_ingredients,weekly_budget_cents",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("fasting_schedules")
        .select("pattern,window_start_time,window_end_time")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (profileError || dietaryError || fastingError) {
    loadError = "Unable to load preferences right now. Please try again.";
  }

  if (!profile) {
    redirect("/onboarding/profile");
  }

  const eatingWindow =
    fasting?.window_start_time && fasting?.window_end_time
      ? `${String(fasting.window_start_time).slice(0, 5)} - ${String(fasting.window_end_time).slice(0, 5)}`
      : "";

  initialDraft = {
    restrictions: dietary?.restrictions ?? [],
    intolerances: dietary?.intolerances ?? [],
    likedCuisines: dietary?.liked_cuisines ?? [],
    dislikedIngredients: dietary?.disliked_ingredients ?? [],
    weeklyBudget: dietary?.weekly_budget_cents
      ? String(dietary.weekly_budget_cents / 100)
      : "",
    fastingPattern: fasting?.pattern ?? "",
    eatingWindow,
  };

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-6 py-10">
        <ErrorState message={loadError} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-6 py-10">
      <PreferencesForm initialDraft={initialDraft} />
    </main>
  );
}
