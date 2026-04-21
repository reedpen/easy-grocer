type BudgetProgressProps = {
  totalCents: number;
  budgetCents: number;
};

function asCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function BudgetProgress({ totalCents, budgetCents }: BudgetProgressProps) {
  const ratio = budgetCents > 0 ? totalCents / budgetCents : 0;
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const overBudget = totalCents > budgetCents;
  const delta = totalCents - budgetCents;

  return (
    <section className="eg-card p-5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <p className="font-medium">Budget progress</p>
        <p className={overBudget ? "text-warning" : "text-text-secondary"}>
          {delta > 0 ? `${asCurrency(delta)} over` : `${asCurrency(Math.abs(delta))} left`}
        </p>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-strong">
        <div
          className={`h-full rounded-full transition-all ${
            overBudget ? "bg-warning" : "bg-primary"
          }`}
          style={{ width: `${Math.round(clamped * 100)}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-text-secondary">
        {asCurrency(totalCents)} of {asCurrency(budgetCents)}
      </p>
    </section>
  );
}
