import { AppError } from '../../lib/errors.js';
import type { ClientesRepository, Cliente } from './clientes.repository.js';
import type { ClienteCreate, ClienteUpdate, ClienteListQuery } from './clientes.schemas.js';

export class ClientesService {
  constructor(private readonly repo: ClientesRepository) {}

  list(opts: ClienteListQuery) {
    return this.repo.list(opts);
  }

  async get(id: string): Promise<Cliente> {
    const c = await this.repo.getById(id);
    if (!c) throw new AppError(404, 'Cliente not found');
    return c;
  }

  create(input: ClienteCreate) {
    return this.repo.create(input);
  }

  update(id: string, patch: ClienteUpdate) {
    return this.repo.update(id, patch);
  }

  remove(id: string) {
    return this.repo.remove(id);
  }
}
