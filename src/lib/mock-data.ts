import type { MealPlanItem } from "@/components/ui/meal-card";
import type { GroceryList, WeekPlan } from "@/lib/planner/types";

type MockWeekPlan = WeekPlan & { items: MealPlanItem[] };

function startOfWeekISO() {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export function getCurrentWeekStart() {
  return startOfWeekISO();
}

export function getCurrentWeekLabel() {
  const weekStart = new Date(`${startOfWeekISO()}T00:00:00`);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
}

const baseItems: MealPlanItem[] = [
  {
    id: "m1",
    day_of_week: 0,
    meal_type: "breakfast",
    title: "Greek yogurt bowl with berries",
    servings: 1,
    calories: 420,
    macros: { protein_g: 28, carbs_g: 41, fats_g: 14 },
  },
  {
    id: "m2",
    day_of_week: 0,
    meal_type: "dinner",
    title: "Sheet-pan salmon and vegetables",
    servings: 1,
    calories: 610,
    macros: { protein_g: 42, carbs_g: 36, fats_g: 29 },
  },
  {
    id: "m3",
    day_of_week: 1,
    meal_type: "lunch",
    title: "Chicken quinoa bowl",
    servings: 1,
    calories: 540,
    macros: { protein_g: 39, carbs_g: 52, fats_g: 18 },
  },
  {
    id: "m4",
    day_of_week: 2,
    meal_type: "dinner",
    title: "Tofu stir-fry and brown rice",
    servings: 1,
    calories: 560,
    macros: { protein_g: 30, carbs_g: 63, fats_g: 20 },
  },
  {
    id: "m5",
    day_of_week: 4,
    meal_type: "lunch",
    title: "Turkey avocado wrap",
    servings: 1,
    calories: 510,
    macros: { protein_g: 34, carbs_g: 44, fats_g: 22 },
  },
];

export function getMockWeekPlan(
  weekStart = startOfWeekISO(),
  budgetCents = 12000,
): MockWeekPlan {
  return {
    id: "week-plan-1",
    week_start_date: weekStart,
    status: "draft",
    daily_calorie_target: 2100,
    total_cost_cents: 10400,
    budget_cents: budgetCents,
    items: baseItems,
  };
}

export function getMockGroceryList(): GroceryList {
  return {
    id: "grocery-list-1",
    provider: "walmart",
    cart_url: null,
    estimated_total_cents: 10400,
    budget_cents: 12000,
    budget_delta_cents: -1600,
    budget_status: "under",
    items: [
      {
        id: "g1",
        ingredient_name: "Salmon fillet",
        quantity: 2,
        unit: "lb",
        unit_price_cents: 999,
        line_total_cents: 1998,
        category: "Protein",
        source: "estimate",
      },
      {
        id: "g2",
        ingredient_name: "Greek yogurt",
        quantity: 32,
        unit: "oz",
        unit_price_cents: 14,
        line_total_cents: 448,
        category: "Dairy",
        source: "estimate",
      },
      {
        id: "g3",
        ingredient_name: "Mixed berries",
        quantity: 4,
        unit: "cups",
        unit_price_cents: 249,
        line_total_cents: 996,
        category: "Produce",
        source: "estimate",
      },
      {
        id: "g4",
        ingredient_name: "Chicken breast",
        quantity: 3,
        unit: "lb",
        unit_price_cents: 549,
        line_total_cents: 1647,
        category: "Protein",
        source: "estimate",
      },
      {
        id: "g5",
        ingredient_name: "Brown rice",
        quantity: 2,
        unit: "bags",
        unit_price_cents: 399,
        line_total_cents: 798,
        category: "Pantry",
        source: "estimate",
      },
    ],
  };
}

export function getMockHistory() {
  return [
    {
      id: "h1",
      week_start_date: "2026-04-06",
      avg_calories_per_day: 2050,
      estimated_total_cents: 11300,
      status: "ordered" as const,
    },
    {
      id: "h2",
      week_start_date: "2026-03-30",
      avg_calories_per_day: 2100,
      estimated_total_cents: 10900,
      status: "confirmed" as const,
    },
    {
      id: "h3",
      week_start_date: "2026-03-23",
      avg_calories_per_day: 1980,
      estimated_total_cents: 9800,
      status: "ordered" as const,
    },
  ];
}
