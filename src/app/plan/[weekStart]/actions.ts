"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { applyPlanTweak } from "@/lib/planner/service";
import type { WeekPlan } from "@/lib/planner/types";

const weekStartSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$|^current-week$/);

const tweakSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("remove_meal"),
    mealId: z.string().min(1).max(128),
  }),
  z.object({
    type: z.literal("replace_meal"),
    mealId: z.string().min(1).max(128),
  }),
  z.object({
    type: z.literal("add_tweak"),
    dayOfWeek: z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ]),
    preset: z.enum(["protein_bar", "sweet_treat"]),
  }),
  z.object({
    type: z.literal("confirm_plan"),
  }),
]);

const payloadSchema = z.object({
  weekStart: weekStartSchema,
  tweak: tweakSchema,
});

export type PlanTweakResult =
  | { ok: true; weekPlan: WeekPlan }
  | { ok: false; message: string };

export async function applyPlanTweakAction(payload: unknown): Promise<PlanTweakResult> {
  try {
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Invalid tweak payload.",
      };
    }

    const user = await requireUser();
    const weekPlan = await applyPlanTweak(user.id, parsed.data.weekStart, parsed.data.tweak);
    return { ok: true, weekPlan };
  } catch {
    return {
      ok: false,
      message: "Unable to apply this change right now. Please try again.",
    };
  }
}
