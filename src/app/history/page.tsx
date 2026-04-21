import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentWeekLabel, getMockHistory } from "@/lib/mock-data";
import type { HistoryItem } from "@/lib/planner/types";
import { fetchPlanHistory } from "@/lib/planner/store";

export const dynamic = "force-dynamic";

function asCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function HistoryPage() {
  const user = await requireUser();
  let loadError: string | null = null;
  let history: HistoryItem[] = getMockHistory();

  try {
    const storedHistory = await fetchPlanHistory(user.id);
    history = storedHistory.length > 0 ? storedHistory : getMockHistory();
  } catch {
    loadError = "Unable to load plan history right now. Please refresh to try again.";
  }

  if (loadError) {
    return (
      <AppShell currentPath="/history" weekLabel={getCurrentWeekLabel()}>
        <ErrorState message={loadError} />
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/history" weekLabel={getCurrentWeekLabel()}>
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Plan history</h1>
          <p className="text-sm text-text-secondary">
            Browse prior plan snapshots and weekly spending outcomes.
          </p>
        </header>

        <ul className="space-y-3">
          {history.map((item) => (
            <li key={item.id} className="eg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-text-secondary">Week start</p>
                  <p className="text-lg font-semibold">{item.week_start_date}</p>
                </div>
                <StatusChip status={item.status} size="compact" />
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-text-secondary">Avg calories/day</dt>
                  <dd className="font-medium">{item.avg_calories_per_day} kcal</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Estimated total cost</dt>
                  <dd className="font-medium">{asCurrency(item.estimated_total_cents)}</dd>
                </div>
              </dl>
              <Link
                href={`/plan/${item.week_start_date}?snapshot=1`}
                className="mt-4 inline-flex min-h-11 items-center rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-strong"
              >
                View snapshot
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
