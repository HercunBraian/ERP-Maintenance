-- ============================================================================
-- MaintenancePro CMMS — Phase A: Row Level Security
-- Baseline policies. Authenticated read, admin write, technicians own MNTs.
-- ============================================================================

alter table public.users               enable row level security;
alter table public.clientes            enable row level security;
alter table public.depositos           enable row level security;
alter table public.repuestos           enable row level security;
alter table public.stock_por_deposito  enable row level security;
alter table public.movimientos_stock   enable row level security;
alter table public.kits                enable row level security;
alter table public.kit_repuestos       enable row level security;
alter table public.equipos             enable row level security;
alter table public.mantenimientos      enable row level security;
alter table public.repuestos_usados    enable row level security;
alter table public.alertas             enable row level security;
alter table public.archivos            enable row level security;
alter table public.scan_logs           enable row level security;

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- See own row + admins see all. Users update own profile (cannot self-promote).
create policy users_self_select on public.users for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy users_self_update on public.users for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Block self-promotion: role must equal whatever it is in the table now.
    and role = (select u.role from public.users u where u.id = auth.uid())
  );

create policy users_admin_all on public.users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── CLIENTES ─────────────────────────────────────────────────────────────────
create policy clientes_select on public.clientes for select to authenticated using (true);
create policy clientes_admin  on public.clientes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── DEPOSITOS ────────────────────────────────────────────────────────────────
create policy depositos_select on public.depositos for select to authenticated using (true);
create policy depositos_admin  on public.depositos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── REPUESTOS ────────────────────────────────────────────────────────────────
create policy repuestos_select on public.repuestos for select to authenticated using (true);
create policy repuestos_admin  on public.repuestos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── STOCK ────────────────────────────────────────────────────────────────────
create policy stock_select on public.stock_por_deposito for select to authenticated using (true);
create policy stock_admin  on public.stock_por_deposito for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── MOVIMIENTOS STOCK ────────────────────────────────────────────────────────
-- Read all authenticated; insert by anyone authenticated (techs consume parts).
create policy movs_select on public.movimientos_stock for select to authenticated using (true);
create policy movs_insert on public.movimientos_stock for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());
create policy movs_admin  on public.movimientos_stock for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── KITS ─────────────────────────────────────────────────────────────────────
create policy kits_select         on public.kits          for select to authenticated using (true);
create policy kits_admin          on public.kits          for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy kit_repuestos_select on public.kit_repuestos for select to authenticated using (true);
create policy kit_repuestos_admin  on public.kit_repuestos for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── EQUIPOS ──────────────────────────────────────────────────────────────────
create policy equipos_select on public.equipos for select to authenticated using (true);
create policy equipos_admin  on public.equipos for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── MANTENIMIENTOS ───────────────────────────────────────────────────────────
-- Everyone reads; admins do anything; technicians can create/update their own.
create policy mant_select       on public.mantenimientos for select to authenticated using (true);
create policy mant_admin        on public.mantenimientos for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy mant_tech_insert  on public.mantenimientos for insert to authenticated
  with check (technician_id = auth.uid());
create policy mant_tech_update  on public.mantenimientos for update to authenticated
  using (technician_id = auth.uid())
  with check (technician_id = auth.uid());

-- ─── REPUESTOS USADOS ─────────────────────────────────────────────────────────
create policy ru_select on public.repuestos_usados for select to authenticated using (true);
create policy ru_insert on public.repuestos_usados for insert to authenticated
  with check (
    exists (
      select 1 from public.mantenimientos m
       where m.id = repuestos_usados.mantenimiento_id
         and (m.technician_id = auth.uid() or public.is_admin())
    )
  );
create policy ru_admin  on public.repuestos_usados for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── ALERTAS ──────────────────────────────────────────────────────────────────
create policy alertas_select on public.alertas for select to authenticated using (true);
create policy alertas_admin  on public.alertas for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── ARCHIVOS ─────────────────────────────────────────────────────────────────
create policy archivos_select on public.archivos for select to authenticated using (true);
create policy archivos_insert on public.archivos for insert to authenticated
  with check (uploaded_by = auth.uid());
create policy archivos_delete on public.archivos for delete to authenticated
  using (uploaded_by = auth.uid() or public.is_admin());

-- ─── SCAN LOGS ────────────────────────────────────────────────────────────────
-- Writes happen only via get_equipo_by_qr (SECURITY DEFINER); no direct insert.
create policy scan_logs_admin on public.scan_logs for select to authenticated using (public.is_admin());
