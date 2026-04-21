# Easy Grocer Frontend UI Outline (MVP)

This document translates the MVP handoff into a concrete frontend UX/UI blueprint.

## Visual Direction (Confirmed)

- Style: clean minimal
- Palette approach: earthy warm
- Theme: light mode only for MVP
- UI personality: very clean and tight (modern, lower corner radius, compact rhythm)

## Product UX Principles

- Prioritize one obvious next action per screen.
- Keep nutritional and budget signals visible at first glance.
- Reduce input friction with grouped forms, sane defaults, and progressive disclosure.
- Keep motion subtle and functional (state changes only).
- Use clear confirmation patterns for destructive actions and external handoff.

## Global App Structure

## App Shell

- Top bar:
  - Left: `Easy Grocer` wordmark
  - Center (mobile hidden): current week label
  - Right: profile menu/icon
- Mobile bottom nav:
  - `Dashboard`, `Plan`, `Cart`, `History`
- Desktop navigation:
  - Left rail with same destinations
  - Utility actions pinned bottom: `Settings`, `Sign out`
- Common page chrome:
  - Max content width `1200px`
  - Standard section spacing and heading style

## Route Flow

- Public:
  - `/` -> `/login`
- New users:
  - `/login` -> `/onboarding/profile` -> `/onboarding/preferences` -> `/dashboard`
- Returning users:
  - `/login` -> `/dashboard`
- Core loop:
  - `/dashboard` <-> `/plan/[weekStart]` <-> `/cart` <-> `/history`

## Wireframe-Level Screen Definitions

## `/` Landing

**Primary goal:** move users to authentication quickly.

**Layout**

- Hero block:
  - H1: personal meal planning + grocery handoff value
  - Subcopy: simple 1-2 lines
  - Primary CTA: `Get Started`
  - Secondary CTA: `Sign In`
- Trust strip:
  - `Installable PWA`
  - `Offline fallback`
  - `Walmart cart handoff`

**Behavior**

- If authenticated, skip landing and route to next required screen.

## `/login`

**Primary goal:** successful auth with minimal decisions.

**Layout**

- Centered auth card:
  - Email field
  - `Send magic link` button
  - Divider
  - `Continue with Google` button
- Helper text area for status and errors.

**Behavior**

- If no profile: route `/onboarding/profile`.
- If onboarded: route `/dashboard`.
- Buttons show loading + disabled state during request.

## `/onboarding/profile`

**Primary goal:** collect body stats and goal.

**Layout**

- Step header: `Step 1 of 2`
- Group 1: body metrics (`height_cm`, `weight_kg`, `age`)
- Group 2: context (`sex`, `activity_level`, `goal`)
- Sticky mobile footer:
  - Primary: `Continue`
  - Secondary text: validation hints

**Behavior**

- Inline field-level validation.
- Persist draft to session storage.
- On success, route `/onboarding/preferences`.

## `/onboarding/preferences`

**Primary goal:** collect constraints that influence plan generation.

**Layout**

- Step header: `Step 2 of 2`
- Chip groups:
  - Restrictions
  - Intolerances
  - Liked cuisines
- Text/token input:
  - Disliked ingredients
- Cost and schedule section:
  - Budget input
  - Fasting pattern and eating window
- Sticky footer CTA: `Save preferences`

**Behavior**

- Multi-select chips with selected state and keyboard support.
- Persist draft to session storage.
- On success, route `/dashboard`.

## `/dashboard`

**Primary goal:** orient user and launch the next core action.

**Layout**

- Summary hero:
  - Goal label
  - Daily calorie target metric
  - Plan status chip (`draft`, `confirmed`, `ordered`)
- Primary action row:
  - `Generate week`
  - `View plan`
  - `Review groceries`
- Secondary section:
  - Last update timestamp
  - Short onboarding completion status

**Empty state**

- If no current plan:
  - Simple illustration container
  - Message + `Generate week` CTA

## `/plan/[weekStart]`

**Primary goal:** review and adjust weekly meals, then confirm.

**Layout**

- Top summary bar:
  - Weekly estimated cost
  - Budget delta
  - Primary action: `Confirm plan`
- Week timeline:
  - Mobile: single-column 7 day sections
  - Desktop: two-column day grid
- Day section:
  - Day label/date
  - Meal cards
  - Daily totals footer

**Meal card content**

- Title + meal type + servings
- Calories
- Macro row (`protein`, `carbs`, `fats`)
- Actions:
  - `Remove`
  - `Replace`
  - `Add snack`

**Behavior**

- Removing a meal always prompts confirmation.
- Replace/add actions show optimistic temporary state where safe.
- Confirm plan locks core edits unless user explicitly reopens editing.

## `/cart`

**Primary goal:** validate grocery spend and hand off to Walmart.

**Layout**

- Header metrics:
  - Estimated total spend
  - Budget progress bar
  - Budget delta
- Ingredient list:
  - Grouped by category/type
  - Quantity, unit, estimated line cost
- Footer action:
  - Primary: `Send to Walmart cart`
  - Disclaimer text below button

**Behavior**

- If `cart_url` exists: open in new tab.
- If missing: show non-blocking toast.

## `/history`

**Primary goal:** browse previous plan snapshots quickly.

**Layout**

- Chronological week cards
- Card fields:
  - Week start date
  - Avg calories/day
  - Estimated total cost
  - Status chip
- Card action: `View snapshot`

**Behavior**

- Snapshot is read-only.

## `/~offline`

**Primary goal:** graceful fallback with clear recovery.

**Layout**

- Short message: offline state
- Secondary text: cached data availability
- CTA row:
  - `Retry`
  - `Go to dashboard` (if cached content exists)

## Interaction and State Patterns

- Loading:
  - Skeletons for metric cards, meal cards, ingredient list.
- Error:
  - Inline actionable error copy + retry control.
- Empty:
  - Focused, one-action empty states (no multiple competing CTAs).
- Confirmation:
  - Modal/sheet confirmation for destructive actions.
- Toasts:
  - Use only for transient outcomes (URL missing, save success).

## UI System Tokens (Implementation-Ready)

## Color Tokens (Earthy Warm, Light-Only)

Use these as semantic tokens first, then bind to Tailwind variables.

- `--bg`: `#F8F5F0` (app background)
- `--surface`: `#F3EEE6` (cards and grouped containers)
- `--surface-strong`: `#E9E1D6` (hover/pressed surface)
- `--text-primary`: `#2F2923`
- `--text-secondary`: `#5B5249`
- `--border`: `#D9CFBF`
- `--primary`: `#5F6B3F` (muted olive)
- `--primary-foreground`: `#F8F5F0`
- `--success`: `#6C7E52` (sage-leaning)
- `--warning`: `#B8784A` (terracotta)
- `--danger`: `#A8553E` (destructive)
- `--focus-ring`: `#7A8A4F`

## Typography Tokens

- Font family: `Inter` (or system sans fallback)
- Weights: `500`, `600`, `700`
- Sizes:
  - `--text-xs`: `12px`
  - `--text-sm`: `14px`
  - `--text-base`: `16px`
  - `--text-lg`: `18px`
  - `--text-xl`: `20px`
  - `--text-2xl`: `24px`
  - `--text-3xl`: `30px`
- Line heights:
  - Body: `1.5`
  - Heading: `1.25`
- Tracking:
  - Default `0`
  - Tight headings `-0.01em`

## Spacing and Shape Tokens

- Base spacing unit: `4px`
- Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48`
- Radius:
  - Inputs/buttons: `10px`
  - Cards: `12px`
  - Modal/sheets: `14px`
- Border width:
  - Standard: `1px`
  - Emphasis dividers: `2px` (rare)
- Shadows:
  - `shadow-sm` only for elevated actions
  - Default surfaces use borders instead of heavy shadows

## Component Specs

## Buttons

- Heights:
  - Default `44px` (touch-safe)
  - Large CTA `48px`
- Variants:
  - Primary (olive fill)
  - Secondary (surface + border)
  - Ghost (text only for low-priority actions)
  - Destructive (danger)

## Inputs

- Height `44px` min
- Label always visible above field
- Error text shown directly under field
- Focus ring uses `--focus-ring` with 2px outline

## Cards

- Padding:
  - Mobile `16px`
  - Desktop `20px`
- Header-body-footer pattern for consistency
- Data rows use clear left/right alignment (label/value)

## Status Chips

- Sizes: compact and default
- Mappings:
  - `draft` -> neutral
  - `confirmed` -> success
  - `ordered` -> primary

## Budget Progress

- Height `10px`
- Track uses `--surface-strong`
- Fill color changes when over budget:
  - Under budget: `--primary`
  - Over budget: `--warning`

## Responsive Behavior

- Mobile first at `375px` baseline.
- Breakpoints:
  - `md` (`>=768px`): introduce side-by-side modules.
  - `xl` (`>=1280px`): widen shell, increase information density.
- Navigation:
  - Bottom nav on mobile
  - Left rail on desktop
- Keep key actions sticky on small screens for long forms/lists.

## Accessibility and Usability Rules

- Minimum touch target size `44px`.
- Full keyboard support for forms, chips, dialogs, and menus.
- Visible focus for every interactive element.
- Color usage must retain contrast against warm surfaces.
- Do not rely on color alone for status (pair with text/icon).

## Suggested Delivery Sequence

1. Build `AppShell` and navigation primitives.
2. Implement onboarding forms with validation and session persistence.
3. Build dashboard summary and action cards.
4. Build plan day sections + meal card actions + confirmations.
5. Build grocery review, budget progress, and Walmart handoff.
6. Build history list + snapshot view.
7. Finish with loading/error/empty/offline states and polish pass.
