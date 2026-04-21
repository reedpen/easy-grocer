# Easy Grocer Frontend MVP Handoff

## Product Goal
Build an installable PWA UI for a health-conscious, busy user who wants:

1. A personalized weekly meal plan based on goals/body stats.
2. A clear calorie/macro summary per meal and per day.
3. One button to send a generated grocery list to Walmart cart (Tier 1 URL handoff).

This MVP is personal-first and mobile-first, but must work cleanly on desktop.

## MVP Scope (Frontend Only)

### In Scope
- Auth screens (email + Google entry points).
- Profile onboarding form (height, weight, age, sex, activity, goal).
- Preferences form (dietary restrictions, dislikes, fasting window, weekly budget).
- Weekly plan page with:
  - Daily meal cards
  - Per-meal calories/macros
  - Daily totals
  - Weekly estimated cost
- Grocery review page:
  - Consolidated ingredient list
  - Estimated spend vs budget
  - "Send to Walmart cart" button (opens handoff URL)
- Plan tweak interactions:
  - Add snack/treat item to plan
  - Remove or replace a meal
- Meal history list (past confirmed plans)
- Offline fallback page experience for no-network scenarios.

### Out of Scope (for MVP)
- Playwright one-tap checkout flow (Phase 8).
- Advanced analytics/charts.
- Complex social features.
- Public affiliate monetization flows.

## Route Map

- `/` - Landing / app status / CTA to auth
- `/login` - Email + Google sign-in
- `/onboarding/profile` - Body stats + goal
- `/onboarding/preferences` - Diet/budget/fasting preferences
- `/dashboard` - Current week summary and quick actions
- `/plan/[weekStart]` - Full week meal plan + calories/macros
- `/cart` - Grocery review + Walmart handoff
- `/history` - Meal history and previous week snapshots
- `/~offline` - Offline fallback

## Core Screens and Required UI Behavior

## 1) Login
- Show email magic-link input and Google login button.
- If authenticated user has no profile, route to `/onboarding/profile`.
- If authenticated user is fully onboarded, route to `/dashboard`.

## 2) Onboarding Profile
- Fields: `height_cm`, `weight_kg`, `age`, `sex`, `activity_level`, `goal`.
- Client-side validation with clear inline messages.
- On submit success, route to `/onboarding/preferences`.

## 3) Onboarding Preferences
- Fields:
  - `restrictions[]` (vegan, vegetarian, gluten-free, etc.)
  - `intolerances[]`
  - `liked_cuisines[]`
  - `disliked_ingredients[]`
  - `weekly_budget_cents`
  - fasting pattern + active days + eating window
- Save and route to `/dashboard`.

## 4) Dashboard
- Show:
  - Current goal and daily calorie target.
  - Current week status (`draft`, `confirmed`, `ordered`).
  - Buttons: `Generate week`, `View plan`, `Review groceries`.
- If no current plan exists, show empty state + generate CTA.

## 5) Plan Page
- Calendar-style week (7 day sections).
- Each meal card shows:
  - Meal name
  - Servings
  - Calories
  - Protein / carbs / fats
- Per-day footer totals.
- Top summary with weekly cost estimate and budget delta.
- Actions:
  - Remove meal
  - Replace meal
  - Add treat/snack
  - Confirm plan

## 6) Grocery Review / Cart Page
- Grouped ingredient list with quantity + unit + estimated line cost.
- Budget progress indicator.
- Walmart handoff button:
  - Opens `cart_url` from backend in a new tab.
  - Show non-blocking message if URL missing.
- Display disclaimer: checkout and fulfillment happen on Walmart.

## 7) History
- Chronological list of previous plans.
- For each week: total calories/day avg, total estimated cost, status.
- Click to open read-only plan snapshot.

## Shared Component Inventory

- `AppShell` (header, nav, mobile bottom nav)
- `AuthGate` (route protection wrapper)
- `MetricCard` (calories/macros/cost display)
- `MealCard`
- `DailySummaryBar`
- `BudgetProgress`
- `IngredientList`
- `EmptyState`
- `LoadingSkeleton`
- `ErrorState`
- `PrimaryActionButton`

## Data Contracts (Frontend Expectations)

Use these as UI contracts while backend evolves.

```ts
type Goal = "weight_loss" | "maintenance" | "weight_gain" | "muscle_building";

type MacroTotals = {
  protein_g: number;
  carbs_g: number;
  fats_g: number;
};

type MealPlanItem = {
  id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  title: string;
  servings: number;
  calories: number;
  macros: MacroTotals;
};

type GroceryLineItem = {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
};

type WeekPlan = {
  id: string;
  week_start_date: string;
  status: "draft" | "confirmed" | "ordered";
  daily_calorie_target: number;
  total_cost_cents: number;
  budget_cents: number;
  items: MealPlanItem[];
};

type GroceryList = {
  id: string;
  provider: "walmart";
  cart_url: string | null;
  estimated_total_cents: number;
  items: GroceryLineItem[];
};
```

## UX Requirements (Non-Visual)

- Mobile-first interaction targets (44px min touch targets).
- All forms must be keyboard accessible.
- Loading and error states for every async action.
- Optimistic updates only where reversibility is safe (e.g., local tweak chips).
- Destructive actions (remove meal) require confirm step.
- Persist unsaved form state in session storage during onboarding.

## PWA Requirements

- App must be installable from supported browsers.
- Respect offline route (`/~offline`) for failed document navigation.
- Do not block core read-only views if network fails and cached data exists.

## Definition of Done (Frontend MVP)

- All routes listed above implemented and navigable.
- Auth + onboarding + plan + cart + history complete with mocked or real backend data.
- Route protection working for authenticated areas.
- Works on:
  - Mobile viewport (375x812)
  - Tablet viewport (768x1024)
  - Desktop viewport (1280x800)
- Lighthouse PWA installability passes in dev/prod preview.
- No TypeScript or ESLint errors in frontend changes.

## Suggested Build Order for Frontend Agent

1. App shell + route scaffolding + protected routing.
2. Onboarding forms with validation.
3. Dashboard and plan read views.
4. Meal tweak interactions.
5. Grocery/cart review and Walmart handoff button.
6. History page.
7. Loading/error/empty states + polish.

