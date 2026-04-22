"use client";

import { useMemo, useState, useTransition } from "react";
import { MealCard } from "@/components/ui/meal-card";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { StatusChip } from "@/components/ui/status-chip";
import type { WeekPlan } from "@/lib/planner/types";
import { applyPlanTweakAction } from "./actions";

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
  const [status, setStatus] = useState(weekPlan.status);
  const [flash, setFlash] = useState<string | null>(null);
  const [flashTone, setFlashTone] = useState<"success" | "error">("success");
  const [isPending, startTransition] = useTransition();

  function pushFlash(message: string, tone: "success" | "error" = "success") {
    setFlashTone(tone);
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

  function runTweak(
    tweak:
      | { type: "remove_meal"; mealId: string }
      | { type: "replace_meal"; mealId: string }
      | { type: "add_tweak"; dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; preset: "protein_bar" | "sweet_treat" }
      | { type: "confirm_plan" },
    successMessage: string,
  ) {
    startTransition(async () => {
      const result = await applyPlanTweakAction({
        weekStart: weekPlan.week_start_date,
        tweak,
      });

      if (!result.ok) {
        pushFlash(result.message, "error");
        return;
      }

      setItems(result.weekPlan.items);
      setStatus(result.weekPlan.status);
      setLocked(result.weekPlan.status !== "draft" || readOnly);
      pushFlash(successMessage, "success");
    });
  }

  function removeMeal(id: string) {
    if (!browser.confirm?.("Remove this meal from the current week plan?")) return;
    runTweak({ type: "remove_meal", mealId: id }, "Meal removed.");
  }

  function replaceMeal(id: string) {
    runTweak({ type: "replace_meal", mealId: id }, "Meal replaced.");
  }

  function addTweak(
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6,
    preset: "protein_bar" | "sweet_treat",
  ) {
    const label = preset === "protein_bar" ? "Protein bar added." : "Sweet treat added.";
    runTweak({ type: "add_tweak", dayOfWeek, preset }, label);
  }

  function confirmPlan() {
    runTweak(
      { type: "confirm_plan" },
      "Plan confirmed. Editing is now locked.",
    );
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
            <PrimaryActionButton
              type="button"
              onClick={confirmPlan}
              disabled={locked || isPending}
            >
              Confirm plan
            </PrimaryActionButton>
          </div>
        </div>
        {readOnly ? (
          <p className="mt-3 text-sm text-text-secondary">
            Snapshot mode is read-only for historical plans.
          </p>
        ) : null}
        {flash ? (
          <p className={`mt-3 text-sm ${flashTone === "error" ? "text-danger" : "text-success"}`}>
            {flash}
          </p>
        ) : null}
        {isPending ? (
          <p className="mt-2 text-xs text-text-secondary">Saving plan updates...</p>
        ) : null}
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-text-secondary">{dayItems.length} meals</p>
                  <PrimaryActionButton
                    type="button"
                    variant="ghost"
                    onClick={() => addTweak(dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6, "protein_bar")}
                    disabled={locked || isPending}
                  >
                    + Protein bar
                  </PrimaryActionButton>
                  <PrimaryActionButton
                    type="button"
                    variant="ghost"
                    onClick={() => addTweak(dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6, "sweet_treat")}
                    disabled={locked || isPending}
                  >
                    + Sweet treat
                  </PrimaryActionButton>
                </div>
              </header>
              {dayItems.length > 0 ? (
                dayItems.map((item) => (
                  <MealCard
                    key={item.id}
                    item={item}
                    onRemove={removeMeal}
                    onReplace={replaceMeal}
                    locked={locked}
                    pending={isPending}
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
