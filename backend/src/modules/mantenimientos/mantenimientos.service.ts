import { AppError } from '../../lib/errors.js';
import type { MantenimientosRepository } from './mantenimientos.repository.js';
import type { MantCreate, MantUpdate, MantListQuery, AddPart } from './mantenimientos.schemas.js';

export class MantenimientosService {
  constructor(private readonly repo: MantenimientosRepository) {}

  list(opts: MantListQuery) {
    return this.repo.list(opts);
  }

  async get(id: string) {
    const m = await this.repo.getById(id);
    if (!m) throw new AppError(404, 'Mantenimiento not found');
    return m;
  }

  async create(input: MantCreate) {
    // Always derive cliente_id from the equipo to keep them consistent.
    const cliente_id = await this.repo.equipoClienteId(input.equipo_id);
    if (!cliente_id) throw new AppError(404, 'Equipo not found', 'EquipoNotFound');
    return this.repo.create({ ...input, cliente_id });
  }

  update(id: string, patch: MantUpdate) {
    return this.repo.update(id, patch);
  }

  remove(id: string) {
    return this.repo.remove(id);
  }

  /** scheduled → in_progress, sets started_at. */
  async start(id: string) {
    const m = await this.repo.getRaw(id);
    if (!m) throw new AppError(404, 'Mantenimiento not found');
    if (m.status !== 'scheduled' && m.status !== 'overdue') {
      throw new AppError(409, `Cannot start a mantenimiento in status '${m.status}'`, 'InvalidStatusTransition');
    }
    return this.repo.update(id, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });
  }

  /** in_progress → completed, sets completed_at + duration_min. */
  async complete(id: string) {
    const m = await this.repo.getRaw(id);
    if (!m) throw new AppError(404, 'Mantenimiento not found');
    if (m.status !== 'in_progress') {
      throw new AppError(409, `Cannot complete a mantenimiento in status '${m.status}'`, 'InvalidStatusTransition');
    }
    const completedAt = new Date();
    const startedAt = m.started_at ? new Date(m.started_at) : null;
    const duration_min = startedAt
      ? Math.max(1, Math.round((completedAt.getTime() - startedAt.getTime()) / 60_000))
      : null;
    return this.repo.update(id, {
      status: 'completed',
      completed_at: completedAt.toISOString(),
      duration_min,
    });
  }

  async cancel(id: string) {
    const m = await this.repo.getRaw(id);
    if (!m) throw new AppError(404, 'Mantenimiento not found');
    if (m.status === 'completed') {
      throw new AppError(409, 'Cannot cancel a completed mantenimiento', 'InvalidStatusTransition');
    }
    return this.repo.update(id, { status: 'cancelled' });
  }

  addPart(mantId: string, part: AddPart) {
    return this.repo.consumePart(mantId, part);
  }

  removePart(mantId: string, partId: string) {
    return this.repo.removePart(mantId, partId);
  }
}
