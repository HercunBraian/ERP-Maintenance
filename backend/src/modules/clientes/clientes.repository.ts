import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { AppError } from '../../lib/errors.js';
import type { ClienteCreate, ClienteUpdate, ClienteListQuery } from './clientes.schemas.js';

export interface Cliente {
  id: string;
  code: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  type: string;
  status: 'active' | 'inactive';
  since: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapPgError(error: PostgrestError): AppError {
  // PostgREST surfaces Postgres SQLSTATE codes via `code`.
  switch (error.code) {
    case '23505': return new AppError(409, 'Duplicate value', 'DuplicateKey', error.details);
    case '23503': return new AppError(409, 'Related records exist', 'ForeignKeyViolation', error.details);
    case '42501': return new AppError(403, 'Forbidden by RLS', 'RLSDenied');
    case 'PGRST116': return new AppError(404, 'Not found', 'NotFound');
    default: return new AppError(500, error.message, 'DBError', error.details);
  }
}

export class ClientesRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(opts: ClienteListQuery): Promise<{ rows: Cliente[]; total: number }> {
    let q = this.db
      .from('clientes')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    if (opts.status) q = q.eq('status', opts.status);
    if (opts.search) {
      const term = opts.search.replace(/[%,]/g, '');
      q = q.or(`name.ilike.%${term}%,contact_name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data, error, count } = await q.range(opts.offset, opts.offset + opts.limit - 1);
    if (error) throw mapPgError(error);
    return { rows: (data ?? []) as Cliente[], total: count ?? 0 };
  }

  async getById(id: string): Promise<Cliente | null> {
    const { data, error } = await this.db.from('clientes').select('*').eq('id', id).maybeSingle();
    if (error) throw mapPgError(error);
    return (data as Cliente) ?? null;
  }

  async create(input: ClienteCreate): Promise<Cliente> {
    const { data, error } = await this.db.from('clientes').insert(input).select().single();
    if (error) throw mapPgError(error);
    return data as Cliente;
  }

  async update(id: string, patch: ClienteUpdate): Promise<Cliente> {
    const { data, error } = await this.db
      .from('clientes')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw mapPgError(error);
    if (!data) throw new AppError(404, 'Cliente not found');
    return data as Cliente;
  }

  async remove(id: string): Promise<void> {
    const { error, count } = await this.db
      .from('clientes')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw mapPgError(error);
    if (count === 0) throw new AppError(404, 'Cliente not found');
  }
}
