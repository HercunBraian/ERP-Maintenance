import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, mapPgError } from '../../lib/errors.js';
import type { UserCreate, UserUpdate, UserListQuery } from './users.schemas.js';

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'technician';
  avatar: string | null;
  phone: string | null;
  dept: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT = 'id, email, full_name, role, avatar, phone, dept, created_at, updated_at';

export class UsersRepository {
  constructor(
    /** Per-request user-scoped client. RLS applies. Used for read/update where the
     *  caller's identity matters (e.g. self-update). */
    private readonly db: SupabaseClient,
    /** Service-role client. Bypasses RLS. Used for admin operations on auth.users
     *  (createUser, deleteUser, updateUserById) which the user-scoped client can't
     *  perform regardless of role. */
    private readonly admin: SupabaseClient,
  ) {}

  async list(opts: UserListQuery) {
    let q = this.db.from('users').select(SELECT, { count: 'exact' }).order('full_name');
    if (opts.role) q = q.eq('role', opts.role);
    if (opts.search) {
      const term = opts.search.replace(/[%,]/g, '');
      q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,dept.ilike.%${term}%`);
    }
    const { data, error, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
    if (error) throw mapPgError(error);
    return { rows: (data ?? []) as AppUser[], total: count ?? 0 };
  }

  async getById(id: string): Promise<AppUser | null> {
    const { data, error } = await this.db.from('users').select(SELECT).eq('id', id).maybeSingle();
    if (error) throw mapPgError(error);
    return (data as AppUser) ?? null;
  }

  /**
   * Create an auth user, then update the public.users row that the
   * `handle_new_auth_user` trigger inserts (which defaults role to 'technician').
   * Uses the admin client throughout — caller must already be authorized.
   */
  async create(input: UserCreate): Promise<AppUser> {
    // 1. Auth user
    const { data, error } = await this.admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.full_name },
    });
    if (error || !data.user) {
      const msg = (error?.message ?? '').toLowerCase();
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
        throw new AppError(409, 'Email ya está registrado', 'DuplicateEmail');
      }
      throw new AppError(500, error?.message ?? 'Auth createUser failed', 'AuthError');
    }
    const userId = data.user.id;

    // 2. Patch the public.users row with any non-default fields. The trigger has
    //    already inserted the row with role='technician' and basic data.
    const patch: Record<string, unknown> = {};
    if (input.role && input.role !== 'technician') patch.role = input.role;
    if (input.full_name) patch.full_name = input.full_name; // overrides trigger-inferred name
    if (input.dept) patch.dept = input.dept;
    if (input.phone) patch.phone = input.phone;
    if (input.avatar) patch.avatar = input.avatar.toUpperCase().slice(0, 2);

    if (Object.keys(patch).length > 0) {
      const { error: upErr } = await this.admin.from('users').update(patch).eq('id', userId);
      if (upErr) {
        // Rollback the auth user so we don't leave an orphan
        await this.admin.auth.admin.deleteUser(userId).catch(() => {});
        throw mapPgError(upErr);
      }
    }

    // 3. Return the final row (use admin client — fresh user might not yet pass RLS for the caller)
    const { data: row, error: getErr } = await this.admin.from('users').select(SELECT).eq('id', userId).single();
    if (getErr) throw mapPgError(getErr);
    return row as AppUser;
  }

  async update(id: string, patch: UserUpdate): Promise<AppUser> {
    const { data, error } = await this.db
      .from('users')
      .update(patch)
      .eq('id', id)
      .select(SELECT)
      .maybeSingle();
    if (error) throw mapPgError(error);
    if (!data) throw new AppError(404, 'Usuario no encontrado');
    return data as AppUser;
  }

  /** Admin-only: reset password without requiring the current one. */
  async resetPassword(id: string, password: string): Promise<void> {
    const { error } = await this.admin.auth.admin.updateUserById(id, { password });
    if (error) throw new AppError(500, error.message, 'AuthError');
  }

  /** Admin-only: hard-delete. Cascades through public.users (FK to auth.users) and
   *  SET-NULLs technician_id / uploaded_by / etc. on history rows. */
  async remove(id: string): Promise<void> {
    const { error } = await this.admin.auth.admin.deleteUser(id);
    if (error) throw new AppError(500, error.message, 'AuthError');
  }
}
