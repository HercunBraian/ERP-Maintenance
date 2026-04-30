import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, mapPgError } from '../../lib/errors.js';
import type { KitCreate, KitUpdate, KitListQuery, AddKitPart } from './kits.schemas.js';

const DETAIL_SELECT = `
  *,
  parts:kit_repuestos(qty, repuesto:repuestos(id, code, name, unit, price))
`;

export class KitsRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(opts: KitListQuery) {
    let q = this.db.from('kits').select('*', { count: 'exact' }).order('code');
    if (opts.equipment_type) q = q.eq('equipment_type', opts.equipment_type);
    if (opts.brand) q = q.eq('brand', opts.brand);
    if (opts.frequency) q = q.eq('frequency', opts.frequency);
    const { data, error, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
    if (error) throw mapPgError(error);
    return { rows: data ?? [], total: count ?? 0 };
  }

  async getById(id: string) {
    const { data, error } = await this.db
      .from('kits')
      .select(DETAIL_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return data;
  }

  async create(input: KitCreate) {
    const { data, error } = await this.db.from('kits').insert(input).select().single();
    if (error) throw mapPgError(error);
    return data;
  }

  async update(id: string, patch: KitUpdate) {
    const { data, error } = await this.db
      .from('kits')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw mapPgError(error);
    if (!data) throw new AppError(404, 'Kit not found');
    return data;
  }

  async remove(id: string) {
    const { error, count } = await this.db.from('kits').delete({ count: 'exact' }).eq('id', id);
    if (error) throw mapPgError(error);
    if (count === 0) throw new AppError(404, 'Kit not found');
  }

  async addPart(kitId: string, part: AddKitPart) {
    const { data, error } = await this.db
      .from('kit_repuestos')
      .upsert({ kit_id: kitId, repuesto_id: part.repuesto_id, qty: part.qty })
      .select()
      .single();
    if (error) throw mapPgError(error);
    return data;
  }

  async removePart(kitId: string, repuestoId: string) {
    const { error, count } = await this.db
      .from('kit_repuestos')
      .delete({ count: 'exact' })
      .eq('kit_id', kitId)
      .eq('repuesto_id', repuestoId);
    if (error) throw mapPgError(error);
    if (count === 0) throw new AppError(404, 'Kit part not found');
  }
}
