create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'ordered')),
  daily_calorie_target integer not null check (daily_calorie_target >= 1200),
  total_cost_cents integer not null default 0 check (total_cost_cents >= 0),
  budget_cents integer not null default 0 check (budget_cents >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, week_start_date)
);

create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  title text not null,
  servings numeric not null default 1 check (servings > 0),
  calories integer not null check (calories >= 0),
  protein_g integer not null check (protein_g >= 0),
  carbs_g integer not null check (carbs_g >= 0),
  fats_g integer not null check (fats_g >= 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  recipe_source text not null default 'spoonacular',
  external_recipe_id text,
  recipe_snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meal_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_item_id uuid not null references public.meal_plan_items(id) on delete cascade,
  external_recipe_id text,
  consumed_at timestamptz not null default timezone('utc', now())
);

alter table public.meal_plans enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.meal_history enable row level security;

drop policy if exists "meal_plans_select_own" on public.meal_plans;
create policy "meal_plans_select_own"
  on public.meal_plans
  for select
  using (auth.uid() = user_id);

drop policy if exists "meal_plans_insert_own" on public.meal_plans;
create policy "meal_plans_insert_own"
  on public.meal_plans
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "meal_plans_update_own" on public.meal_plans;
create policy "meal_plans_update_own"
  on public.meal_plans
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "meal_plan_items_select_own" on public.meal_plan_items;
create policy "meal_plan_items_select_own"
  on public.meal_plan_items
  for select
  using (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = auth.uid()
    )
  );

drop policy if exists "meal_plan_items_insert_own" on public.meal_plan_items;
create policy "meal_plan_items_insert_own"
  on public.meal_plan_items
  for insert
  with check (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = auth.uid()
    )
  );

drop policy if exists "meal_plan_items_update_own" on public.meal_plan_items;
create policy "meal_plan_items_update_own"
  on public.meal_plan_items
  for update
  using (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = auth.uid()
    )
  );

drop policy if exists "meal_history_select_own" on public.meal_history;
create policy "meal_history_select_own"
  on public.meal_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "meal_history_insert_own" on public.meal_history;
create policy "meal_history_insert_own"
  on public.meal_history
  for insert
  with check (auth.uid() = user_id);
