import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, mapPgError } from '../../lib/errors.js';
import type { AlertaListQuery } from './alertas.schemas.js';

export class AlertasRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(opts: AlertaListQuery, userId: string) {
    let q = this.db
      .from('alertas')
      .select('*, cliente:clientes(id, code, name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (opts.type)        q = q.eq('type', opts.type);
    if (opts.severity)    q = q.eq('severity', opts.severity);
    if (opts.cliente_id)  q = q.eq('cliente_id', opts.cliente_id);
    if (opts.entity_type) q = q.eq('entity_type', opts.entity_type);

    if (opts.resolved === 'false') q = q.is('resolved_at', null);
    else if (opts.resolved === 'true') q = q.not('resolved_at', 'is', null);

    void userId;
    const { data, error, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
    if (error) {
  console.error('🔥 SUPABASE ERROR:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new AppError(500, error.message, 'SupabaseError');
}
    return { rows: data ?? [], total: count ?? 0 };
  }

  async resolve(id: string, userId: string) {
    const { data, error } = await this.db
      .from('alertas')
      .update({ resolved_at: new Date().toISOString(), resolved_by: userId })
      .eq('id', id)
      .is('resolved_at', null)
      .select()
      .maybeSingle();
    if (error) {
  console.error('🔥 SUPABASE ERROR:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new AppError(500, error.message, 'SupabaseError');
}
    if (!data) throw new AppError(404, 'Alerta not found or already resolved', 'AlreadyResolved');
    return data;
  }
}
