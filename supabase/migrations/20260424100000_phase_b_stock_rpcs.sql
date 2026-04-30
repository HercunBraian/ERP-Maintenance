-- ============================================================================
-- MaintenancePro CMMS — Phase B (slice 2): Stock RPCs
-- consume_part   — atomic part consumption during a maintenance
-- adjust_stock   — admin-only manual adjustment with audit trail
-- ============================================================================

-- ─── consume_part ────────────────────────────────────────────────────────────
-- Atomically: insert repuestos_usados row, insert movimientos_stock row,
-- decrement stock_por_deposito.stock. Locks the stock row FOR UPDATE so
-- concurrent consumes can't oversell.
create or replace function public.consume_part(
  p_mant_id      uuid,
  p_repuesto_id  uuid,
  p_qty          integer,
  p_deposito_id  uuid
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_used_id   uuid;
  v_current   integer;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'qty must be > 0' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.mantenimientos m
     where m.id = p_mant_id
       and (m.technician_id = v_user or public.is_admin())
  ) then
    raise exception 'Forbidden or mantenimiento not found' using errcode = '42501';
  end if;

  select stock into v_current
    from public.stock_por_deposito
   where repuesto_id = p_repuesto_id and deposito_id = p_deposito_id
   for update;

  if v_current is null then
    raise exception 'No stock row for this repuesto/depósito pair' using errcode = '23503';
  end if;
  if v_current < p_qty then
    raise exception 'Insufficient stock (have %, need %)', v_current, p_qty using errcode = '23514';
  end if;

  insert into public.repuestos_usados (mantenimiento_id, repuesto_id, qty, deposito_id)
       values (p_mant_id, p_repuesto_id, p_qty, p_deposito_id)
    returning id into v_used_id;

  insert into public.movimientos_stock
    (repuesto_id, deposito_id, tipo, qty, mantenimiento_id, user_id, notes)
  values
    (p_repuesto_id, p_deposito_id, 'out', -p_qty, p_mant_id, v_user, 'consumed in maintenance');

  update public.stock_por_deposito
     set stock      = stock - p_qty,
         updated_at = now()
   where repuesto_id = p_repuesto_id and deposito_id = p_deposito_id;

  return v_used_id;
end$$;

revoke all on function public.consume_part(uuid, uuid, integer, uuid) from public;
grant  execute on function public.consume_part(uuid, uuid, integer, uuid) to authenticated;

-- ─── adjust_stock ────────────────────────────────────────────────────────────
-- Admin-only manual stock adjustment. Creates a stock_por_deposito row if
-- missing. Records the movement. Returns the resulting stock level.
create or replace function public.adjust_stock(
  p_repuesto_id  uuid,
  p_deposito_id  uuid,
  p_delta        integer,
  p_notes        text default null
)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_new_stock integer;
begin
  if not public.is_admin() then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  if p_delta is null or p_delta = 0 then
    select stock into v_new_stock
      from public.stock_por_deposito
     where repuesto_id = p_repuesto_id and deposito_id = p_deposito_id;
    return coalesce(v_new_stock, 0);
  end if;

  insert into public.stock_por_deposito (repuesto_id, deposito_id, stock)
       values (p_repuesto_id, p_deposito_id, greatest(p_delta, 0))
  on conflict (repuesto_id, deposito_id) do update
       set stock      = greatest(stock_por_deposito.stock + p_delta, 0),
           updated_at = now()
    returning stock into v_new_stock;

  insert into public.movimientos_stock
    (repuesto_id, deposito_id, tipo, qty, user_id, notes)
  values
    (p_repuesto_id, p_deposito_id,
     case when p_delta > 0 then 'in' else 'out' end,
     p_delta, v_user, p_notes);

  return v_new_stock;
end$$;

revoke all on function public.adjust_stock(uuid, uuid, integer, text) from public;
grant  execute on function public.adjust_stock(uuid, uuid, integer, text) to authenticated;
