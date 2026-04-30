import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Cpu } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { EquipoCreateInput, EquipmentStatus } from '../lib/types';
import { StatusBadge } from '../components/badges';
import { Modal } from '../components/Modal';
import { EquipoForm } from '../components/forms/EquipoForm';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../hooks/useRealtime';

type StatusFilter = 'all' | EquipmentStatus;

const STATUS_OPTS: StatusFilter[] = ['all', 'operational', 'alert', 'overdue', 'maintenance'];
const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'Todos', operational: 'Operativos', alert: 'Alerta', overdue: 'Vencidos',
  maintenance: 'En mant.', inactive: 'Inactivos',
};

export function Equipos() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState<StatusFilter>('all');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const equipos = useQuery({
    queryKey: ['equipos', { search, statusF }],
    queryFn: () => api.equipos.list({
      search: search || undefined,
      status: statusF === 'all' ? undefined : statusF,
      limit: 200,
    }),
  });

  useRealtime('rt-equipos-list', 'equipos', useCallback(() => qc.invalidateQueries({ queryKey: ['equipos'] }), [qc]));

  const createM = useMutation({
    mutationFn: (data: EquipoCreateInput) => api.equipos.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipos'] });
      setCreating(false);
      setCreateError(null);
    },
    onError: (err) => setCreateError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  return (
    <div className="px-7 pt-7 pb-10">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-card border border-border rounded-lg px-3.5 py-2">
          <Search size={15} className="text-fg-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar serie, modelo, marca, código..."
            className="bg-transparent text-fg text-sm outline-none w-full placeholder:text-fg-subtle"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusF(s)}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors ${
                statusF === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-fg-muted border-border hover:bg-hover-bg'
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={() => { setCreateError(null); setCreating(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Nuevo equipo
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-input-bg border-b border-border">
                <Th>Serie</Th>
                <Th>Modelo / Marca</Th>
                <Th>Cliente</Th>
                <Th>Tipo</Th>
                <Th>Estado</Th>
                <Th>Próx. mant.</Th>
              </tr>
            </thead>
            <tbody>
              {(equipos.data?.rows ?? []).map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border last:border-b-0 hover:bg-hover-bg transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link to={`/equipos/${e.id}`} className="flex items-center gap-2 group">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Cpu size={14} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-fg group-hover:text-primary">
                          {e.serial}
                        </div>
                        <div className="text-[11px] text-fg-subtle">{e.code}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-semibold text-fg">{e.model}</div>
                    <div className="text-[11px] text-fg-subtle">{e.brand}</div>
                  </td>
                  <td className="px-4 py-3">
                    {e.cliente ? (
                      <Link to={`/clientes/${e.cliente.id}`} className="text-[13px] text-primary hover:underline">
                        {e.cliente.name}
                      </Link>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-fg-muted">{e.type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} small />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-fg-muted">
                    {e.next_maintenance_date ?? '—'}
                  </td>
                </tr>
              ))}
              {(equipos.data?.rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-fg-subtle text-sm">
                    No hay equipos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo equipo"
        maxWidth={620}
      >
        <EquipoForm
          onCancel={() => setCreating(false)}
          onSubmit={(data) => createM.mutateAsync(data)}
          busy={createM.isPending}
          error={createError}
        />
      </Modal>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-fg-subtle uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  );
}
