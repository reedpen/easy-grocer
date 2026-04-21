import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { BudgetProgress } from "@/components/ui/budget-progress";
import { ErrorState } from "@/components/ui/error-state";
import { IngredientList } from "@/components/ui/ingredient-list";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentWeekLabel, getMockGroceryList, getMockWeekPlan } from "@/lib/mock-data";
import {
  buildGroceryItemsFromWeekPlan,
  buildWalmartCartUrlFromWeekPlan,
} from "@/lib/planner/service";
import { fetchMostRecentWeekPlan } from "@/lib/planner/store";
import { WalmartHandoffButton } from "./walmart-handoff-button";

export const dynamic = "force-dynamic";

function asCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function CartPage() {
  const user = await requireUser();
  let loadError: string | null = null;
  let weekPlan = getMockWeekPlan();
  let groceryList = getMockGroceryList();

  try {
    const latestPlan = await fetchMostRecentWeekPlan(user.id);
    weekPlan = latestPlan ?? getMockWeekPlan();
    groceryList = latestPlan
      ? {
          id: `grocery-${latestPlan.id}`,
          provider: "walmart" as const,
          cart_url: buildWalmartCartUrlFromWeekPlan(latestPlan),
          estimated_total_cents: latestPlan.total_cost_cents,
          items: buildGroceryItemsFromWeekPlan(latestPlan),
        }
      : getMockGroceryList();
  } catch {
    loadError = "Unable to load grocery list right now. Please try again in a moment.";
  }

  if (loadError) {
    return (
      <AppShell currentPath="/cart" weekLabel={getCurrentWeekLabel()}>
        <ErrorState message={loadError} />
      </AppShell>
    );
  }

  const budgetDelta = groceryList.estimated_total_cents - weekPlan.budget_cents;

  return (
    <AppShell currentPath="/cart" weekLabel={getCurrentWeekLabel()}>
      <section className="space-y-5">
        <header className="grid gap-4 lg:grid-cols-3">
          <article className="eg-card p-5">
            <p className="text-sm text-text-secondary">Estimated total spend</p>
            <p className="mt-2 text-2xl font-semibold">
              {asCurrency(groceryList.estimated_total_cents)}
            </p>
          </article>
          <article className="eg-card p-5">
            <p className="text-sm text-text-secondary">Budget delta</p>
            <p className={`mt-2 text-2xl font-semibold ${budgetDelta > 0 ? "text-warning" : ""}`}>
              {budgetDelta > 0 ? "+" : "-"}
              {asCurrency(Math.abs(budgetDelta))}
            </p>
          </article>
          <BudgetProgress
            totalCents={groceryList.estimated_total_cents}
            budgetCents={weekPlan.budget_cents}
          />
        </header>

        <IngredientList items={groceryList.items} />

        <footer className="eg-card space-y-3 p-5">
          <WalmartHandoffButton cartUrl={groceryList.cart_url} />
          <p className="text-sm text-text-secondary">
            Checkout and fulfillment happen on Walmart after handoff.
          </p>
          <Link href="/plan/current-week">
            <PrimaryActionButton variant="ghost" className="w-full">
              Back to plan
            </PrimaryActionButton>
          </Link>
        </footer>
      </section>
    </AppShell>
  );
}
