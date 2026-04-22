alter table public.dietary_preferences
  add column if not exists meals_per_day integer not null default 3
    check (meals_per_day between 2 and 4),
  add column if not exists include_snacks boolean not null default false,
  add column if not exists snacks_per_day integer not null default 0
    check (snacks_per_day between 0 and 3);
