-- Equipment types: values used in equipos.type and kits.equipment_type
create table if not exists equipment_types (
  id         uuid        primary key default gen_random_uuid(),
  name       text        unique not null,
  created_at timestamptz not null default now()
);

-- Equipment categories: values used in equipos.category
create table if not exists equipment_categories (
  id         uuid        primary key default gen_random_uuid(),
  name       text        unique not null,
  created_at timestamptz not null default now()
);

alter table equipment_types      enable row level security;
alter table equipment_categories enable row level security;

-- All authenticated users can read
create policy "eq_types_select" on equipment_types
  for select to authenticated using (true);

create policy "eq_types_admin" on equipment_types
  for all to authenticated
  using  (public.is_admin())
  with check (public.is_admin());

create policy "eq_cats_select" on equipment_categories
  for select to authenticated using (true);

create policy "eq_cats_admin" on equipment_categories
  for all to authenticated
  using  (public.is_admin())
  with check (public.is_admin());
