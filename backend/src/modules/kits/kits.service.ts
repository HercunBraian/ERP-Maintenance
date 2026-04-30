import { AppError } from '../../lib/errors.js';
import type { KitsRepository } from './kits.repository.js';
import type { KitCreate, KitUpdate, KitListQuery, AddKitPart } from './kits.schemas.js';

export class KitsService {
  constructor(private readonly repo: KitsRepository) {}

  list(opts: KitListQuery) { return this.repo.list(opts); }
  async get(id: string) {
    const k = await this.repo.getById(id);
    if (!k) throw new AppError(404, 'Kit not found');
    return k;
  }
  create(input: KitCreate) { return this.repo.create(input); }
  update(id: string, patch: KitUpdate) { return this.repo.update(id, patch); }
  remove(id: string) { return this.repo.remove(id); }

  addPart(kitId: string, part: AddKitPart) { return this.repo.addPart(kitId, part); }
  removePart(kitId: string, repuestoId: string) { return this.repo.removePart(kitId, repuestoId); }
}
