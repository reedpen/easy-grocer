import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/ui/error-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { StatusChip } from "@/components/ui/status-chip";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentWeekLabel, getCurrentWeekStart, getMockWeekPlan } from "@/lib/mock-data";
import { formatHeight, formatWeight, type HeightUnit, type WeightUnit } from "@/lib/nutrition/units";
import { fetchWeekPlan } from "@/lib/planner/store";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DashboardProfile = {
  height_cm: number;
  weight_kg: number;
  preferred_height_unit: HeightUnit;
  preferred_weight_unit: WeightUnit;
  daily_calorie_target: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  goal: string;
  activity_level: string;
  updated_at: string;
};

export default async function DashboardPage() {
  const user = await requireUser();
  let loadError: string | null = null;
  let profile: DashboardProfile | null = null;
  let weekStart = getCurrentWeekStart();
  let weekPlan = getMockWeekPlan();

  const supabase = await createClient();
  const { data: loadedProfile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "height_cm,weight_kg,preferred_height_unit,preferred_weight_unit,daily_calorie_target,protein_g,carbs_g,fats_g,goal,activity_level,updated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    loadError = "Unable to load dashboard data right now. Please refresh.";
  }

  if (!loadedProfile) {
    redirect("/onboarding/profile");
  }

  const { data: dietaryPreferences, error: preferencesError } = await supabase
    .from("dietary_preferences")
    .select("weekly_budget_cents")
    .eq("user_id", user.id)
    .maybeSingle();

  if (preferencesError) {
    loadError = "Unable to load dashboard data right now. Please refresh.";
  }

  if (!dietaryPreferences) {
    redirect("/onboarding/preferences");
  }

  weekStart = getCurrentWeekStart();
  try {
    const existingWeekPlan = await fetchWeekPlan(user.id, weekStart);
    weekPlan =
      existingWeekPlan ??
      getMockWeekPlan(weekStart, dietaryPreferences.weekly_budget_cents);
  } catch {
    loadError = "Unable to load weekly plan summary right now.";
  }

  profile = loadedProfile as DashboardProfile;

  if (loadError || !profile) {
    return (
      <AppShell currentPath="/dashboard" weekLabel={getCurrentWeekLabel()}>
        <ErrorState message={loadError ?? "Dashboard data unavailable."} />
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/dashboard" weekLabel={getCurrentWeekLabel()}>
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.1em] text-text-secondary">
          Dashboard
        </p>
        <div className="eg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Goal: {profile.goal.replaceAll("_", " ")}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Daily target of {profile.daily_calorie_target} kcal with balanced macros.
              </p>
            </div>
            <StatusChip status={weekPlan.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/plan/${weekStart}`}>
              <PrimaryActionButton>Generate week</PrimaryActionButton>
            </Link>
            <Link href={`/plan/${weekStart}`}>
              <PrimaryActionButton variant="secondary">View plan</PrimaryActionButton>
            </Link>
            <Link href="/cart">
              <PrimaryActionButton variant="secondary">Review groceries</PrimaryActionButton>
            </Link>
            <Link href="/settings">
              <PrimaryActionButton variant="secondary">Edit settings</PrimaryActionButton>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Daily calories"
          value={`${profile.daily_calorie_target} kcal`}
        />
        <MetricCard label="Protein" value={`${profile.protein_g} g`} />
        <MetricCard label="Carbs" value={`${profile.carbs_g} g`} />
        <MetricCard label="Fats" value={`${profile.fats_g} g`} />
      </section>

      <section className="eg-card p-5">
        <h2 className="text-lg font-medium">Profile status</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-secondary">Goal</dt>
            <dd className="font-medium">{profile.goal.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Height</dt>
            <dd className="font-medium">
              {formatHeight(profile.height_cm, profile.preferred_height_unit)}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Weight</dt>
            <dd className="font-medium">
              {formatWeight(profile.weight_kg, profile.preferred_weight_unit)}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Activity level</dt>
            <dd className="font-medium">
              {profile.activity_level.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Last updated</dt>
            <dd className="font-medium">
              {new Date(profile.updated_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Onboarding</dt>
            <dd className="font-medium">Step 1 complete · Step 2 complete</dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}
