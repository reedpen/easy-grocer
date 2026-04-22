alter table public.profiles
  add column if not exists preferred_height_unit text not null default 'cm'
    check (preferred_height_unit in ('cm', 'ft_in')),
  add column if not exists preferred_weight_unit text not null default 'kg'
    check (preferred_weight_unit in ('kg', 'lb'));
