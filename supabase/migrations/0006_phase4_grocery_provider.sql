create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  provider text not null check (provider in ('walmart')),
  cart_url text,
  estimated_total_cents integer not null default 0 check (estimated_total_cents >= 0),
  budget_cents integer not null default 0 check (budget_cents >= 0),
  budget_delta_cents integer not null default 0,
  budget_status text not null default 'on_target' check (budget_status in ('under', 'over', 'on_target')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, meal_plan_id, provider)
);

create table if not exists public.grocery_list_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references public.grocery_lists(id) on delete cascade,
  ingredient_name text not null,
  quantity numeric not null default 1 check (quantity > 0),
  unit text not null default 'unit',
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  line_total_cents integer not null default 0 check (line_total_cents >= 0),
  category text not null default 'General',
  provider_product_id text,
  provider_product_url text,
  resolution_confidence numeric check (resolution_confidence >= 0 and resolution_confidence <= 1),
  source text not null default 'estimate' check (source in ('catalog', 'estimate')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ingredient_product_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('walmart')),
  ingredient_key text not null,
  provider_product_id text not null,
  provider_product_url text,
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  resolution_confidence numeric check (resolution_confidence >= 0 and resolution_confidence <= 1),
  raw_json jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique(user_id, provider, ingredient_key)
);

create index if not exists idx_grocery_lists_meal_plan_id on public.grocery_lists(meal_plan_id);
create index if not exists idx_grocery_list_items_grocery_list_id on public.grocery_list_items(grocery_list_id);
create index if not exists idx_ingredient_product_cache_user_provider_key
  on public.ingredient_product_cache(user_id, provider, ingredient_key);

alter table public.grocery_lists enable row level security;
alter table public.grocery_list_items enable row level security;
alter table public.ingredient_product_cache enable row level security;

drop policy if exists "grocery_lists_select_own" on public.grocery_lists;
create policy "grocery_lists_select_own"
  on public.grocery_lists
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "grocery_lists_insert_own" on public.grocery_lists;
create policy "grocery_lists_insert_own"
  on public.grocery_lists
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "grocery_lists_update_own" on public.grocery_lists;
create policy "grocery_lists_update_own"
  on public.grocery_lists
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "grocery_lists_delete_own" on public.grocery_lists;
create policy "grocery_lists_delete_own"
  on public.grocery_lists
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "grocery_list_items_select_own" on public.grocery_list_items;
create policy "grocery_list_items_select_own"
  on public.grocery_list_items
  for select
  using (
    exists (
      select 1
      from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.user_id = (select auth.uid())
    )
  );

drop policy if exists "grocery_list_items_insert_own" on public.grocery_list_items;
create policy "grocery_list_items_insert_own"
  on public.grocery_list_items
  for insert
  with check (
    exists (
      select 1
      from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.user_id = (select auth.uid())
    )
  );

drop policy if exists "grocery_list_items_update_own" on public.grocery_list_items;
create policy "grocery_list_items_update_own"
  on public.grocery_list_items
  for update
  using (
    exists (
      select 1
      from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.user_id = (select auth.uid())
    )
  );

drop policy if exists "grocery_list_items_delete_own" on public.grocery_list_items;
create policy "grocery_list_items_delete_own"
  on public.grocery_list_items
  for delete
  using (
    exists (
      select 1
      from public.grocery_lists gl
      where gl.id = grocery_list_id
        and gl.user_id = (select auth.uid())
    )
  );

drop policy if exists "ingredient_product_cache_select_own" on public.ingredient_product_cache;
create policy "ingredient_product_cache_select_own"
  on public.ingredient_product_cache
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "ingredient_product_cache_insert_own" on public.ingredient_product_cache;
create policy "ingredient_product_cache_insert_own"
  on public.ingredient_product_cache
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "ingredient_product_cache_update_own" on public.ingredient_product_cache;
create policy "ingredient_product_cache_update_own"
  on public.ingredient_product_cache
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
