"use client";

import { useMemo, useState } from "react";
import { MealCard } from "@/components/ui/meal-card";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { StatusChip } from "@/components/ui/status-chip";
import type { WeekPlan } from "@/lib/planner/types";

const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const browser = globalThis as { confirm?: (message?: string) => boolean };

function asCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type PlanViewProps = {
  weekPlan: WeekPlan;
  readOnly?: boolean;
};

export function PlanView({ weekPlan, readOnly = false }: PlanViewProps) {
  const [items, setItems] = useState(weekPlan.items);
  const [locked, setLocked] = useState(weekPlan.status !== "draft" || readOnly);
  const [status, setStatus] = useState(readOnly ? "confirmed" : weekPlan.status);
  const [flash, setFlash] = useState<string | null>(null);

  function pushFlash(message: string) {
    setFlash(message);
    setTimeout(() => setFlash(null), 1800);
  }

  const totalCost = weekPlan.total_cost_cents;
  const budgetDelta = totalCost - weekPlan.budget_cents;

  const itemsByDay = useMemo(
    () =>
      dayLabels.map((_, dayOfWeek) =>
        items.filter((item) => item.day_of_week === dayOfWeek),
      ),
    [items],
  );

  function removeMeal(id: string) {
    if (!browser.confirm?.("Remove this meal from the current week plan?")) return;
    setItems((previous) => previous.filter((item) => item.id !== id));
    pushFlash("Meal removed.");
  }

  function replaceMeal(id: string) {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, title: `${item.title} (alternate)`, calories: Math.max(200, item.calories - 40) }
          : item,
      ),
    );
    pushFlash("Meal replaced.");
  }

  function addSnack(dayOfWeek: number) {
    setItems((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        day_of_week: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        meal_type: "snack",
        title: "Protein snack pack",
        servings: 1,
        calories: 230,
        macros: { protein_g: 18, carbs_g: 16, fats_g: 10 },
      },
    ]);
    pushFlash("Snack added.");
  }

  function confirmPlan() {
    setLocked(true);
    setStatus("confirmed");
    pushFlash("Plan confirmed. Editing is now locked.");
  }

  return (
    <section className="space-y-5">
      <header className="eg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-secondary">Weekly estimated cost</p>
            <p className="text-2xl font-semibold tracking-tight">{asCurrency(totalCost)}</p>
            <p className={budgetDelta > 0 ? "text-sm text-warning" : "text-sm text-text-secondary"}>
              {budgetDelta > 0
                ? `${asCurrency(Math.abs(budgetDelta))} over budget`
                : `${asCurrency(Math.abs(budgetDelta))} under budget`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip status={status} />
            <PrimaryActionButton type="button" onClick={confirmPlan} disabled={locked}>
              Confirm plan
            </PrimaryActionButton>
          </div>
        </div>
        {readOnly ? (
          <p className="mt-3 text-sm text-text-secondary">
            Snapshot mode is read-only for historical plans.
          </p>
        ) : null}
        {flash ? <p className="mt-3 text-sm text-success">{flash}</p> : null}
      </header>

      <section className="grid gap-4 xl:grid-cols-2">
        {itemsByDay.map((dayItems, dayIndex) => {
          const dailyCalories = dayItems.reduce((sum, item) => sum + item.calories, 0);
          const protein = dayItems.reduce((sum, item) => sum + item.macros.protein_g, 0);
          const carbs = dayItems.reduce((sum, item) => sum + item.macros.carbs_g, 0);
          const fats = dayItems.reduce((sum, item) => sum + item.macros.fats_g, 0);

          return (
            <article key={dayLabels[dayIndex]} className="space-y-3">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{dayLabels[dayIndex]}</h2>
                <p className="text-sm text-text-secondary">{dayItems.length} meals</p>
              </header>
              {dayItems.length > 0 ? (
                dayItems.map((item) => (
                  <MealCard
                    key={item.id}
                    item={item}
                    onRemove={removeMeal}
                    onReplace={replaceMeal}
                    onAddSnack={addSnack}
                    locked={locked}
                  />
                ))
              ) : (
                <article className="eg-card p-4 text-sm text-text-secondary">
                  No meals added yet for this day.
                </article>
              )}
              <footer className="eg-card flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <p className="font-medium">{dailyCalories} kcal total</p>
                <p className="text-text-secondary">
                  P {protein}g · C {carbs}g · F {fats}g
                </p>
              </footer>
            </article>
          );
        })}
      </section>
    </section>
  );
}
