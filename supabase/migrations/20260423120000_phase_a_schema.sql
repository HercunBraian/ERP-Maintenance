-- ============================================================================
-- MaintenancePro CMMS — Phase A: Schema
-- Tables, enums, indexes. No RLS, no functions yet.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

create type role_name             as enum ('admin','technician');
create type cliente_type          as enum ('industrial','food','construction','pharma','textile','other');
create type cliente_status        as enum ('active','inactive');
create type equipment_status      as enum ('operational','alert','overdue','maintenance','inactive');
create type maintenance_type_code as enum ('preventive-6m','preventive-12m','corrective','use-based');
create type maintenance_status    as enum ('scheduled','in_progress','completed','overdue','cancelled');
create type alert_type            as enum ('overdue','upcoming','low_stock');
create type alert_severity        as enum ('critical','warning','info');
create type movement_type         as enum ('in','out','adjust');

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- NOTE: id is NOT FK'd to auth.users(id) yet — Phase B adds the trigger that
-- auto-creates a public.users row on auth signup, then we add the FK.
create table public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  full_name   text not null,
  role        role_name not null default 'technician',
  avatar      text,
  phone       text,
  dept        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── CLIENTES ─────────────────────────────────────────────────────────────────
create table public.clientes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  name          text not null,
  address       text,
  phone         text,
  email         text,
  contact_name  text,
  type          cliente_type not null default 'industrial',
  status        cliente_status not null default 'active',
  since         date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_clientes_status on public.clientes(status);

-- ─── DEPÓSITOS ────────────────────────────────────────────────────────────────
create table public.depositos (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  address     text,
  created_at  timestamptz not null default now()
);

-- ─── REPUESTOS ────────────────────────────────────────────────────────────────
create table public.repuestos (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique not null,
  name               text not null,
  description        text,
  unit               text not null default 'unidad',
  price              numeric(12,2) not null default 0,
  compatible_models  text[] not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.stock_por_deposito (
  id              uuid primary key default gen_random_uuid(),
  repuesto_id     uuid not null references public.repuestos(id) on delete cascade,
  deposito_id     uuid not null references public.depositos(id) on delete restrict,
  stock           integer not null default 0 check (stock >= 0),
  min_stock       integer not null default 0 check (min_stock >= 0),
  critical_stock  integer not null default 0 check (critical_stock >= 0),
  updated_at      timestamptz not null default now(),
  unique (repuesto_id, deposito_id)
);
create index idx_stock_repuesto on public.stock_por_deposito(repuesto_id);

create table public.movimientos_stock (
  id               uuid primary key default gen_random_uuid(),
  repuesto_id      uuid not null references public.repuestos(id) on delete cascade,
  deposito_id      uuid not null references public.depositos(id) on delete restrict,
  tipo             movement_type not null,
  qty              integer not null check (qty <> 0),
  mantenimiento_id uuid,  -- FK added after mantenimientos exists
  user_id          uuid references public.users(id) on delete set null,
  notes            text,
  created_at       timestamptz not null default now()
);
create index idx_movs_repuesto_date on public.movimientos_stock(repuesto_id, created_at desc);

-- ─── KITS ─────────────────────────────────────────────────────────────────────
create table public.kits (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  name                text not null,
  equipment_type      text not null,
  brand               text,
  frequency           text not null,            -- '6m', '12m', 'use'
  estimated_time_min  integer not null default 0,
  price               numeric(12,2) not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.kit_repuestos (
  kit_id       uuid not null references public.kits(id) on delete cascade,
  repuesto_id  uuid not null references public.repuestos(id) on delete restrict,
  qty          integer not null check (qty > 0),
  primary key (kit_id, repuesto_id)
);

-- ─── EQUIPOS ──────────────────────────────────────────────────────────────────
create table public.equipos (
  id                     uuid primary key default gen_random_uuid(),
  code                   text unique not null,
  serial                 text unique not null,
  model                  text not null,
  brand                  text not null,
  type                   text not null,
  category               text,
  cliente_id             uuid not null references public.clientes(id) on delete restrict,
  status                 equipment_status not null default 'operational',
  install_date           date,
  last_maintenance_date  date,
  next_maintenance_date  date,
  maintenance_interval   text not null default '6m',
  location               text,
  notes                  text,
  -- QR
  qr_token               text unique not null default encode(gen_random_bytes(8), 'hex'),
  last_scanned_at        timestamptz,
  scan_count             integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index idx_equipos_cliente on public.equipos(cliente_id);
create index idx_equipos_status  on public.equipos(status);
create index idx_equipos_next    on public.equipos(next_maintenance_date);

-- ─── MANTENIMIENTOS ───────────────────────────────────────────────────────────
create table public.mantenimientos (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  equipo_id       uuid not null references public.equipos(id) on delete restrict,
  cliente_id      uuid not null references public.clientes(id) on delete restrict,
  tipo            maintenance_type_code not null,
  scheduled_date  date not null,
  status          maintenance_status not null default 'scheduled',
  technician_id   uuid references public.users(id) on delete set null,
  kit_id          uuid references public.kits(id) on delete set null,
  notes           text,
  duration_min    integer,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_mant_equipo on public.mantenimientos(equipo_id, scheduled_date desc);
create index idx_mant_status on public.mantenimientos(status);
create index idx_mant_date   on public.mantenimientos(scheduled_date);

-- Now we can add the FK on movimientos_stock.mantenimiento_id
alter table public.movimientos_stock
  add constraint fk_movs_mantenimiento
  foreign key (mantenimiento_id)
  references public.mantenimientos(id) on delete set null;

-- ─── REPUESTOS USADOS ─────────────────────────────────────────────────────────
create table public.repuestos_usados (
  id                uuid primary key default gen_random_uuid(),
  mantenimiento_id  uuid not null references public.mantenimientos(id) on delete cascade,
  repuesto_id       uuid not null references public.repuestos(id) on delete restrict,
  qty               integer not null check (qty > 0),
  deposito_id       uuid references public.depositos(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index idx_rep_usados_mant on public.repuestos_usados(mantenimiento_id);

-- ─── ALERTAS ──────────────────────────────────────────────────────────────────
create table public.alertas (
  id           uuid primary key default gen_random_uuid(),
  type         alert_type not null,
  severity     alert_severity not null,
  message      text not null,
  entity_type  text not null,            -- 'equipment' | 'part'
  entity_id    uuid not null,            -- polymorphic; no FK
  cliente_id   uuid references public.clientes(id) on delete cascade,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid references public.users(id) on delete set null
);
create index idx_alertas_unresolved on public.alertas(severity, created_at desc) where resolved_at is null;
create index idx_alertas_entity     on public.alertas(entity_type, entity_id);

-- ─── ARCHIVOS (Storage references) ────────────────────────────────────────────
create table public.archivos (
  id                uuid primary key default gen_random_uuid(),
  mantenimiento_id  uuid references public.mantenimientos(id) on delete cascade,
  equipo_id         uuid references public.equipos(id) on delete cascade,
  name              text not null,
  mime_type         text,
  size_bytes        bigint,
  storage_bucket    text not null default 'maintenance-files',
  storage_path      text not null,
  uploaded_by       uuid references public.users(id) on delete set null,
  uploaded_at       timestamptz not null default now(),
  check (mantenimiento_id is not null or equipo_id is not null)
);

-- ─── SCAN LOGS ────────────────────────────────────────────────────────────────
create table public.scan_logs (
  id          uuid primary key default gen_random_uuid(),
  equipo_id   uuid not null references public.equipos(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  user_agent  text,
  ip          inet,
  scanned_at  timestamptz not null default now()
);
create index idx_scan_logs_equipo on public.scan_logs(equipo_id, scanned_at desc);

-- ─── REALTIME PUBLICATION ─────────────────────────────────────────────────────
-- Tables that the dashboard subscribes to for live updates.
alter publication supabase_realtime add table
  public.equipos,
  public.mantenimientos,
  public.alertas,
  public.stock_por_deposito;
