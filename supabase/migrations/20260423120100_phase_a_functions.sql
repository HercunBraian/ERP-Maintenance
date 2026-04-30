-- ============================================================================
-- MaintenancePro CMMS — Phase A: Functions & Triggers
-- Business logic: next-maintenance calc, equipment status, public QR scan.
-- ============================================================================

-- ─── Generic updated_at trigger ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

do $$ declare t text;
begin
  for t in select unnest(array[
    'users','clientes','repuestos','kits','equipos','mantenimientos'
  ])
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ─── Map maintenance interval code → interval ─────────────────────────────────
create or replace function public.interval_from_code(p_code text)
returns interval language sql immutable as $$
  select case p_code
    when '1m'  then interval '1 month'
    when '3m'  then interval '3 months'
    when '6m'  then interval '6 months'
    when '12m' then interval '12 months'
    else null
  end
$$;

-- ─── Next maintenance date for an equipo ──────────────────────────────────────
create or replace function public.calculate_next_maintenance(p_equipo_id uuid)
returns date language plpgsql as $$
declare
  v_last  date;
  v_iv    interval;
  v_code  text;
begin
  select maintenance_interval into v_code from public.equipos where id = p_equipo_id;
  v_iv := public.interval_from_code(v_code);
  if v_iv is null then return null; end if;

  -- Last completed preventive maintenance
  select max(scheduled_date) into v_last
    from public.mantenimientos
   where equipo_id = p_equipo_id
     and status = 'completed'
     and tipo in ('preventive-6m','preventive-12m');

  -- Fall back to install date if there's no history
  if v_last is null then
    select install_date into v_last from public.equipos where id = p_equipo_id;
  end if;

  if v_last is null then return null; end if;
  return (v_last + v_iv)::date;
end$$;

-- ─── Compute equipment status from next-maintenance proximity ─────────────────
-- Returns: maintenance > overdue > alert > operational
create or replace function public.compute_equipment_status(p_equipo_id uuid)
returns equipment_status language plpgsql as $$
declare
  v_next        date;
  v_in_progress integer;
begin
  select count(*) into v_in_progress
    from public.mantenimientos
   where equipo_id = p_equipo_id and status = 'in_progress';
  if v_in_progress > 0 then return 'maintenance'; end if;

  v_next := public.calculate_next_maintenance(p_equipo_id);
  if v_next is null then return 'operational'; end if;

  if v_next < current_date            then return 'overdue'; end if;
  if v_next <= current_date + 30      then return 'alert';   end if;
  return 'operational';
end$$;

-- ─── Refresh equipo summary fields after a mantenimiento change ───────────────
create or replace function public.refresh_equipo_after_mant()
returns trigger language plpgsql as $$
declare
  v_eid  uuid := coalesce(new.equipo_id, old.equipo_id);
  v_last date;
begin
  select max(scheduled_date) into v_last
    from public.mantenimientos
   where equipo_id = v_eid and status = 'completed';

  update public.equipos
     set last_maintenance_date = v_last,
         next_maintenance_date = public.calculate_next_maintenance(v_eid),
         status                = public.compute_equipment_status(v_eid)
   where id = v_eid;
  return null;
end$$;

drop trigger if exists trg_refresh_equipo_after_mant on public.mantenimientos;
create trigger trg_refresh_equipo_after_mant
  after insert or update or delete on public.mantenimientos
  for each row execute function public.refresh_equipo_after_mant();

-- ─── Public QR scan: minimal info + log + scan_count++ ────────────────────────
-- SECURITY DEFINER lets anon hit this without granting them direct table access.
-- Returns one row, or empty if the token doesn't match.
create or replace function public.get_equipo_by_qr(
  p_token       text,
  p_user_agent  text default null,
  p_ip          inet default null
)
returns table (
  equipo_id              uuid,
  serial                 text,
  model                  text,
  brand                  text,
  cliente_name           text,
  status                 equipment_status,
  next_maintenance_date  date,
  scan_count             integer
)
language plpgsql security definer
set search_path = public
as $$
declare v_id uuid;
begin
  select e.id into v_id from public.equipos e where e.qr_token = p_token;
  if v_id is null then return; end if;

  update public.equipos e
   set scan_count      = e.scan_count + 1,
       last_scanned_at = now()
 where e.id = v_id;

  insert into public.scan_logs (equipo_id, user_agent, ip, user_id)
  values (v_id, p_user_agent, p_ip, auth.uid());

  return query
    select e.id, e.serial, e.model, e.brand, c.name, e.status,
           e.next_maintenance_date, e.scan_count
      from public.equipos e
      join public.clientes c on c.id = e.cliente_id
     where e.id = v_id;
end$$;

revoke all on function public.get_equipo_by_qr(text, text, inet) from public;
grant execute on function public.get_equipo_by_qr(text, text, inet) to anon, authenticated;

-- ─── Auth helpers used by RLS ─────────────────────────────────────────────────
create or replace function public.current_user_role()
returns role_name language sql stable security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;
