create index if not exists idx_meal_plan_items_meal_plan_id
  on public.meal_plan_items (meal_plan_id);

create index if not exists idx_meal_history_user_id
  on public.meal_history (user_id);

create index if not exists idx_meal_history_meal_plan_item_id
  on public.meal_history (meal_plan_item_id);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "dietary_preferences_select_own" on public.dietary_preferences;
create policy "dietary_preferences_select_own"
  on public.dietary_preferences
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "dietary_preferences_insert_own" on public.dietary_preferences;
create policy "dietary_preferences_insert_own"
  on public.dietary_preferences
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "dietary_preferences_update_own" on public.dietary_preferences;
create policy "dietary_preferences_update_own"
  on public.dietary_preferences
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "fasting_schedules_select_own" on public.fasting_schedules;
create policy "fasting_schedules_select_own"
  on public.fasting_schedules
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "fasting_schedules_insert_own" on public.fasting_schedules;
create policy "fasting_schedules_insert_own"
  on public.fasting_schedules
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "fasting_schedules_update_own" on public.fasting_schedules;
create policy "fasting_schedules_update_own"
  on public.fasting_schedules
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "meal_plans_select_own" on public.meal_plans;
create policy "meal_plans_select_own"
  on public.meal_plans
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "meal_plans_insert_own" on public.meal_plans;
create policy "meal_plans_insert_own"
  on public.meal_plans
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "meal_plans_update_own" on public.meal_plans;
create policy "meal_plans_update_own"
  on public.meal_plans
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "meal_plan_items_select_own" on public.meal_plan_items;
create policy "meal_plan_items_select_own"
  on public.meal_plan_items
  for select
  using (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = (select auth.uid())
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
        and mp.user_id = (select auth.uid())
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
        and mp.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = (select auth.uid())
    )
  );

drop policy if exists "meal_plan_items_delete_own" on public.meal_plan_items;
create policy "meal_plan_items_delete_own"
  on public.meal_plan_items
  for delete
  using (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = (select auth.uid())
    )
  );

drop policy if exists "meal_history_select_own" on public.meal_history;
create policy "meal_history_select_own"
  on public.meal_history
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "meal_history_insert_own" on public.meal_history;
create policy "meal_history_insert_own"
  on public.meal_history
  for insert
  with check ((select auth.uid()) = user_id);
