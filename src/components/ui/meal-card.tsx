import { PrimaryActionButton } from "@/components/ui/primary-action-button";

type MacroTotals = {
  protein_g: number;
  carbs_g: number;
  fats_g: number;
};

export type MealPlanItem = {
  id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  title: string;
  servings: number;
  calories: number;
  macros: MacroTotals;
};

type MealCardProps = {
  item: MealPlanItem;
  onRemove: (id: string) => void;
  onReplace: (id: string) => void;
  onAddSnack: (dayOfWeek: MealPlanItem["day_of_week"]) => void;
  locked?: boolean;
};

export function MealCard({
  item,
  onRemove,
  onReplace,
  onAddSnack,
  locked = false,
}: MealCardProps) {
  return (
    <article className="eg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{item.title}</h3>
          <p className="mt-1 text-sm capitalize text-text-secondary">
            {item.meal_type} · {item.servings} serving{item.servings > 1 ? "s" : ""}
          </p>
        </div>
        <p className="text-sm font-medium">{item.calories} kcal</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <p>Protein {item.macros.protein_g}g</p>
        <p>Carbs {item.macros.carbs_g}g</p>
        <p>Fats {item.macros.fats_g}g</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PrimaryActionButton
          type="button"
          variant="secondary"
          onClick={() => onRemove(item.id)}
          disabled={locked}
        >
          Remove
        </PrimaryActionButton>
        <PrimaryActionButton
          type="button"
          variant="secondary"
          onClick={() => onReplace(item.id)}
          disabled={locked}
        >
          Replace
        </PrimaryActionButton>
        <PrimaryActionButton
          type="button"
          variant="ghost"
          onClick={() => onAddSnack(item.day_of_week)}
          disabled={locked}
        >
          Add snack
        </PrimaryActionButton>
      </div>
    </article>
  );
}
