import { AppShell } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/ui/error-state";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentWeekLabel } from "@/lib/mock-data";
import { getOrCreateWeekPlan } from "@/lib/planner/service";
import { PlanView } from "./plan-view";

export const dynamic = "force-dynamic";

type PlanPageProps = {
  params: Promise<{ weekStart: string }>;
  searchParams: Promise<{ snapshot?: string }>;
};

export default async function PlanPage({ params, searchParams }: PlanPageProps) {
  const user = await requireUser();
  let loadError: string | null = null;
  let readOnly = false;
  let weekPlan: Awaited<ReturnType<typeof getOrCreateWeekPlan>> | null = null;

  try {
    const { weekStart } = await params;
    const query = await searchParams;
    readOnly = query.snapshot === "1";
    weekPlan = await getOrCreateWeekPlan(user.id, weekStart);
  } catch {
    loadError = "Unable to load this week plan right now. Please refresh and try again.";
  }

  if (loadError || !weekPlan) {
    return (
      <AppShell currentPath="/plan/current-week" weekLabel={getCurrentWeekLabel()}>
        <ErrorState message={loadError ?? "Week plan unavailable."} />
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/plan/current-week" weekLabel={getCurrentWeekLabel()}>
      <PlanView weekPlan={weekPlan} readOnly={readOnly} />
    </AppShell>
  );
}
