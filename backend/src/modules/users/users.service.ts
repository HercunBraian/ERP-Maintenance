import { AppError } from '../../lib/errors.js';
import type { UsersRepository, AppUser } from './users.repository.js';
import type { UserCreate, UserUpdate, UserListQuery } from './users.schemas.js';

export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  list(opts: UserListQuery) {
    return this.repo.list(opts);
  }

  async get(id: string): Promise<AppUser> {
    const u = await this.repo.getById(id);
    if (!u) throw new AppError(404, 'Usuario no encontrado');
    return u;
  }

  create(input: UserCreate) {
    return this.repo.create(input);
  }

  update(id: string, patch: UserUpdate) {
    return this.repo.update(id, patch);
  }

  /**
   * Admin can't delete or self-demote themselves (would lock everyone out
   * if they were the only admin). Caller passes the auth uid for comparison.
   */
  async safeRemove(targetId: string, callerId: string) {
    if (targetId === callerId) {
      throw new AppError(409, 'No podés eliminarte a vos mismo', 'SelfDeleteBlocked');
    }
    return this.repo.remove(targetId);
  }

  resetPassword(id: string, password: string) {
    return this.repo.resetPassword(id, password);
  }
}
