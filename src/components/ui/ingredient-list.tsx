export type GroceryLineItem = {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
  category: string;
};

function asCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

type IngredientListProps = {
  items: GroceryLineItem[];
};

export function IngredientList({ items }: IngredientListProps) {
  const grouped = Object.groupBy(items, ({ category }) => category);
  const categories = Object.keys(grouped).sort();

  return (
    <section className="space-y-4">
      {categories.map((category) => {
        const categoryItems = grouped[category] ?? [];
        return (
          <article key={category} className="eg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
              {category}
            </h2>
            <ul className="mt-3 space-y-3">
              {categoryItems.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-1 border-b border-border/70 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-medium">{item.ingredient_name}</p>
                    <p className="text-sm text-text-secondary">
                      {item.quantity} {item.unit} · {asCurrency(item.unit_price_cents)} each
                    </p>
                  </div>
                  <p className="text-sm font-medium">{asCurrency(item.line_total_cents)}</p>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
