"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { cn } from "@/lib/ui";
import {
  savePreferences,
  type PreferencesActionState,
} from "@/app/onboarding/preferences/actions";

type PreferenceDraft = {
  restrictions: string[];
  intolerances: string[];
  likedCuisines: string[];
  dislikedIngredients: string[];
  weeklyBudget: string;
  fastingPattern: string;
  eatingWindow: string;
};

const STORAGE_KEY = "easy-grocer-preferences-draft";

const restrictionOptions = ["Vegan", "Vegetarian", "Gluten-free", "Dairy-free", "Halal"];
const intoleranceOptions = ["Lactose", "Peanuts", "Tree nuts", "Shellfish", "Soy"];
const cuisineOptions = ["Mediterranean", "Mexican", "Indian", "Japanese", "American"];

const defaultDraft: PreferenceDraft = {
  restrictions: [],
  intolerances: [],
  likedCuisines: [],
  dislikedIngredients: [],
  weeklyBudget: "",
  fastingPattern: "",
  eatingWindow: "",
};

type PreferencesFormProps = {
  initialDraft?: Partial<PreferenceDraft>;
};

const browser = globalThis as {
  sessionStorage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
};

function loadStoredDraft(): PreferenceDraft {
  if (!browser.sessionStorage) {
    return defaultDraft;
  }

  const raw = browser.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultDraft;
  }

  try {
    return { ...defaultDraft, ...(JSON.parse(raw) as PreferenceDraft) };
  } catch {
    browser.sessionStorage.removeItem(STORAGE_KEY);
    return defaultDraft;
  }
}

function ChipGroup({
  title,
  options,
  values,
  onToggle,
}: {
  title: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={cn(
                "min-h-11 rounded-full border px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                selected
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-strong",
              )}
              aria-pressed={selected}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const initialActionState: PreferencesActionState = { status: "idle" };

export function PreferencesForm({ initialDraft }: PreferencesFormProps) {
  const [actionState, formAction, isPending] = useActionState(
    savePreferences,
    initialActionState,
  );
  const [draft, setDraft] = useState<PreferenceDraft>(() => ({
    ...loadStoredDraft(),
    ...initialDraft,
  }));
  const [dislikedInput, setDislikedInput] = useState("");

  useEffect(() => {
    if (!browser.sessionStorage) {
      return;
    }
    browser.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const validationHint = useMemo(() => {
    if (!draft.weeklyBudget) {
      return "Add a weekly budget to personalize grocery cost alerts.";
    }
    if (!draft.eatingWindow) {
      return "Include an eating window so snack timing can adapt.";
    }
    return "Looks good. You can edit these anytime in settings.";
  }, [draft.eatingWindow, draft.weeklyBudget]);

  function toggleValue(field: "restrictions" | "intolerances" | "likedCuisines", value: string) {
    setDraft((previous) => ({
      ...previous,
      [field]: previous[field].includes(value)
        ? previous[field].filter((item) => item !== value)
        : [...previous[field], value],
    }));
  }

  function addDislikedIngredient() {
    const value = dislikedInput.trim();
    if (!value) return;
    setDraft((previous) => ({
      ...previous,
      dislikedIngredients: [...previous.dislikedIngredients, value],
    }));
    setDislikedInput("");
  }

  function removeDislikedIngredient(value: string) {
    setDraft((previous) => ({
      ...previous,
      dislikedIngredients: previous.dislikedIngredients.filter((item) => item !== value),
    }));
  }

  return (
    <form action={formAction} className="eg-card w-full space-y-6 p-6">
      <input type="hidden" name="restrictions" value={JSON.stringify(draft.restrictions)} />
      <input type="hidden" name="intolerances" value={JSON.stringify(draft.intolerances)} />
      <input type="hidden" name="likedCuisines" value={JSON.stringify(draft.likedCuisines)} />
      <input
        type="hidden"
        name="dislikedIngredients"
        value={JSON.stringify(draft.dislikedIngredients)}
      />
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-secondary">
          Step 2 of 2
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Set your food preferences</h1>
      </header>

      <ChipGroup
        title="Restrictions"
        options={restrictionOptions}
        values={draft.restrictions}
        onToggle={(value) => toggleValue("restrictions", value)}
      />
      <ChipGroup
        title="Intolerances"
        options={intoleranceOptions}
        values={draft.intolerances}
        onToggle={(value) => toggleValue("intolerances", value)}
      />
      <ChipGroup
        title="Liked cuisines"
        options={cuisineOptions}
        values={draft.likedCuisines}
        onToggle={(value) => toggleValue("likedCuisines", value)}
      />

      <section className="space-y-2">
        <label className="text-sm font-medium" htmlFor="disliked-ingredients">
          Disliked ingredients
        </label>
        <div className="flex gap-2">
          <input
            id="disliked-ingredients"
            value={dislikedInput}
            onChange={(event) =>
              setDislikedInput((event.target as unknown as { value: string }).value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addDislikedIngredient();
              }
            }}
            className="min-h-11 flex-1 rounded-[10px] border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-focus-ring"
            placeholder="e.g. olives"
          />
          <PrimaryActionButton type="button" variant="secondary" onClick={addDislikedIngredient}>
            Add
          </PrimaryActionButton>
        </div>
        {draft.dislikedIngredients.length > 0 ? (
          <ul className="flex flex-wrap gap-2 pt-1">
            {draft.dislikedIngredients.map((ingredient) => (
              <li key={ingredient}>
                <button
                  type="button"
                  onClick={() => removeDislikedIngredient(ingredient)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-strong"
                >
                  {ingredient} ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Weekly budget (USD)</span>
          <input
            name="weeklyBudget"
            value={draft.weeklyBudget}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                weeklyBudget: (event.target as unknown as { value: string }).value,
              }))
            }
            inputMode="numeric"
            className="min-h-11 w-full rounded-[10px] border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-focus-ring"
            placeholder="120"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Fasting pattern</span>
          <select
            name="fastingPattern"
            value={draft.fastingPattern}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                fastingPattern: (event.target as unknown as { value: string }).value,
              }))
            }
            className="min-h-11 w-full rounded-[10px] border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-focus-ring"
          >
            <option value="">No fasting preference</option>
            <option value="16:8">16:8</option>
            <option value="14:10">14:10</option>
            <option value="12:12">12:12</option>
          </select>
        </label>
      </section>

      <label className="space-y-1 text-sm">
        <span className="font-medium">Eating window</span>
        <input
          name="eatingWindow"
          value={draft.eatingWindow}
          onChange={(event) =>
            setDraft((previous) => ({
              ...previous,
              eatingWindow: (event.target as unknown as { value: string }).value,
            }))
          }
          className="min-h-11 w-full rounded-[10px] border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-focus-ring"
          placeholder="10:00 - 18:00"
        />
      </label>

      <footer className="sticky bottom-3 space-y-2 rounded-xl border border-border bg-background/95 p-3 backdrop-blur">
        <PrimaryActionButton type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Saving..." : "Save preferences"}
        </PrimaryActionButton>
        <p className="text-xs text-text-secondary">{validationHint}</p>
        {actionState.status === "error" && actionState.message ? (
          <p className="text-xs text-danger">{actionState.message}</p>
        ) : null}
      </footer>
    </form>
  );
}
