import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/ui/error-state";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentWeekLabel } from "@/lib/mock-data";
import { cmToFeetInches, kgToLb } from "@/lib/nutrition/units";
import { createClient } from "@/lib/supabase/server";
import { PreferencesForm } from "@/app/onboarding/preferences/preferences-form";
import { ProfileForm } from "@/app/onboarding/profile/profile-form";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{ updated?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await requireUser();
  const query = await searchParams;
  let loadError: string | null = null;

  const supabase = await createClient();
  const [{ data: profile, error: profileError }, { data: dietary, error: dietaryError }, { data: fasting, error: fastingError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "height_cm,weight_kg,preferred_height_unit,preferred_weight_unit,age,sex,activity_level,goal",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("dietary_preferences")
        .select(
          "restrictions,intolerances,liked_cuisines,disliked_ingredients,weekly_budget_cents,meals_per_day,include_snacks,snacks_per_day",
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
    loadError = "Unable to load settings right now. Please refresh and try again.";
  }

  if (!profile) {
    redirect("/onboarding/profile");
  }

  const preferredHeightUnit = profile.preferred_height_unit as "cm" | "ft_in";
  const preferredWeightUnit = profile.preferred_weight_unit as "kg" | "lb";
  const convertedHeight = cmToFeetInches(Number(profile.height_cm));
  const convertedWeightLb = kgToLb(Number(profile.weight_kg));

  const profileDraft = {
    age: String(profile.age),
    sex: profile.sex as string,
    activityLevel: profile.activity_level as string,
    goal: profile.goal as string,
    heightUnit: preferredHeightUnit,
    heightCm: String(profile.height_cm),
    heightFeet: String(convertedHeight.feet),
    heightInches: String(convertedHeight.inches),
    weightUnit: preferredWeightUnit,
    weightKg: String(profile.weight_kg),
    weightLb: String(Math.round(convertedWeightLb * 10) / 10),
  };

  const eatingWindow =
    fasting?.window_start_time && fasting?.window_end_time
      ? `${String(fasting.window_start_time).slice(0, 5)} - ${String(fasting.window_end_time).slice(0, 5)}`
      : "";

  const preferencesDraft = {
    restrictions: dietary?.restrictions ?? [],
    intolerances: dietary?.intolerances ?? [],
    likedCuisines: dietary?.liked_cuisines ?? [],
    dislikedIngredients: dietary?.disliked_ingredients ?? [],
    weeklyBudget: dietary?.weekly_budget_cents
      ? String(dietary.weekly_budget_cents / 100)
      : "",
    mealsPerDay: dietary?.meals_per_day ? String(dietary.meals_per_day) : "3",
    includeSnacks: Boolean(dietary?.include_snacks),
    snacksPerDay: dietary?.snacks_per_day ? String(dietary.snacks_per_day) : "1",
    fastingPattern: fasting?.pattern ?? "",
    eatingWindow,
  };

  return (
    <AppShell currentPath="/settings" weekLabel={getCurrentWeekLabel()}>
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-text-secondary">
            Update any onboarding information without restarting setup.
          </p>
          {query.updated ? (
            <p className="text-sm font-medium text-emerald-700">
              Saved {query.updated === "profile" ? "profile" : "preferences"} changes.
            </p>
          ) : null}
        </header>

        {loadError ? <ErrorState message={loadError} /> : null}

        <ProfileForm
          initialDraft={profileDraft}
          redirectTo="/settings?updated=profile"
          stepLabel="Profile"
          title="Body metrics and goals"
          description="These settings update nutrition targets and plan calculations."
          submitLabel="Save profile settings"
        />

        <PreferencesForm
          initialDraft={preferencesDraft}
          redirectTo="/settings?updated=preferences"
          stepLabel="Food and schedule"
          title="Preferences, fasting, and meal cadence"
          submitLabel="Save preference settings"
        />
      </section>
    </AppShell>
  );
}
