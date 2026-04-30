import type { SupabaseClient } from '@supabase/supabase-js';
import { mapPgError } from '../../lib/errors.js';

export class TrazabilidadRepository {
  constructor(private readonly db: SupabaseClient) {}

  async equipoSummary(equipoId: string) {
    const equipoP = this.db
      .from('equipos')
      .select(`*, cliente:clientes!inner(id, code, name)`)
      .eq('id', equipoId)
      .maybeSingle();

    const mantsP = this.db
      .from('mantenimientos')
      .select(`
        id, code, tipo, status, scheduled_date, started_at, completed_at, duration_min, notes,
        technician:users(id, full_name, avatar),
        kit:kits(id, code, name),
        parts:repuestos_usados(qty, repuesto:repuestos(id, code, name, unit, price))
      `)
      .eq('equipo_id', equipoId)
      .order('scheduled_date', { ascending: false });

    const alertsP = this.db
      .from('alertas')
      .select('*')
      .eq('entity_type', 'equipment')
      .eq('entity_id', equipoId)
      .order('created_at', { ascending: false });

    const [{ data: equipo, error: eErr },
           { data: mantenimientos, error: mErr },
           { data: alertas, error: aErr }] = await Promise.all([equipoP, mantsP, alertsP]);

    if (eErr) throw mapPgError(eErr);
    if (mErr) throw mapPgError(mErr);
    if (aErr) throw mapPgError(aErr);

    return {
      equipo,
      mantenimientos: mantenimientos ?? [],
      alertas: alertas ?? [],
    };
  }

  async clienteSummary(clienteId: string) {
    const clienteP = this.db.from('clientes').select('*').eq('id', clienteId).maybeSingle();

    const equiposP = this.db
      .from('equipos')
      .select(`id, code, serial, model, brand, type, status,
               install_date, last_maintenance_date, next_maintenance_date, location`)
      .eq('cliente_id', clienteId)
      .order('code');

    const mantsP = this.db
      .from('mantenimientos')
      .select(`
        id, code, tipo, status, scheduled_date, completed_at, duration_min,
        equipo:equipos!inner(id, code, serial, model),
        technician:users(id, full_name)
      `)
      .eq('cliente_id', clienteId)
      .order('scheduled_date', { ascending: false })
      .limit(100);

    const partsP = this.db
      .from('repuestos_usados')
      .select(`
        qty,
        mantenimiento:mantenimientos!inner(cliente_id, scheduled_date),
        repuesto:repuestos(id, code, name, unit, price)
      `)
      .eq('mantenimiento.cliente_id', clienteId);

    const [{ data: cliente, error: cErr },
           { data: equipos, error: eErr },
           { data: mantenimientos, error: mErr },
           { data: parts, error: pErr }] = await Promise.all([clienteP, equiposP, mantsP, partsP]);

    if (cErr) throw mapPgError(cErr);
    if (eErr) throw mapPgError(eErr);
    if (mErr) throw mapPgError(mErr);
    if (pErr) throw mapPgError(pErr);

    return {
      cliente,
      equipos: equipos ?? [],
      mantenimientos: mantenimientos ?? [],
      parts: parts ?? [],
    };
  }
}
