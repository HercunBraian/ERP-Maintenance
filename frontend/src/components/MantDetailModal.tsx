import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play, Check, Ban, Plus, Trash2, Loader2, Wrench, Package, Calendar, User, AlertTriangle,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { MantenimientoDetail } from '../lib/types';
import { Modal } from './Modal';
import { StatusBadge, MantTipoBadge } from './badges';
import { AddPartModal } from './AddPartModal';

interface Props {
  open: boolean;
  onClose: () => void;
  mantId: string | null;
}

export function MantDetailModal({ open, onClose, mantId }: Props) {
  const qc = useQueryClient();
  const detail = useQuery({
    queryKey: ['mantenimiento', mantId],
    queryFn: () => api.mantenimientos.get(mantId!),
    enabled: open && !!mantId,
  });
  const m = detail.data;

  const [addingPart, setAddingPart] = useState(false);
  const [partError, setPartError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['mantenimiento', mantId] });
    qc.invalidateQueries({ queryKey: ['mantenimientos'] });
    qc.invalidateQueries({ queryKey: ['stock'] });
    qc.invalidateQueries({ queryKey: ['equipos'] });
    qc.invalidateQueries({ queryKey: ['equipo-full'] });
  }, [qc, mantId]);

  const startM = useMutation({
    mutationFn: () => api.mantenimientos.start(mantId!),
    onSuccess: invalidate,
    onError: (e) => setActionError(e instanceof ApiError ? e.message : 'Error'),
  });
  const completeM = useMutation({
    mutationFn: () => api.mantenimientos.complete(mantId!),
    onSuccess: invalidate,
    onError: (e) => setActionError(e instanceof ApiError ? e.message : 'Error'),
  });
  const cancelM = useMutation({
    mutationFn: () => api.mantenimientos.cancel(mantId!),
    onSuccess: invalidate,
    onError: (e) => setActionError(e instanceof ApiError ? e.message : 'Error'),
  });
  const addPartM = useMutation({
    mutationFn: (data: { repuesto_id: string; qty: number; deposito_id: string }) =>
      api.mantenimientos.addPart(mantId!, data),
    onSuccess: () => { invalidate(); setAddingPart(false); setPartError(null); },
    onError: (e) => setPartError(e instanceof ApiError ? e.message : 'Error'),
  });
  const removePartM = useMutation({
    mutationFn: (partId: string) => api.mantenimientos.removePart(mantId!, partId),
    onSuccess: invalidate,
  });

  return (
    <Modal open={open} onClose={onClose} title={m ? `OT ${m.code}` : 'Mantenimiento'} maxWidth={620}>
      {!m && detail.isLoading && (
        <div className="py-8 flex justify-center text-fg-subtle">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {m && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <MantTipoBadge tipo={m.tipo} />
              <StatusBadge status={m.status} />
            </div>
            <ActionBar
              status={m.status}
              busy={startM.isPending || completeM.isPending || cancelM.isPending}
              onStart={() => { setActionError(null); startM.mutate(); }}
              onComplete={() => { setActionError(null); completeM.mutate(); }}
              onCancel={() => { setActionError(null); cancelM.mutate(); }}
            />
          </div>

          {actionError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
              <AlertTriangle size={14} /> {actionError}
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            <Meta icon={Wrench} label="Equipo" value={`${m.equipo.serial} · ${m.equipo.model}`} />
            <Meta icon={Calendar} label="Fecha programada" value={m.scheduled_date} />
            <Meta icon={User} label="Técnico" value={m.technician_id ? '—' : 'Sin asignar'} />
            <Meta
              icon={Calendar}
              label="Duración"
              value={m.duration_min ? `${m.duration_min} min` : (m.started_at ? 'En curso' : '—')}
            />
            {m.kit && <Meta icon={Package} label="Kit" value={m.kit.name} />}
          </div>

          {m.notes && (
            <div className="bg-input-bg border border-border rounded-lg p-3 text-sm text-fg-muted">
              {m.notes}
            </div>
          )}

          {/* Parts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-fg">Repuestos consumidos ({m.parts.length})</h3>
              {m.status === 'in_progress' && (
                <button
                  onClick={() => { setPartError(null); setAddingPart(true); }}
                  className="flex items-center gap-1 text-primary text-xs font-semibold hover:opacity-80"
                >
                  <Plus size={13} /> Agregar
                </button>
              )}
            </div>
            {m.parts.length === 0 ? (
              <div className="text-center text-fg-subtle text-sm py-4 bg-input-bg rounded-lg border border-border">
                Sin repuestos cargados todavía
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {m.parts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Package size={14} className="text-fg-subtle flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-fg truncate">{p.repuesto.name}</div>
                      <div className="text-[11px] text-fg-subtle truncate">
                        {p.repuesto.code} · {p.deposito?.name ?? '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-fg">×{p.qty}</div>
                      <div className="text-[10px] text-fg-subtle">
                        ${(p.qty * p.repuesto.price).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Quitar este repuesto del registro? El stock NO se restituye automáticamente.')) {
                          removePartM.mutate(p.id);
                        }
                      }}
                      className="text-fg-subtle hover:text-red-500 p-1 transition-colors"
                      title="Quitar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AddPartModal
        open={addingPart}
        onClose={() => setAddingPart(false)}
        onSubmit={(data) => addPartM.mutateAsync(data)}
        busy={addPartM.isPending}
        error={partError}
      />
    </Modal>
  );
}

function ActionBar({
  status, onStart, onComplete, onCancel, busy,
}: {
  status: MantenimientoDetail['status'];
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {(status === 'scheduled' || status === 'overdue') && (
        <ActionBtn icon={Play} label="Iniciar" color="#2563eb" onClick={onStart} busy={busy} />
      )}
      {status === 'in_progress' && (
        <ActionBtn icon={Check} label="Completar" color="#059669" onClick={onComplete} busy={busy} />
      )}
      {status !== 'completed' && status !== 'cancelled' && (
        <ActionBtn icon={Ban} label="Cancelar" color="#ef4444" onClick={onCancel} busy={busy} variant="ghost" />
      )}
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, color, onClick, busy, variant,
}: {
  icon: typeof Play; label: string; color: string; onClick: () => void; busy: boolean;
  variant?: 'ghost';
}) {
  const base = variant === 'ghost'
    ? 'bg-bg border border-border text-fg-muted hover:bg-hover-bg'
    : 'text-white border';
  const style = variant === 'ghost' ? undefined : { background: color, borderColor: color };
  return (
    <button
      disabled={busy}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${base} ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
      style={style}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Wrench; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1 flex items-center gap-1">
        <Icon size={11} /> {label}
      </div>
      <div className="text-[13px] text-fg font-medium">{value}</div>
    </div>
  );
}
