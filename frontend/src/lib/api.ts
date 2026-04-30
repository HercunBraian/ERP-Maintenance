import { env } from '../env';
import { supabase } from './supabase';
import type {
  ApiList,
  Cliente,
  ClienteCreateInput,
  ClienteUpdateInput,
  Equipo,
  EquipoCreateInput,
  EquipoUpdateInput,
  EquipoFull,
  Mantenimiento,
  MantenimientoDetail,
  MantCreateInput,
  MantUpdateInput,
  AddPartInput,
  Alerta,
  StockRow,
  AdjustStockInput,
  Repuesto,
  RepuestoCreateInput,
  Deposito,
  Kit,
  KitDetail,
  KitCreateInput,
  AddKitPartInput,
  TrazabilidadEquipo,
  TrazabilidadCliente,
  AppUser,
  UserCreateInput,
  UserUpdateInput,
} from './types';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(env.API_URL.replace(/\/$/, '') + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  opts: { query?: Query; body?: unknown } = {},
): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
  };
  const res = await fetch(url, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const errCode = (parsed && typeof parsed === 'object' && 'error' in parsed && typeof parsed.error === 'string') ? parsed.error : 'HttpError';
    const errMsg = (parsed && typeof parsed === 'object' && 'message' in parsed && typeof parsed.message === 'string') ? parsed.message : `HTTP ${res.status}`;
    throw new ApiError(res.status, errCode, errMsg, parsed);
  }
  return parsed as T;
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}

const http = {
  get:    <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post:   <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch:  <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// ─── Typed module APIs ────────────────────────────────────────────────────────

export const api = {
  health: () => http.get<{ ok: boolean; ts: string }>('/health'),

  users: {
    list:    (q?: Query) => http.get<ApiList<AppUser>>('/users', q),
    get:     (id: string) => http.get<AppUser>(`/users/${id}`),
    create:  (body: UserCreateInput) => http.post<AppUser>('/users', body),
    update:  (id: string, body: UserUpdateInput) => http.patch<AppUser>(`/users/${id}`, body),
    remove:  (id: string) => http.delete<void>(`/users/${id}`),
    resetPassword: (id: string, password: string) =>
      http.post<void>(`/users/${id}/reset-password`, { password }),
  },

  clientes: {
    list:   (q?: Query) => http.get<ApiList<Cliente>>('/clientes', q),
    get:    (id: string) => http.get<Cliente>(`/clientes/${id}`),
    create: (body: ClienteCreateInput) => http.post<Cliente>('/clientes', body),
    update: (id: string, body: ClienteUpdateInput) => http.patch<Cliente>(`/clientes/${id}`, body),
    remove: (id: string) => http.delete<void>(`/clientes/${id}`),
  },

  equipos: {
    list:   (q?: Query) => http.get<ApiList<Equipo>>('/equipos', q),
    get:    (id: string) => http.get<Equipo>(`/equipos/${id}`),
    full:   (id: string) => http.get<EquipoFull>(`/equipos/${id}/full`),
    create: (body: EquipoCreateInput) => http.post<Equipo>('/equipos', body),
    update: (id: string, body: EquipoUpdateInput) => http.patch<Equipo>(`/equipos/${id}`, body),
    remove: (id: string) => http.delete<void>(`/equipos/${id}`),
    qrUrl:  (id: string, format: 'png' | 'svg' = 'png', size = 400) =>
            buildUrl(`/equipos/${id}/qr`, { format, size }),
    /** Fetch QR as a Blob (auth-attached) so it can be rendered via ObjectURL. */
    qrBlob: async (id: string, format: 'png' | 'svg' = 'png', size = 400): Promise<Blob> => {
      const url = buildUrl(`/equipos/${id}/qr`, { format, size });
      const res = await fetch(url, { headers: await authHeader() });
      if (!res.ok) {
        throw new ApiError(res.status, 'QRError', `QR fetch failed: HTTP ${res.status}`);
      }
      return res.blob();
    },
  },

  mantenimientos: {
    list:     (q?: Query) => http.get<ApiList<Mantenimiento>>('/mantenimientos', q),
    get:      (id: string) => http.get<MantenimientoDetail>(`/mantenimientos/${id}`),
    create:   (body: MantCreateInput) => http.post<Mantenimiento>('/mantenimientos', body),
    update:   (id: string, body: MantUpdateInput) => http.patch<Mantenimiento>(`/mantenimientos/${id}`, body),
    remove:   (id: string) => http.delete<void>(`/mantenimientos/${id}`),
    start:    (id: string) => http.post<Mantenimiento>(`/mantenimientos/${id}/start`),
    complete: (id: string) => http.post<Mantenimiento>(`/mantenimientos/${id}/complete`),
    cancel:   (id: string) => http.post<Mantenimiento>(`/mantenimientos/${id}/cancel`),
    addPart:  (id: string, body: AddPartInput) => http.post<{ id: string }>(`/mantenimientos/${id}/parts`, body),
    removePart:(id: string, partId: string) => http.delete<void>(`/mantenimientos/${id}/parts/${partId}`),
  },

  alertas: {
    list:   (q?: Query) => http.get<ApiList<Alerta>>('/alertas', q),
    resolve:(id: string) => http.post(`/alertas/${id}/resolve`),
  },

  stock: {
    list:      (q?: Query) => http.get<ApiList<StockRow>>('/stock', q),
    adjust:    (body: AdjustStockInput) => http.post<{ stock: number }>('/stock/adjust', body),
    movements: (repuestoId: string) =>
               http.get<Array<{ id: string; tipo: string; qty: number; notes: string | null; created_at: string;
                                deposito: { id: string; code: string; name: string } }>>(`/stock/movements/${repuestoId}`),
  },

  repuestos: {
    list:   (q?: Query) => http.get<ApiList<Repuesto>>('/repuestos', q),
    get:    (id: string) => http.get<Repuesto>(`/repuestos/${id}`),
    create: (body: RepuestoCreateInput) => http.post<Repuesto>('/repuestos', body),
    update: (id: string, body: Partial<RepuestoCreateInput>) => http.patch<Repuesto>(`/repuestos/${id}`, body),
    remove: (id: string) => http.delete<void>(`/repuestos/${id}`),
  },

  // Depósitos: read-only listing for selectors. Backend doesn't expose CRUD
  // yet (admin-managed via SQL); we just need them in dropdowns.
  depositos: {
    list:   () =>
      // Reuse the stock endpoint to get distinct depositos via the join.
      // Cheapest path until we add /api/depositos.
      http.get<ApiList<StockRow>>('/stock', { limit: 500 }).then((r) => {
        const map = new Map<string, Deposito>();
        for (const row of r.rows) map.set(row.deposito.id, row.deposito);
        return Array.from(map.values());
      }),
  },

  kits: {
    list:   (q?: Query) => http.get<ApiList<Kit>>('/kits', q),
    get:    (id: string) => http.get<KitDetail>(`/kits/${id}`),
    create: (body: KitCreateInput) => http.post<Kit>('/kits', body),
    update: (id: string, body: Partial<KitCreateInput>) => http.patch<Kit>(`/kits/${id}`, body),
    remove: (id: string) => http.delete<void>(`/kits/${id}`),
    addPart:    (id: string, body: AddKitPartInput) => http.post<unknown>(`/kits/${id}/parts`, body),
    removePart: (id: string, repuestoId: string) => http.delete<void>(`/kits/${id}/parts/${repuestoId}`),
  },

  trazabilidad: {
    equipo:  (id: string) => http.get<TrazabilidadEquipo>(`/trazabilidad/equipo/${id}`),
    cliente: (id: string) => http.get<TrazabilidadCliente>(`/trazabilidad/cliente/${id}`),
  },

  scan: {
    public: (token: string) => http.get<{
      equipo_id: string; serial: string; model: string; brand: string;
      cliente_name: string; status: string;
      next_maintenance_date: string | null; scan_count: number;
    }>(`/scan/${token}`),
  },
};
