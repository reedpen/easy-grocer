create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  height_cm numeric not null check (height_cm >= 120 and height_cm <= 250),
  weight_kg numeric not null check (weight_kg >= 35 and weight_kg <= 300),
  age integer not null check (age >= 15 and age <= 100),
  sex text not null check (sex in ('male', 'female')),
  activity_level text not null check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  goal text not null check (
    goal in ('weight_loss', 'maintenance', 'weight_gain', 'muscle_building')
  ),
  bmr integer not null check (bmr > 0),
  tdee integer not null check (tdee > 0),
  daily_calorie_target integer not null check (daily_calorie_target >= 1200),
  protein_g integer not null check (protein_g > 0),
  carbs_g integer not null check (carbs_g > 0),
  fats_g integer not null check (fats_g > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
