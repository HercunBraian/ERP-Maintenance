import type { SupabaseClient } from '@supabase/supabase-js';
import { mapPgError } from '../../lib/errors.js';
import type { StockListQuery, AdjustStock, SetThresholds } from './stock.schemas.js';

const SELECT = `
  id, stock, min_stock, critical_stock, updated_at,
  repuesto:repuestos!inner(id, code, name, unit, price),
  deposito:depositos!inner(id, code, name)
`;

export class StockRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(opts: StockListQuery) {
    let q = this.db
      .from('stock_por_deposito')
      .select(SELECT, { count: 'exact' })
      .order('updated_at', { ascending: false });

    if (opts.deposito_id) q = q.eq('deposito_id', opts.deposito_id);
    if (opts.repuesto_id) q = q.eq('repuesto_id', opts.repuesto_id);
    // low_stock: stock <= min_stock — handled in JS post-filter (PostgREST
    // can't compare two columns in `or` clauses). For ~hundreds of rows this
    // is fine; if it grows, we'd add a generated column or a view.
    const { data, error, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
    if (error) throw mapPgError(error);

    let rows = data ?? [];
    if (opts.low_stock) {
      rows = rows.filter(
        (r: { stock: number; min_stock: number }) => r.stock <= r.min_stock,
      );
    }
    return { rows, total: opts.low_stock ? rows.length : count ?? 0 };
  }

  async adjust(input: AdjustStock): Promise<{ stock: number }> {
    const { data, error } = await this.db.rpc('adjust_stock', {
      p_repuesto_id: input.repuesto_id,
      p_deposito_id: input.deposito_id,
      p_delta: input.delta,
      p_notes: input.notes ?? null,
    });
    if (error) throw mapPgError(error);
    return { stock: data as number };
  }

  async setThresholds(input: SetThresholds) {
    const { data, error } = await this.db
      .from('stock_por_deposito')
      .upsert(
        {
          repuesto_id:    input.repuesto_id,
          deposito_id:    input.deposito_id,
          min_stock:      input.min_stock,
          critical_stock: input.critical_stock,
        },
        { onConflict: 'repuesto_id,deposito_id' },
      )
      .select(SELECT)
      .single();
    if (error) throw mapPgError(error);
    return data;
  }

  async movements(repuestoId: string, limit = 50) {
    const { data, error } = await this.db
      .from('movimientos_stock')
      .select('*, deposito:depositos(id, code, name)')
      .eq('repuesto_id', repuestoId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw mapPgError(error);
    return data ?? [];
  }
}
