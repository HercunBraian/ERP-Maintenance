import { AppError } from '../../lib/errors.js';
import type { TrazabilidadRepository } from './trazabilidad.repository.js';

interface MantRow {
  status: string;
  scheduled_date: string;
  completed_at: string | null;
  duration_min: number | null;
  parts?: Array<{ qty: number; repuesto: { id: string; code: string; name: string; unit: string; price: number } }>;
}

interface PartRow {
  qty: number;
  repuesto: { id: string; code: string; name: string; unit: string; price: number };
}

function aggregateParts<T extends { qty: number; repuesto: PartRow['repuesto'] }>(rows: T[]) {
  const map = new Map<string, { repuesto: PartRow['repuesto']; qty: number; cost: number }>();
  for (const r of rows) {
    if (!r.repuesto) continue;
    const key = r.repuesto.id;
    const cost = (r.qty ?? 0) * (r.repuesto.price ?? 0);
    const existing = map.get(key);
    if (existing) {
      existing.qty += r.qty;
      existing.cost += cost;
    } else {
      map.set(key, { repuesto: r.repuesto, qty: r.qty, cost });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
}

export class TrazabilidadService {
  constructor(private readonly repo: TrazabilidadRepository) {}

  async byEquipo(equipoId: string) {
    const data = await this.repo.equipoSummary(equipoId);
    if (!data.equipo) throw new AppError(404, 'Equipo not found');

    const mants = data.mantenimientos as unknown as MantRow[];
    const completed = mants.filter((m) => m.status === 'completed');
    const totalDurationMin = completed.reduce((s, m) => s + (m.duration_min ?? 0), 0);
    const partsRows: PartRow[] = mants.flatMap((m) => m.parts ?? []);
    const partsAggregated = aggregateParts(partsRows);

    return {
      equipo: data.equipo,
      timeline: data.mantenimientos,
      alertas: data.alertas,
      parts_aggregated: partsAggregated,
      metrics: {
        total_mantenimientos: mants.length,
        completed: completed.length,
        in_progress: mants.filter((m) => m.status === 'in_progress').length,
        scheduled: mants.filter((m) => m.status === 'scheduled').length,
        overdue: mants.filter((m) => m.status === 'overdue').length,
        total_duration_min: totalDurationMin,
        total_parts_qty: partsAggregated.reduce((s, p) => s + p.qty, 0),
        total_parts_cost: partsAggregated.reduce((s, p) => s + p.cost, 0),
      },
    };
  }

  async byCliente(clienteId: string) {
    const data = await this.repo.clienteSummary(clienteId);
    if (!data.cliente) throw new AppError(404, 'Cliente not found');

    const equipos = data.equipos as Array<{ status: string }>;
    const byStatus = {
      operational: 0,
      alert: 0,
      overdue: 0,
      maintenance: 0,
      inactive: 0,
    };
    for (const e of equipos) byStatus[e.status as keyof typeof byStatus]++;

    const mants = data.mantenimientos as unknown as MantRow[];
    const partsRows: PartRow[] = (data.parts ?? []) as unknown as PartRow[];
    const partsAggregated = aggregateParts(partsRows);

    return {
      cliente: data.cliente,
      equipos: data.equipos,
      mantenimientos_recent: data.mantenimientos,
      parts_aggregated: partsAggregated,
      metrics: {
        equipos_total: equipos.length,
        equipos_by_status: byStatus,
        mantenimientos_total: mants.length,
        mantenimientos_completed: mants.filter((m) => m.status === 'completed').length,
        mantenimientos_overdue: mants.filter((m) => m.status === 'overdue').length,
        mantenimientos_pending: mants.filter((m) =>
          m.status === 'scheduled' || m.status === 'in_progress',
        ).length,
        total_parts_qty: partsAggregated.reduce((s, p) => s + p.qty, 0),
        total_parts_cost: partsAggregated.reduce((s, p) => s + p.cost, 0),
      },
    };
  }
}
