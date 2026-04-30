-- ============================================================================
-- Fix: ambiguous column reference 'scan_count' in get_equipo_by_qr
--
-- Root cause: the function declares `returns table (... scan_count integer)`
-- which puts `scan_count` in scope as an OUT parameter. Inside plpgsql, any
-- bare `scan_count` reference (including in the UPDATE SET clause) collides
-- with the column of the same name on `public.equipos`.
--
-- Fix: capture the new count with RETURNING INTO a local variable and reuse
-- it in the final RETURN QUERY. All table references go through aliases (eq,
-- cl) so nothing else can collide with the OUT parameter names either
-- (`serial`, `model`, `brand`, `status`, `next_maintenance_date`).
-- ============================================================================

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
declare
  v_id        uuid;
  v_new_count integer;
begin
  -- 1) Look up the equipo by its QR token
  select eq.id into v_id
    from public.equipos eq
   where eq.qr_token = p_token;
  if v_id is null then return; end if;

  -- 2) Increment counter + refresh timestamp atomically. RETURNING captures
  --    the post-update value so we don't have to read it again afterwards.
  update public.equipos as eq
     set scan_count      = eq.scan_count + 1,
         last_scanned_at = now()
   where eq.id = v_id
   returning eq.scan_count into v_new_count;

  -- 3) Audit-log the scan (auth.uid() is null for anonymous public scans)
  insert into public.scan_logs (equipo_id, user_agent, ip, user_id)
  values (v_id, p_user_agent, p_ip, auth.uid());

  -- 4) Return the equipo data. Every column is qualified with eq./cl. so
  --    Postgres doesn't try to resolve unqualified identifiers against the
  --    OUT parameters declared in RETURNS TABLE.
  return query
    select eq.id,
           eq.serial,
           eq.model,
           eq.brand,
           cl.name,
           eq.status,
           eq.next_maintenance_date,
           v_new_count
      from public.equipos  eq
      join public.clientes cl on cl.id = eq.cliente_id
     where eq.id = v_id;
end$$;

revoke all  on function public.get_equipo_by_qr(text, text, inet) from public;
grant execute on function public.get_equipo_by_qr(text, text, inet) to anon, authenticated;
