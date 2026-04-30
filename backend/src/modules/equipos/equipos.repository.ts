import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, mapPgError } from '../../lib/errors.js';
import type { EquipoCreate, EquipoUpdate, EquipoListQuery } from './equipos.schemas.js';

const DETAIL_SELECT = `
  *,
  cliente:clientes!inner(id, code, name)
`;

export class EquiposRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(opts: EquipoListQuery) {
    let q = this.db
      .from('equipos')
      .select(`*, cliente:clientes!inner(id, code, name)`, { count: 'exact' })
      .order('code', { ascending: true });

    if (opts.cliente_id) q = q.eq('cliente_id', opts.cliente_id);
    if (opts.status) q = q.eq('status', opts.status);
    if (opts.search) {
      const term = opts.search.replace(/[%,]/g, '');
      const asInt = /^\d+$/.test(term) ? Number(term) : null;
      const codeClause = asInt !== null ? `,code.eq.${asInt}` : '';
      q = q.or(`serial.ilike.%${term}%,model.ilike.%${term}%,brand.ilike.%${term}%${codeClause}`);
    }

    const { data, error, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
    if (error) throw mapPgError(error);
    return { rows: data ?? [], total: count ?? 0 };
  }

  async getById(id: string) {
    const { data, error } = await this.db.from('equipos').select(DETAIL_SELECT).eq('id', id).maybeSingle();
    if (error) throw mapPgError(error);
    return data;
  }

  async create(input: EquipoCreate) {
    const { data, error } = await this.db.from('equipos').insert(input).select().single();
    if (error) throw mapPgError(error);
    return data;
  }

  async update(id: string, patch: EquipoUpdate) {
    const { data, error } = await this.db
      .from('equipos')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw mapPgError(error);
    if (!data) throw new AppError(404, 'Equipo not found');
    return data;
  }

  async remove(id: string) {
    const { error, count } = await this.db.from('equipos').delete({ count: 'exact' }).eq('id', id);
    if (error) throw mapPgError(error);
    if (count === 0) throw new AppError(404, 'Equipo not found');
  }

  /** Just the qr_token for the QR generation endpoint. */
  async getQRToken(id: string): Promise<string | null> {
    const { data, error } = await this.db
      .from('equipos')
      .select('qr_token')
      .eq('id', id)
      .maybeSingle();
    if (error) throw mapPgError(error);
    return (data?.qr_token as string | undefined) ?? null;
  }

  /**
   * Composite read for the equipo detail page. Pulls equipo + cliente,
   * last 50 mantenimientos with kit + parts, active alerts, and last 10
   * scan_logs (which RLS hides for non-admins).
   */
  async getFull(id: string) {
    const equipoP = this.db
      .from('equipos')
      .select(`*, cliente:clientes!inner(id, code, name, contact_name, phone, email)`)
      .eq('id', id)
      .maybeSingle();

    const mantsP = this.db
      .from('mantenimientos')
      .select(`
        *,
        kit:kits(id, code, name, frequency),
        parts:repuestos_usados(
          qty,
          repuesto:repuestos(id, code, name, unit, price)
        )
      `)
      .eq('equipo_id', id)
      .order('scheduled_date', { ascending: false })
      .limit(50);

    const alertsP = this.db
      .from('alertas')
      .select('*')
      .eq('entity_type', 'equipment')
      .eq('entity_id', id)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    const scansP = this.db
      .from('scan_logs')
      .select('id, scanned_at, user_agent, ip')
      .eq('equipo_id', id)
      .order('scanned_at', { ascending: false })
      .limit(10);

    const [{ data: equipo, error: eErr },
           { data: mantenimientos, error: mErr },
           { data: alertas, error: aErr },
           { data: scans, error: sErr }] = await Promise.all([equipoP, mantsP, alertsP, scansP]);

    if (eErr) throw mapPgError(eErr);
    if (mErr) throw mapPgError(mErr);
    if (aErr) throw mapPgError(aErr);
    if (sErr) throw mapPgError(sErr);

    if (!equipo) return null;

    return {
      equipo,
      mantenimientos: mantenimientos ?? [],
      alertas: alertas ?? [],
      scans: scans ?? [],
    };
  }
}
