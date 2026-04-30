import { AppError } from '../../lib/errors.js';
import type { EquiposRepository } from './equipos.repository.js';
import type { EquipoCreate, EquipoUpdate, EquipoListQuery } from './equipos.schemas.js';

export class EquiposService {
  constructor(private readonly repo: EquiposRepository) {}

  list(opts: EquipoListQuery) {
    return this.repo.list(opts);
  }

  async get(id: string) {
    const e = await this.repo.getById(id);
    if (!e) throw new AppError(404, 'Equipo not found');
    return e;
  }

  create(input: EquipoCreate) {
    return this.repo.create(input);
  }

  update(id: string, patch: EquipoUpdate) {
    return this.repo.update(id, patch);
  }

  remove(id: string) {
    return this.repo.remove(id);
  }

  async getQRToken(id: string): Promise<string> {
    const token = await this.repo.getQRToken(id);
    if (!token) throw new AppError(404, 'Equipo not found');
    return token;
  }

  async getFull(id: string) {
    const data = await this.repo.getFull(id);
    if (!data) throw new AppError(404, 'Equipo not found');

    // Compute metrics + parts aggregation server-side so the client gets
    // ready-to-render numbers.
    const mants = data.mantenimientos as Array<{
      status: string;
      scheduled_date: string;
      parts?: Array<{ qty: number; repuesto: { id: string; code: string; name: string; unit: string; price: number } }>;
    }>;

    const completed = mants.filter((m) => m.status === 'completed');
    const inProgress = mants.filter((m) => m.status === 'in_progress').length;
    const overdue = mants.filter((m) => m.status === 'overdue').length;
    const scheduled = mants.filter((m) => m.status === 'scheduled');

    const partsAgg = new Map<string, { repuesto: { id: string; code: string; name: string; unit: string; price: number }; qty: number; cost: number }>();
    for (const m of mants) {
      for (const p of m.parts ?? []) {
        const key = p.repuesto.id;
        const existing = partsAgg.get(key);
        const cost = (p.qty ?? 0) * (p.repuesto.price ?? 0);
        if (existing) {
          existing.qty += p.qty;
          existing.cost += cost;
        } else {
          partsAgg.set(key, { repuesto: p.repuesto, qty: p.qty, cost });
        }
      }
    }
    const partsAggregated = Array.from(partsAgg.values()).sort((a, b) => b.qty - a.qty);

    const lastCompletedDate = completed[0]?.scheduled_date ?? null;
    const nextScheduledDate = [...scheduled].sort((a, b) =>
      a.scheduled_date.localeCompare(b.scheduled_date),
    )[0]?.scheduled_date ?? null;

    return {
      ...data,
      parts_aggregated: partsAggregated,
      metrics: {
        total: mants.length,
        completed: completed.length,
        in_progress: inProgress,
        overdue,
        scheduled: scheduled.length,
        last_completed_date: lastCompletedDate,
        next_scheduled_date: nextScheduledDate,
        total_parts_qty: partsAggregated.reduce((s, p) => s + p.qty, 0),
        total_parts_cost: partsAggregated.reduce((s, p) => s + p.cost, 0),
      },
    };
  }
}
