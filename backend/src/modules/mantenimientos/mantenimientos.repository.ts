import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, mapPgError } from '../../lib/errors.js';
import type { MantCreate, MantUpdate, MantListQuery, AddPart } from './mantenimientos.schemas.js';

const DETAIL_SELECT = `
  *,
  equipo:equipos!inner(id, code, serial, model, brand, status, location),
  cliente:clientes!inner(id, code, name),
  kit:kits(id, code, name, frequency, estimated_time_min),
  parts:repuestos_usados(
    id, qty, created_at,
    repuesto:repuestos(id, code, name, unit, price),
    deposito:depositos(id, code, name)
  )
`;

const LIST_SELECT = `
  *,
  equipo:equipos!inner(id, code, serial, model, brand),
  cliente:clientes!inner(id, code, name)
`;

export class MantenimientosRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(opts: MantListQuery) {
    let q = this.db
      .from('mantenimientos')
      .select(LIST_SELECT, { count: 'exact' })
      .order('scheduled_date', { ascending: false });

    if (opts.equipo_id)     q = q.eq('equipo_id', opts.equipo_id);
    if (opts.cliente_id)    q = q.eq('cliente_id', opts.cliente_id);
    if (opts.technician_id) q = q.eq('technician_id', opts.technician_id);
    if (opts.status)        q = q.eq('status', opts.status);
    if (opts.from)          q = q.gte('scheduled_date', opts.from);
    if (opts.to)            q = q.lte('scheduled_date', opts.to);

    const { data, error, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
    if (error) throw mapPgError(error);
    return { rows: data ?? [], total: count ?? 0 };
  }

  async getById(id: string) {
    const { data, error } = await this.db
      .from('mantenimientos')
      .select(DETAIL_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return data;
  }

  async getRaw(id: string) {
    const { data, error } = await this.db
      .from('mantenimientos')
      .select('id, status, started_at, completed_at, technician_id')
      .eq('id', id)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return data as
      | { id: string; status: string; started_at: string | null; completed_at: string | null; technician_id: string | null }
      | null;
  }

  /** Look up the equipo's cliente_id so the service can derive it. */
  async equipoClienteId(equipoId: string): Promise<string | null> {
    const { data, error } = await this.db
      .from('equipos')
      .select('cliente_id')
      .eq('id', equipoId)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return (data?.cliente_id as string | undefined) ?? null;
  }

  async create(input: MantCreate & { cliente_id: string }) {
    const { data, error } = await this.db
      .from('mantenimientos')
      .insert(input)
      .select(LIST_SELECT)
      .single();
    if (error) throw mapPgError(error);
    return data;
  }

  async update(id: string, patch: MantUpdate & { started_at?: string | null; completed_at?: string | null; duration_min?: number | null }) {
    const { data, error } = await this.db
      .from('mantenimientos')
      .update(patch)
      .eq('id', id)
      .select(LIST_SELECT)
      .maybeSingle();
    if (error) throw mapPgError(error);
    if (!data) throw new AppError(404, 'Mantenimiento not found');
    return data;
  }

  async remove(id: string) {
    const { error, count } = await this.db
      .from('mantenimientos')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw mapPgError(error);
    if (count === 0) throw new AppError(404, 'Mantenimiento not found');
  }

  /** Atomic: insert repuestos_usados + movimiento + decrement stock. */
  async consumePart(mantId: string, part: AddPart): Promise<{ id: string }> {
    const { data, error } = await this.db.rpc('consume_part', {
      p_mant_id: mantId,
      p_repuesto_id: part.repuesto_id,
      p_qty: part.qty,
      p_deposito_id: part.deposito_id,
    });
    if (error) throw mapPgError(error);
    return { id: data as string };
  }

  /** Removes a parts-used row only. Stock is NOT auto-replenished. */
  async removePart(mantId: string, partId: string) {
    const { error, count } = await this.db
      .from('repuestos_usados')
      .delete({ count: 'exact' })
      .eq('id', partId)
      .eq('mantenimiento_id', mantId);
    if (error) throw mapPgError(error);
    if (count === 0) throw new AppError(404, 'Part record not found');
  }
}
