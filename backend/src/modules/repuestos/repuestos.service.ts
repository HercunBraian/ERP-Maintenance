import { AppError } from '../../lib/errors.js';
import type { RepuestosRepository } from './repuestos.repository.js';
import type { RepuestoCreate, RepuestoUpdate, RepuestoListQuery } from './repuestos.schemas.js';

export class RepuestosService {
  constructor(private readonly repo: RepuestosRepository) {}

  list(opts: RepuestoListQuery) { return this.repo.list(opts); }
  async get(id: string) {
    const r = await this.repo.getById(id);
    if (!r) throw new AppError(404, 'Repuesto not found');
    return r;
  }
  create(input: RepuestoCreate) { return this.repo.create(input); }
  update(id: string, patch: RepuestoUpdate) { return this.repo.update(id, patch); }
  remove(id: string) { return this.repo.remove(id); }
}
