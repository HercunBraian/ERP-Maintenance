import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, mapPgError } from '../../lib/errors.js';
import type { RepuestoCreate, RepuestoUpdate, RepuestoListQuery } from './repuestos.schemas.js';

const STOCK_JOIN = `
  *,
  stock:stock_por_deposito(stock, min_stock, critical_stock, deposito:depositos(id, code, name))
`;

export class RepuestosRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(opts: RepuestoListQuery) {
    const cols = opts.with_stock ? STOCK_JOIN : '*';
    let q = this.db.from('repuestos').select(cols, { count: 'exact' }).order('code');
    if (opts.search) {
      const term = opts.search.replace(/[%,]/g, '');
      q = q.or(`code.ilike.%${term}%,name.ilike.%${term}%,description.ilike.%${term}%`);
    }
    const { data, error, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
    if (error) throw mapPgError(error);
    return { rows: data ?? [], total: count ?? 0 };
  }

  async getById(id: string) {
    const { data, error } = await this.db
      .from('repuestos')
      .select(STOCK_JOIN)
      .eq('id', id)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return data;
  }

  async create(input: RepuestoCreate) {
    const { data, error } = await this.db.from('repuestos').insert(input).select().single();
    if (error) throw mapPgError(error);
    return data;
  }

  async update(id: string, patch: RepuestoUpdate) {
    const { data, error } = await this.db
      .from('repuestos')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw mapPgError(error);
    if (!data) throw new AppError(404, 'Repuesto not found');
    return data;
  }

  async remove(id: string) {
    const { error, count } = await this.db
      .from('repuestos')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw mapPgError(error);
    if (count === 0) throw new AppError(404, 'Repuesto not found');
  }
}
