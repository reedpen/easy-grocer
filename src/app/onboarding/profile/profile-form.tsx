"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { saveProfile, type ProfileActionState } from "./actions";

const initialState: ProfileActionState = { status: "idle" };
const STORAGE_KEY = "easy-grocer-profile-draft";
type ProfileDraft = {
  age: string;
  heightCm: string;
  weightKg: string;
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
    heightCm: "",
    weightKg: "",
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

export function ProfileForm() {
  const [storedDraft] = useState(loadStoredDraft);
  const [state, action, isPending] = useActionState(saveProfile, initialState);
  const [age, setAge] = useState(storedDraft.age);
  const [heightCm, setHeightCm] = useState(storedDraft.heightCm);
  const [weightKg, setWeightKg] = useState(storedDraft.weightKg);
  const [sex, setSex] = useState(storedDraft.sex);
  const [activityLevel, setActivityLevel] = useState(storedDraft.activityLevel);
  const [goal, setGoal] = useState(storedDraft.goal);

  useEffect(() => {
    if (!browser.sessionStorage) {
      return;
    }
    browser.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        age,
        heightCm,
        weightKg,
        sex,
        activityLevel,
        goal,
      }),
    );
  }, [activityLevel, age, goal, heightCm, sex, weightKg]);

  const validationHint = useMemo(() => {
    if (!heightCm || Number(heightCm) < 120 || Number(heightCm) > 250) {
      return "Height must be between 120 and 250 cm.";
    }
    if (!weightKg || Number(weightKg) < 35 || Number(weightKg) > 300) {
      return "Weight must be between 35 and 300 kg.";
    }
    if (!age || Number(age) < 15 || Number(age) > 100) {
      return "Age must be between 15 and 100 years.";
    }
    return "Looks good. Continue to preference setup.";
  }, [age, heightCm, weightKg]);

  function handleSubmit(formData: FormData) {
    if (browser.sessionStorage) {
      browser.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          age,
          heightCm,
          weightKg,
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
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-secondary">
          Step 1 of 2
        </p>
        <h1 className="text-2xl font-semibold">Set your profile targets</h1>
        <p className="text-sm text-text-secondary">
          These values drive your calorie and macro targets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Height (cm)</span>
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
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Weight (kg)</span>
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
        </label>

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
          {isPending ? "Saving..." : "Continue"}
        </PrimaryActionButton>
        <p className="text-xs text-text-secondary">{validationHint}</p>
      </footer>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
    </form>
  );
}
