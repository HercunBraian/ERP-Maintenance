import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter as FilterIcon } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { MantCreateInput, MantStatus } from '../lib/types';
import { StatusBadge, MantTipoBadge } from '../components/badges';
import { Modal } from '../components/Modal';
import { MantenimientoForm } from '../components/forms/MantenimientoForm';
import { MantDetailModal } from '../components/MantDetailModal';
import { useRealtime } from '../hooks/useRealtime';

const STATUS_OPTS: Array<'all' | MantStatus> = [
  'all', 'scheduled', 'in_progress', 'completed', 'overdue', 'cancelled',
];
const STATUS_LABEL: Record<string, string> = {
  all: 'Todos', scheduled: 'Programados', in_progress: 'En curso',
  completed: 'Completados', overdue: 'Vencidos', cancelled: 'Cancelados',
};

export function Mantenimientos() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const initialOpenNew = params.get('new') === '1';
  const initialStatus = (params.get('status') as MantStatus | null);
  const [creating, setCreating] = useState(initialOpenNew);
  const [createError, setCreateError] = useState<string | null>(null);
  const [statusF, setStatusF] = useState<'all' | MantStatus>(
    initialStatus && STATUS_OPTS.includes(initialStatus) ? initialStatus : 'all',
  );
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['mantenimientos', { statusF }],
    queryFn: () => api.mantenimientos.list({
      status: statusF === 'all' ? undefined : statusF,
      limit: 200,
    }),
  });

  useRealtime('rt-mants-list', 'mantenimientos',
    useCallback(() => qc.invalidateQueries({ queryKey: ['mantenimientos'] }), [qc]));

  const createM = useMutation({
    mutationFn: (data: MantCreateInput) => api.mantenimientos.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mantenimientos'] });
      setCreating(false);
      setCreateError(null);
      // Drop the ?new=1 from the URL once the modal is dismissed
      if (params.get('new')) { params.delete('new'); setParams(params, { replace: true }); }
    },
    onError: (err) => setCreateError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  return (
    <div className="px-7 pt-7 pb-10">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FilterIcon size={16} className="text-fg-subtle" />
        <div className="flex gap-1.5 flex-wrap flex-1">
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
        <span className="text-sm text-fg-subtle whitespace-nowrap">
          {list.data?.total ?? 0} OT
        </span>
        <button
          onClick={() => { setCreateError(null); setCreating(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> Nuevo
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-input-bg border-b border-border">
                <Th>Código</Th>
                <Th>Tipo</Th>
                <Th>Equipo</Th>
                <Th>Cliente</Th>
                <Th>Fecha</Th>
                <Th>Estado</Th>
                <Th>Duración</Th>
              </tr>
            </thead>
            <tbody>
              {(list.data?.rows ?? []).map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setOpenDetail(m.id)}
                  className="border-b border-border last:border-b-0 hover:bg-hover-bg cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-[13px] font-bold text-fg">{m.code}</td>
                  <td className="px-4 py-3"><MantTipoBadge tipo={m.tipo} /></td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => { e.stopPropagation(); if (m.equipo_id) navigate(`/equipos/${m.equipo_id}`); }}
                  >
                    <div className="text-[13px] font-semibold text-fg hover:text-primary">{m.equipo?.model ?? '—'}</div>
                    <div className="text-[11px] text-fg-subtle">{m.equipo?.serial ?? ''}</div>
                  </td>
                  <td
                    className="px-4 py-3 text-[13px]"
                    onClick={(e) => { e.stopPropagation(); if (m.cliente_id) navigate(`/clientes/${m.cliente_id}`); }}
                  >
                    <span className="text-primary hover:underline">{m.cliente?.name ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-fg-muted">{m.scheduled_date}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} small /></td>
                  <td className="px-4 py-3 text-[13px] text-fg-muted">
                    {m.duration_min ? `${m.duration_min} min` : '—'}
                  </td>
                </tr>
              ))}
              {(list.data?.rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-fg-subtle text-sm">
                    No hay mantenimientos con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={creating}
        onClose={() => {
          setCreating(false);
          if (params.get('new')) { params.delete('new'); setParams(params, { replace: true }); }
        }}
        title="Nuevo mantenimiento"
        maxWidth={620}
      >
        <MantenimientoForm
          onCancel={() => setCreating(false)}
          onSubmit={(data) => createM.mutateAsync(data)}
          busy={createM.isPending}
          error={createError}
        />
      </Modal>

      <MantDetailModal
        open={!!openDetail}
        onClose={() => setOpenDetail(null)}
        mantId={openDetail}
      />
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
