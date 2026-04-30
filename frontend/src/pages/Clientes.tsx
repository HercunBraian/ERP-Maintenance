import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Building2, User, Mail } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { ClienteCreateInput } from '../lib/types';
import { StatusBadge } from '../components/badges';
import { Modal } from '../components/Modal';
import { ClienteForm } from '../components/forms/ClienteForm';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../hooks/useRealtime';

type Filter = 'all' | 'active' | 'inactive';

function normalizeClientes(res: any) {
  // 🔥 soporta distintos formatos del backend
  return (
    res?.rows ??
    res?.clientes?.rows ??
    res?.data?.rows ??
    res?.clientes?.data?.rows ??
    []
  );
}

function normalizeClientesTotal(res: any) {
  return (
    res?.total ??
    res?.clientes?.total ??
    res?.data?.total ??
    res?.clientes?.data?.total ??
    0
  );
}

export function Clientes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const clientes = useQuery({
    queryKey: ['clientes', { search, filter }],
    queryFn: async () => {
      const res = await api.clientes.list({
        search: search || undefined,
        status: filter === 'all' ? undefined : filter,
        limit: 200,
      });

      return res;
    },
  });

  const equipos = useQuery({
    queryKey: ['equipos', 'all-for-clientes-page'],
    queryFn: async () => {
      const res = await api.equipos.list({ limit: 200 });

      return res;
    },
    staleTime: 30_000,
  });

  useRealtime(
    'rt-clientes',
    'clientes',
    useCallback(() => qc.invalidateQueries({ queryKey: ['clientes'] }), [qc])
  );

  useRealtime(
    'rt-clientes-equipos',
    'equipos',
    useCallback(() => qc.invalidateQueries({ queryKey: ['equipos'] }), [qc])
  );

  const createM = useMutation({
    mutationFn: (data: ClienteCreateInput) => api.clientes.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      setCreating(false);
      setCreateError(null);
    },
    onError: (err) => {
      setCreateError(err instanceof ApiError ? err.message : 'Error inesperado');
    },
  });

  const equipoMap = useMemo(() => {
    const map = new Map<string, { total: number; op: number; overdue: number }>();

    for (const e of equipos.data?.rows ?? []) {
      const cur = map.get(e.cliente_id) ?? { total: 0, op: 0, overdue: 0 };
      cur.total++;
      if (e.status === 'operational') cur.op++;
      if (e.status === 'overdue') cur.overdue++;
      map.set(e.cliente_id, cur);
    }

    return map;
  }, [equipos.data]);

  const rows = useMemo(() => normalizeClientes(clientes.data), [clientes.data]);
  const total = useMemo(() => normalizeClientesTotal(clientes.data), [clientes.data]);

  return (
    <div className="px-7 pt-7 pb-10">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-card border border-border rounded-lg px-3.5 py-2">
          <Search size={15} className="text-fg-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, contacto, email..."
            className="bg-transparent text-fg text-sm outline-none w-full placeholder:text-fg-subtle"
          />
        </div>

        {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              filter === f
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-fg-muted border-border hover:bg-hover-bg'
            }`}
          >
            {{ all: 'Todos', active: 'Activos', inactive: 'Inactivos' }[f]}
          </button>
        ))}

        <span className="text-sm text-fg-subtle whitespace-nowrap">
          {total} cliente{total === 1 ? '' : 's'}
        </span>

        {isAdmin && (
          <button
            onClick={() => { setCreateError(null); setCreating(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Nuevo cliente
          </button>
        )}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {rows.map((c: any) => {
          const eqs = equipoMap.get(c.id) ?? { total: 0, op: 0, overdue: 0 };

          return (
            <Link
              key={c.id}
              to={`/clientes/${c.id}`}
              className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-[42px] h-[42px] rounded-[10px] bg-primary/15 flex items-center justify-center">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-fg mb-0.5">{c.name}</div>
                    <StatusBadge status={c.status} small />
                  </div>
                </div>

                {eqs.overdue > 0 && (
                  <span className="bg-badge-red-bg text-badge-red-fg rounded-full text-[11px] font-bold px-2 py-0.5">
                    {eqs.overdue} vencido{eqs.overdue > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="text-xs text-fg-subtle mb-1 truncate">
                <User size={12} className="inline align-middle mr-1.5" />
                {c.contact_name ?? '—'}
              </div>

              <div className="text-xs text-fg-subtle mb-3 truncate">
                <Mail size={12} className="inline align-middle mr-1.5" />
                {c.email ?? '—'}
              </div>

              <div className="flex gap-4 pt-3 border-t border-border">
                <Stat value={eqs.total} label="Equipos" />
                <Stat value={eqs.op} color="#059669" label="Operativos" highlight={eqs.op > 0} />
                <Stat value={eqs.overdue} color="#ef4444" label="Vencidos" highlight={eqs.overdue > 0} />
              </div>
            </Link>
          );
        })}

        {clientes.isFetched && rows.length === 0 && (
          <div className="col-span-full text-center text-fg-subtle py-12">
            No hay clientes que coincidan con los filtros.
          </div>
        )}
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo cliente"
        maxWidth={560}
      >
        <ClienteForm
          onCancel={() => setCreating(false)}
          onSubmit={(data) => createM.mutateAsync(data)}
          busy={createM.isPending}
          error={createError}
        />
      </Modal>
    </div>
  );
}

function Stat({ value, label, color, highlight }: { value: number; label: string; color?: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-lg font-extrabold" style={{ color: highlight && color ? color : undefined }}>
        {value}
      </div>
      <div className="text-[11px] text-fg-subtle">{label}</div>
    </div>
  );
}