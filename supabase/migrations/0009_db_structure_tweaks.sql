-- 0009_db_structure_tweaks.sql
-- Structural/perf tweaks:
--  1. Drop a redundant index that duplicated a unique-constraint index.
--  2. Denormalize user_id onto meal_plan_items and grocery_list_items so
--     RLS can do a direct user_id = auth.uid() check instead of an
--     EXISTS-against-the-parent subquery on every row. Adds a backfill and
--     a safety-net BEFORE INSERT trigger so existing callers that don't
--     set user_id keep working.
--  3. Centralize updated_at maintenance in a trigger instead of relying
--     on each caller to pass `updated_at: new Date().toISOString()`.
--  4. Refresh the upsert_meal_plan_with_items RPC so it populates the new
--     meal_plan_items.user_id column and lets the trigger own updated_at.

--------------------------------------------------------------------------
-- 1. Drop redundant duplicate index.
--------------------------------------------------------------------------
-- ingredient_product_cache already has a UNIQUE(user_id, provider, ingredient_key)
-- constraint, which creates an identical btree. The extra explicit index
-- just cost writes and shared_buffers for no benefit.
drop index if exists public.idx_ingredient_product_cache_user_provider_key;

--------------------------------------------------------------------------
-- 2a. Denormalize user_id onto meal_plan_items.
--------------------------------------------------------------------------
alter table public.meal_plan_items
  add column if not exists user_id uuid
    references auth.users(id) on delete cascade;

update public.meal_plan_items mpi
set user_id = mp.user_id
from public.meal_plans mp
where mpi.meal_plan_id = mp.id
  and mpi.user_id is null;

alter table public.meal_plan_items
  alter column user_id set not null;

create index if not exists idx_meal_plan_items_user_id
  on public.meal_plan_items (user_id);

create or replace function public.meal_plan_items_set_user_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is null then
    select user_id into new.user_id
    from public.meal_plans
    where id = new.meal_plan_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_meal_plan_items_set_user_id on public.meal_plan_items;
create trigger trg_meal_plan_items_set_user_id
  before insert on public.meal_plan_items
  for each row
  execute function public.meal_plan_items_set_user_id();

-- Replace child-table RLS with direct user_id checks. INSERT keeps the
-- parent-ownership guard so a user cannot attach rows to another user's plan.
drop policy if exists "meal_plan_items_select_own" on public.meal_plan_items;
create policy "meal_plan_items_select_own"
  on public.meal_plan_items
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "meal_plan_items_insert_own" on public.meal_plan_items;
create policy "meal_plan_items_insert_own"
  on public.meal_plan_items
  for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = (select auth.uid())
    )
  );

drop policy if exists "meal_plan_items_update_own" on public.meal_plan_items;
create policy "meal_plan_items_update_own"
  on public.meal_plan_items
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "meal_plan_items_delete_own" on public.meal_plan_items;
create policy "meal_plan_items_delete_own"
  on public.meal_plan_items
  for delete
  using ((select auth.uid()) = user_id);

--------------------------------------------------------------------------
-- 2b. Denormalize user_id onto grocery_list_items.
--------------------------------------------------------------------------
alter table public.grocery_list_items
  add column if not exists user_id uuid
    references auth.users(id) on delete cascade;

update public.grocery_list_items gli
set user_id = gl.user_id
from public.grocery_lists gl
where gli.grocery_list_id = gl.id
  and gli.user_id is null;

alter table public.grocery_list_items
  alter column user_id set not null;

create index if not exists idx_grocery_list_items_user_id
  on public.grocery_list_items (user_id);

create or replace function public.grocery_list_items_set_user_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is null then
    select user_id into new.user_id
    from public.grocery_lists
    where id = new.grocery_list_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_grocery_list_items_set_user_id on public.grocery_list_items;
create trigger trg_grocery_list_items_set_user_id
  before insert on public.grocery_list_items
  for each row
  execute function public.grocery_list_items_set_user_id();

drop policy if exists "grocery_list_items_select_own" on public.grocery_list_items;
create policy "grocery_list_items_select_own"
  on public.grocery_list_items
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "grocery_list_items_insert_own" on public.grocery_list_items;
create policy "grocery_list_items_insert_own"
  on public.grocery_list_items
  for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.user_id = (select auth.uid())
    )
  );

drop policy if exists "grocery_list_items_update_own" on public.grocery_list_items;
create policy "grocery_list_items_update_own"
  on public.grocery_list_items
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "grocery_list_items_delete_own" on public.grocery_list_items;
create policy "grocery_list_items_delete_own"
  on public.grocery_list_items
  for delete
  using ((select auth.uid()) = user_id);

--------------------------------------------------------------------------
-- 3. Central updated_at trigger.
--------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_dietary_preferences_set_updated_at on public.dietary_preferences;
create trigger trg_dietary_preferences_set_updated_at
  before update on public.dietary_preferences
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_fasting_schedules_set_updated_at on public.fasting_schedules;
create trigger trg_fasting_schedules_set_updated_at
  before update on public.fasting_schedules
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_meal_plans_set_updated_at on public.meal_plans;
create trigger trg_meal_plans_set_updated_at
  before update on public.meal_plans
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_grocery_lists_set_updated_at on public.grocery_lists;
create trigger trg_grocery_lists_set_updated_at
  before update on public.grocery_lists
  for each row
  execute function public.set_updated_at();

--------------------------------------------------------------------------
-- 4. Refresh RPC so it populates user_id on meal_plan_items and lets the
--    updated_at trigger do its job on meal_plans updates.
--------------------------------------------------------------------------
create or replace function public.upsert_meal_plan_with_items(
  p_week_start_date date,
  p_status text,
  p_daily_calorie_target integer,
  p_total_cost_cents integer,
  p_budget_cents integer,
  p_items jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan_id uuid;
begin
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.meal_plans (
    user_id,
    week_start_date,
    status,
    daily_calorie_target,
    total_cost_cents,
    budget_cents
  )
  values (
    v_user_id,
    p_week_start_date,
    p_status,
    p_daily_calorie_target,
    p_total_cost_cents,
    p_budget_cents
  )
  on conflict (user_id, week_start_date)
  do update set
    status = excluded.status,
    daily_calorie_target = excluded.daily_calorie_target,
    total_cost_cents = excluded.total_cost_cents,
    budget_cents = excluded.budget_cents
  returning id into v_plan_id;

  delete from public.meal_plan_items
  where meal_plan_id = v_plan_id;

  if jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) > 0 then
    insert into public.meal_plan_items (
      meal_plan_id,
      user_id,
      day_of_week,
      meal_type,
      title,
      servings,
      calories,
      protein_g,
      carbs_g,
      fats_g,
      cost_cents,
      recipe_source,
      external_recipe_id,
      recipe_snapshot_json
    )
    select
      v_plan_id,
      v_user_id,
      (item->>'day_of_week')::smallint,
      item->>'meal_type',
      item->>'title',
      coalesce((item->>'servings')::numeric, 1),
      coalesce((item->>'calories')::integer, 0),
      coalesce((item->>'protein_g')::integer, 0),
      coalesce((item->>'carbs_g')::integer, 0),
      coalesce((item->>'fats_g')::integer, 0),
      coalesce((item->>'cost_cents')::integer, 0),
      coalesce(item->>'recipe_source', 'spoonacular'),
      nullif(item->>'external_recipe_id', ''),
      coalesce(item->'recipe_snapshot_json', '{}'::jsonb)
    from jsonb_array_elements(p_items) as item;
  end if;

  return v_plan_id;
end;
$$;
