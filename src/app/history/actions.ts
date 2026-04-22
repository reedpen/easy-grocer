"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentWeekStart } from "@/lib/mock-data";
import { createWeekPlanFromHistory } from "@/lib/planner/service";

const sourceWeekSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function replanFromHistoryAction(formData: FormData) {
  const parsed = sourceWeekSchema.safeParse(formData.get("sourceWeekStart"));
  if (!parsed.success) {
    redirect("/history?error=invalid_source_week");
  }

  try {
    const user = await requireUser();
    const currentWeekStart = getCurrentWeekStart();
    await createWeekPlanFromHistory(user.id, parsed.data, currentWeekStart);
    redirect(`/plan/${currentWeekStart}`);
  } catch {
    redirect("/history?error=replan_failed");
  }
}
