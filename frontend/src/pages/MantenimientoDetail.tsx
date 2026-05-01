import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, ClipboardList, Download, Loader2, Package,
  Play, XCircle,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { StatusBadge, MantTipoBadge } from '../components/badges';
import { ChecklistExecution } from '../components/ChecklistExecution';
import { useAuth } from '../contexts/AuthContext';

export function MantenimientoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [pdfBusy, setPdfBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: mant, isLoading } = useQuery({
    queryKey: ['mantenimiento', id],
    queryFn:  () => api.mantenimientos.get(id!),
    enabled:  !!id,
  });

  const startM = useMutation({
    mutationFn: () => api.mantenimientos.start(id!),
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ['mantenimiento', id] });
      qc.invalidateQueries({ queryKey: ['mantenimientos'] });
    },
    onError: (e) => setActionError(e instanceof ApiError ? e.message : 'Error'),
  });

  const completeM = useMutation({
    mutationFn: () => api.mantenimientos.complete(id!),
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ['mantenimiento', id] });
      qc.invalidateQueries({ queryKey: ['mantenimientos'] });
    },
    onError: (e) => setActionError(e instanceof ApiError ? e.message : 'Error'),
  });

  const cancelM = useMutation({
    mutationFn: () => api.mantenimientos.cancel(id!),
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ['mantenimiento', id] });
      qc.invalidateQueries({ queryKey: ['mantenimientos'] });
    },
    onError: (e) => setActionError(e instanceof ApiError ? e.message : 'Error'),
  });

  const handlePdf = async () => {
    setPdfBusy(true);
    try { await api.checklists.downloadPdf(id!); }
    catch { /* silently ignore */ }
    finally { setPdfBusy(false); }
  };

  if (isLoading) return <Centered><Loader2 size={20} className="animate-spin text-fg-subtle" /></Centered>;
  if (!mant) return <Centered>Mantenimiento no encontrado</Centered>;

  const isPreventive = mant.tipo === 'preventive-6m' || mant.tipo === 'preventive-12m';
  const actionBusy   = startM.isPending || completeM.isPending || cancelM.isPending;

  return (
    <div className="px-7 pt-7 pb-10 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/mantenimientos')}
        className="flex items-center gap-1 text-primary text-sm font-semibold mb-5 hover:opacity-80"
      >
        <ChevronLeft size={16} /> Volver a Mantenimientos
      </button>

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-card">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <MantTipoBadge tipo={mant.tipo} />
              <StatusBadge status={mant.status} />
              <span className="text-xs text-fg-subtle">#{mant.code}</span>
            </div>
            <div className="text-xl font-extrabold text-fg">
              {mant.equipo?.model} — {mant.equipo?.serial}
            </div>
            <div className="text-sm text-fg-muted mt-0.5">
              Cliente: <span className="font-semibold">{mant.cliente?.name ?? '—'}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {mant.status === 'scheduled' || mant.status === 'overdue' ? (
              <ActionBtn
                label="Iniciar"
                icon={Play}
                color="blue"
                busy={startM.isPending}
                disabled={actionBusy}
                onClick={() => startM.mutate()}
              />
            ) : null}
            {mant.status === 'in_progress' ? (
              <ActionBtn
                label="Completar"
                icon={Play}
                color="green"
                busy={completeM.isPending}
                disabled={actionBusy}
                onClick={() => {
                  if (window.confirm('¿Marcar este mantenimiento como completado?')) completeM.mutate();
                }}
              />
            ) : null}
            {mant.status !== 'completed' && mant.status !== 'cancelled' && isAdmin ? (
              <ActionBtn
                label="Cancelar"
                icon={XCircle}
                color="red"
                busy={cancelM.isPending}
                disabled={actionBusy}
                onClick={() => {
                  if (window.confirm('¿Cancelar este mantenimiento?')) cancelM.mutate();
                }}
              />
            ) : null}
            <button
              onClick={handlePdf}
              disabled={pdfBusy}
              className="flex items-center gap-1.5 px-3 py-2 bg-bg border border-border text-fg-muted rounded-lg text-sm font-semibold hover:bg-hover-bg disabled:opacity-50"
            >
              {pdfBusy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              PDF
            </button>
          </div>
        </div>

        {actionError && (
          <div className="mt-3 text-sm text-red-500">{actionError}</div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
          <Field label="Fecha programada" value={mant.scheduled_date} />
          <Field label="Técnico"          value={mant.technician?.full_name ?? '—'} />
          <Field label="Inicio"           value={mant.started_at ? new Date(mant.started_at).toLocaleDateString('es-AR') : '—'} />
          <Field label="Fin"              value={mant.completed_at ? new Date(mant.completed_at).toLocaleDateString('es-AR') : '—'} />
          {mant.duration_min && (
            <Field label="Duración" value={`${mant.duration_min} min`} />
          )}
          {mant.notes && (
            <div className="col-span-2 md:col-span-4">
              <Field label="Observaciones" value={mant.notes} />
            </div>
          )}
        </div>
      </div>

      {/* Checklist section */}
      {isPreventive && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card mb-5">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <ClipboardList size={16} className="text-primary" />
            <span className="text-sm font-bold text-fg">Checklist preventivo</span>
          </div>
          <div className="px-6 py-5">
            {mant.checklist ? (
              <ChecklistExecution
                checklistId={mant.checklist.id}
                readonly={mant.status === 'completed' || mant.status === 'cancelled'}
              />
            ) : (
              <p className="text-sm text-fg-subtle">
                No hay checklist asignado a este equipo. Asigná una plantilla desde el detalle del equipo.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Parts section */}
      {mant.parts && mant.parts.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Package size={16} className="text-primary" />
            <span className="text-sm font-bold text-fg">Repuestos usados ({mant.parts.length})</span>
          </div>
          <div className="divide-y divide-border">
            {mant.parts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <div className="text-sm font-semibold text-fg">{p.repuesto.name}</div>
                  <div className="text-xs text-fg-subtle">{p.deposito?.name ?? 'Sin depósito'}</div>
                </div>
                <div className="text-sm font-bold text-fg">×{p.qty}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[13px] text-fg font-medium">{value}</div>
    </div>
  );
}

function ActionBtn({
  label, icon: Icon, color, busy, disabled, onClick,
}: {
  label: string;
  icon: typeof Play;
  color: 'blue' | 'green' | 'red';
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const colorClass =
    color === 'blue'  ? 'bg-blue-600 hover:bg-blue-700 text-white' :
    color === 'green' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                        'bg-red-500 hover:bg-red-600 text-white';
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50 ${colorClass}`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {label}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex items-center justify-center text-fg-subtle">
      {children}
    </div>
  );
}
