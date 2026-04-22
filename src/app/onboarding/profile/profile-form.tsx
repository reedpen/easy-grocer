"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { saveProfile, type ProfileActionState } from "./actions";

const initialState: ProfileActionState = { status: "idle" };
const STORAGE_KEY = "easy-grocer-profile-draft";
type ProfileDraft = {
  age: string;
  heightUnit: "cm" | "ft_in";
  heightCm: string;
  heightFeet: string;
  heightInches: string;
  weightUnit: "kg" | "lb";
  weightKg: string;
  weightLb: string;
  sex: string;
  activityLevel: string;
  goal: string;
};

const browser = globalThis as {
  sessionStorage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
};

const activityOptions = [
  { value: "sedentary", label: "Sedentary (little to no exercise)" },
  { value: "light", label: "Light (1-3 workouts/week)" },
  { value: "moderate", label: "Moderate (3-5 workouts/week)" },
  { value: "active", label: "Active (6-7 workouts/week)" },
  { value: "very_active", label: "Very active (intense daily training)" },
];

const goalOptions = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "maintenance", label: "Maintenance" },
  { value: "weight_gain", label: "Weight gain" },
  { value: "muscle_building", label: "Muscle building" },
];

function loadStoredDraft(): ProfileDraft {
  const fallback: ProfileDraft = {
    age: "",
    heightUnit: "cm",
    heightCm: "",
    heightFeet: "",
    heightInches: "",
    weightUnit: "kg",
    weightKg: "",
    weightLb: "",
    sex: "male",
    activityLevel: "moderate",
    goal: "maintenance",
  };

  if (!browser.sessionStorage) {
    return fallback;
  }

  const raw = browser.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<ProfileDraft>) };
  } catch {
    browser.sessionStorage.removeItem(STORAGE_KEY);
    return fallback;
  }
}

type ProfileFormProps = {
  initialDraft?: Partial<ProfileDraft>;
  redirectTo?: string;
  stepLabel?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
};

export function ProfileForm({
  initialDraft,
  redirectTo = "/onboarding/preferences",
  stepLabel = "Step 1 of 2",
  title = "Set your profile targets",
  description = "These values drive your calorie and macro targets.",
  submitLabel = "Continue",
}: ProfileFormProps = {}) {
  const [storedDraft] = useState(loadStoredDraft);
  const mergedDraft = useMemo(
    () => ({
      ...storedDraft,
      ...initialDraft,
    }),
    [initialDraft, storedDraft],
  );
  const [state, action, isPending] = useActionState(saveProfile, initialState);
  const [age, setAge] = useState(mergedDraft.age);
  const [heightUnit, setHeightUnit] = useState<ProfileDraft["heightUnit"]>(
    mergedDraft.heightUnit,
  );
  const [heightCm, setHeightCm] = useState(mergedDraft.heightCm);
  const [heightFeet, setHeightFeet] = useState(mergedDraft.heightFeet);
  const [heightInches, setHeightInches] = useState(mergedDraft.heightInches);
  const [weightUnit, setWeightUnit] = useState<ProfileDraft["weightUnit"]>(
    mergedDraft.weightUnit,
  );
  const [weightKg, setWeightKg] = useState(mergedDraft.weightKg);
  const [weightLb, setWeightLb] = useState(mergedDraft.weightLb);
  const [sex, setSex] = useState(mergedDraft.sex);
  const [activityLevel, setActivityLevel] = useState(mergedDraft.activityLevel);
  const [goal, setGoal] = useState(mergedDraft.goal);

  useEffect(() => {
    if (!browser.sessionStorage) {
      return;
    }
    browser.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        age,
        heightUnit,
        heightCm,
        heightFeet,
        heightInches,
        weightUnit,
        weightKg,
        weightLb,
        sex,
        activityLevel,
        goal,
      }),
    );
  }, [
    activityLevel,
    age,
    goal,
    heightCm,
    heightFeet,
    heightInches,
    heightUnit,
    sex,
    weightKg,
    weightLb,
    weightUnit,
  ]);

  const validationHint = useMemo(() => {
    const normalizedHeightCm =
      heightUnit === "cm"
        ? Number(heightCm)
        : (Number(heightFeet) * 12 + Number(heightInches)) * 2.54;
    if (
      !normalizedHeightCm ||
      Number.isNaN(normalizedHeightCm) ||
      normalizedHeightCm < 120 ||
      normalizedHeightCm > 250
    ) {
      return "Height must be between 120 and 250 cm (about 3'11\" to 8'2\").";
    }
    const normalizedWeightKg =
      weightUnit === "kg" ? Number(weightKg) : Number(weightLb) * 0.45359237;
    if (
      !normalizedWeightKg ||
      Number.isNaN(normalizedWeightKg) ||
      normalizedWeightKg < 35 ||
      normalizedWeightKg > 300
    ) {
      return "Weight must be between 35 and 300 kg (about 77 to 661 lb).";
    }
    if (!age || Number(age) < 15 || Number(age) > 100) {
      return "Age must be between 15 and 100 years.";
    }
    return "Looks good. Continue to preference setup.";
  }, [
    age,
    heightCm,
    heightFeet,
    heightInches,
    heightUnit,
    weightKg,
    weightLb,
    weightUnit,
  ]);

  function handleSubmit(formData: FormData) {
    if (browser.sessionStorage) {
      browser.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          age,
          heightUnit,
          heightCm,
          heightFeet,
          heightInches,
          weightUnit,
          weightKg,
          weightLb,
          sex,
          activityLevel,
          goal,
        }),
      );
    }
    return action(formData);
  }

  return (
    <form action={handleSubmit} className="eg-card space-y-5 p-6">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-secondary">
          {stepLabel}
        </p>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-text-secondary">
          {description}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2 text-sm">
          <legend className="font-medium">Height</legend>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 rounded-[10px] border border-border px-3 py-2">
              <input
                type="radio"
                name="heightUnit"
                value="cm"
                checked={heightUnit === "cm"}
                onChange={(event) =>
                  setHeightUnit(
                    (event.target as unknown as { value: ProfileDraft["heightUnit"] }).value,
                  )
                }
              />
              <span>cm</span>
            </label>
            <label className="flex items-center gap-2 rounded-[10px] border border-border px-3 py-2">
              <input
                type="radio"
                name="heightUnit"
                value="ft_in"
                checked={heightUnit === "ft_in"}
                onChange={(event) =>
                  setHeightUnit(
                    (event.target as unknown as { value: ProfileDraft["heightUnit"] }).value,
                  )
                }
              />
              <span>ft/in</span>
            </label>
          </div>
          {heightUnit === "cm" ? (
            <input
              name="heightCm"
              type="number"
              min={120}
              max={250}
              required
              value={heightCm}
              onChange={(event) =>
                setHeightCm((event.target as unknown as { value: string }).value)
              }
              className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-focus-ring"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input
                name="heightFeet"
                type="number"
                min={3}
                max={8}
                required
                value={heightFeet}
                onChange={(event) =>
                  setHeightFeet((event.target as unknown as { value: string }).value)
                }
                className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-focus-ring"
                placeholder="feet"
              />
              <input
                name="heightInches"
                type="number"
                min={0}
                max={11}
                required
                value={heightInches}
                onChange={(event) =>
                  setHeightInches((event.target as unknown as { value: string }).value)
                }
                className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-focus-ring"
                placeholder="inches"
              />
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-2 text-sm">
          <legend className="font-medium">Weight</legend>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 rounded-[10px] border border-border px-3 py-2">
              <input
                type="radio"
                name="weightUnit"
                value="kg"
                checked={weightUnit === "kg"}
                onChange={(event) =>
                  setWeightUnit(
                    (event.target as unknown as { value: ProfileDraft["weightUnit"] }).value,
                  )
                }
              />
              <span>kg</span>
            </label>
            <label className="flex items-center gap-2 rounded-[10px] border border-border px-3 py-2">
              <input
                type="radio"
                name="weightUnit"
                value="lb"
                checked={weightUnit === "lb"}
                onChange={(event) =>
                  setWeightUnit(
                    (event.target as unknown as { value: ProfileDraft["weightUnit"] }).value,
                  )
                }
              />
              <span>lb</span>
            </label>
          </div>
          {weightUnit === "kg" ? (
            <input
              name="weightKg"
              type="number"
              min={35}
              max={300}
              step="0.1"
              required
              value={weightKg}
              onChange={(event) =>
                setWeightKg((event.target as unknown as { value: string }).value)
              }
              className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-focus-ring"
            />
          ) : (
            <input
              name="weightLb"
              type="number"
              min={77}
              max={661}
              step="0.1"
              required
              value={weightLb}
              onChange={(event) =>
                setWeightLb((event.target as unknown as { value: string }).value)
              }
              className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-focus-ring"
            />
          )}
        </fieldset>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Age</span>
          <input
            name="age"
            type="number"
            min={15}
            max={100}
            required
            value={age}
            onChange={(event) =>
              setAge((event.target as unknown as { value: string }).value)
            }
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-focus-ring"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Sex</span>
          <select
            name="sex"
            required
            value={sex}
            onChange={(event) =>
              setSex((event.target as unknown as { value: string }).value)
            }
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-focus-ring"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Activity level</span>
        <select
          name="activityLevel"
          required
          value={activityLevel}
          onChange={(event) =>
            setActivityLevel((event.target as unknown as { value: string }).value)
          }
          className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-focus-ring"
        >
          {activityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Primary goal</span>
        <select
          name="goal"
          required
          value={goal}
          onChange={(event) =>
            setGoal((event.target as unknown as { value: string }).value)
          }
          className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-focus-ring"
        >
          {goalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <footer className="sticky bottom-3 space-y-2 rounded-xl border border-border bg-background/95 p-3 backdrop-blur">
        <PrimaryActionButton type="submit" disabled={isPending} className="w-full">
          {isPending ? "Saving..." : submitLabel}
        </PrimaryActionButton>
        <p className="text-xs text-text-secondary">{validationHint}</p>
      </footer>

      {state.status !== "idle" && state.message ? (
        <p className={`text-sm ${state.status === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
