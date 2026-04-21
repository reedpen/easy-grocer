drop policy if exists "meal_plan_items_delete_own" on public.meal_plan_items;
create policy "meal_plan_items_delete_own"
  on public.meal_plan_items
  for delete
  using (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = auth.uid()
    )
  );

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
    budget_cents,
    updated_at
  )
  values (
    v_user_id,
    p_week_start_date,
    p_status,
    p_daily_calorie_target,
    p_total_cost_cents,
    p_budget_cents,
    timezone('utc', now())
  )
  on conflict (user_id, week_start_date)
  do update set
    status = excluded.status,
    daily_calorie_target = excluded.daily_calorie_target,
    total_cost_cents = excluded.total_cost_cents,
    budget_cents = excluded.budget_cents,
    updated_at = timezone('utc', now())
  returning id into v_plan_id;

  delete from public.meal_plan_items
  where meal_plan_id = v_plan_id;

  if jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) > 0 then
    insert into public.meal_plan_items (
      meal_plan_id,
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
