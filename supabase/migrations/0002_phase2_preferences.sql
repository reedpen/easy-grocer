create table if not exists public.dietary_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  restrictions text[] not null default '{}',
  intolerances text[] not null default '{}',
  liked_cuisines text[] not null default '{}',
  disliked_ingredients text[] not null default '{}',
  weekly_budget_cents integer not null default 0 check (weekly_budget_cents >= 0),
  servings_per_meal integer not null default 1 check (servings_per_meal > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.fasting_schedules (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pattern text,
  active_days smallint[] not null default '{}',
  window_start_time time,
  window_end_time time,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.dietary_preferences enable row level security;
alter table public.fasting_schedules enable row level security;

drop policy if exists "dietary_preferences_select_own" on public.dietary_preferences;
create policy "dietary_preferences_select_own"
  on public.dietary_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "dietary_preferences_insert_own" on public.dietary_preferences;
create policy "dietary_preferences_insert_own"
  on public.dietary_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "dietary_preferences_update_own" on public.dietary_preferences;
create policy "dietary_preferences_update_own"
  on public.dietary_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "fasting_schedules_select_own" on public.fasting_schedules;
create policy "fasting_schedules_select_own"
  on public.fasting_schedules
  for select
  using (auth.uid() = user_id);

drop policy if exists "fasting_schedules_insert_own" on public.fasting_schedules;
create policy "fasting_schedules_insert_own"
  on public.fasting_schedules
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "fasting_schedules_update_own" on public.fasting_schedules;
create policy "fasting_schedules_update_own"
  on public.fasting_schedules
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
