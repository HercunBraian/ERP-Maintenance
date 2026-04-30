import type { AlertasRepository } from './alertas.repository.js';
import type { AlertaListQuery } from './alertas.schemas.js';

export class AlertasService {
  constructor(private readonly repo: AlertasRepository) {}
  list(opts: AlertaListQuery, userId: string) { return this.repo.list(opts, userId); }
  resolve(id: string, userId: string) { return this.repo.resolve(id, userId); }
}
