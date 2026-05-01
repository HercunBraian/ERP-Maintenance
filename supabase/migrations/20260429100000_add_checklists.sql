-- Checklist templates: one per equipment type, versioned
create table if not exists checklist_templates (
  id             uuid        primary key default gen_random_uuid(),
  name           text        not null,
  equipment_type text        not null,
  version        int         not null default 1,
  is_active      boolean     not null default true,
  items          jsonb       not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- One active template assigned to one equipment
create table if not exists equipment_checklists (
  id                    uuid        primary key default gen_random_uuid(),
  equipo_id             uuid        not null unique references equipos(id) on delete cascade,
  checklist_template_id uuid        not null references checklist_templates(id),
  created_at            timestamptz not null default now()
);

-- Execution record per maintenance (auto-created for preventive types)
create table if not exists maintenance_checklists (
  id               uuid        primary key default gen_random_uuid(),
  mantenimiento_id uuid        not null unique references mantenimientos(id) on delete cascade,
  template_snapshot jsonb      not null default '[]'::jsonb,
  answers          jsonb       not null default '{}'::jsonb,
  status           text        not null default 'in_progress'
                               check (status in ('in_progress', 'completed')),
  started_at       timestamptz not null default now(),
  completed_at     timestamptz
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table checklist_templates    enable row level security;
alter table equipment_checklists   enable row level security;
alter table maintenance_checklists enable row level security;

-- Templates: all authenticated can read; only admin can write
create policy "checklist_templates_select"
  on checklist_templates for select
  to authenticated using (true);

create policy "checklist_templates_admin"
  on checklist_templates for all
  to authenticated
  using  ((select role from users where id = auth.uid()) = 'admin')
  with check ((select role from users where id = auth.uid()) = 'admin');

-- Equipment checklists: all authenticated can read; only admin can write
create policy "equipment_checklists_select"
  on equipment_checklists for select
  to authenticated using (true);

create policy "equipment_checklists_admin"
  on equipment_checklists for all
  to authenticated
  using  ((select role from users where id = auth.uid()) = 'admin')
  with check ((select role from users where id = auth.uid()) = 'admin');

-- Maintenance checklists: all authenticated can read and write
-- (technicians fill them out; admins manage them; auto-created server-side)
create policy "maintenance_checklists_auth"
  on maintenance_checklists for all
  to authenticated using (true) with check (true);
