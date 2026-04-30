import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Cpu, Edit2, Trash2, QrCode, Wrench, Package, AlertTriangle,
  CheckCircle, Clock, Loader2, MapPin, Calendar,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { EquipoUpdateInput } from '../lib/types';
import { StatusBadge, MantTipoBadge } from '../components/badges';
import { Modal } from '../components/Modal';
import { QRModal } from '../components/QRModal';
import { EquipoForm } from '../components/forms/EquipoForm';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../hooks/useRealtime';

export function EquipoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const fullQ = useQuery({
    queryKey: ['equipo-full', id],
    queryFn: () => api.equipos.full(id!),
    enabled: !!id,
  });

  const equipoQ = useQuery({
    queryKey: ['equipo', id],
    queryFn: () => api.equipos.get(id!),
    enabled: !!id,
  });

  useRealtime('rt-equipo-detail', 'mantenimientos', useCallback(() => {
    qc.invalidateQueries({ queryKey: ['equipo-full', id] });
  }, [qc, id]));

  const updateM = useMutation({
    mutationFn: (data: EquipoUpdateInput) => api.equipos.update(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipo-full', id] });
      qc.invalidateQueries({ queryKey: ['equipo', id] });
      qc.invalidateQueries({ queryKey: ['equipos'] });
      setEditing(false);
      setEditError(null);
    },
    onError: (err) => setEditError(err instanceof ApiError ? err.message : 'Error inesperado'),
  });

  const deleteM = useMutation({
    mutationFn: () => api.equipos.remove(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipos'] });
      navigate('/equipos');
    },
  });

  if (fullQ.isLoading) return <Centered>Cargando…</Centered>;
  if (!fullQ.data) return <Centered>Equipo no encontrado</Centered>;

  const { equipo, mantenimientos, alertas, parts_aggregated, metrics } = fullQ.data;

  return (
    <div className="px-7 pt-7 pb-10">
      <button
        onClick={() => navigate('/equipos')}
        className="flex items-center gap-1 text-primary text-sm font-semibold mb-5 hover:opacity-80"
      >
        <ChevronLeft size={16} /> Volver a Equipos
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-card">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-[14px] bg-primary/15 flex items-center justify-center">
              <Cpu size={26} className="text-primary" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-fg mb-1">{equipo.model}</div>
              <div className="flex flex-wrap gap-2 items-center">
                <StatusBadge status={equipo.status} />
                <span className="text-xs text-fg-subtle">{equipo.brand} · {equipo.type}</span>
                <code className="text-xs text-fg-muted font-mono">{equipo.serial}</code>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-bg border border-border text-fg-muted rounded-lg text-sm font-semibold hover:bg-hover-bg"
            >
              <QrCode size={14} /> QR
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => { setEditError(null); setEditing(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-bg border border-border text-fg-muted rounded-lg text-sm font-semibold hover:bg-hover-bg"
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('¿Eliminar este equipo? Solo se puede borrar si no tiene mantenimientos.')) {
                      deleteM.mutate();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-bg border border-border text-red-500 rounded-lg text-sm font-semibold hover:bg-hover-bg"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
          <Field label="Cliente" value={
            <Link to={`/clientes/${equipo.cliente.id}`} className="text-primary hover:underline font-semibold">
              {equipo.cliente.name}
            </Link>
          } />
          <Field label="Ubicación" icon={MapPin}  value={equipo.location ?? '—'} />
          <Field label="Instalado"  icon={Calendar} value={equipo.install_date ?? '—'} />
          <Field label="Próx. mant." icon={Calendar} value={equipo.next_maintenance_date ?? '—'} />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Metric icon={Wrench}        color="#2563eb" value={metrics.total}        label="Mantenimientos" />
        <Metric icon={CheckCircle}   color="#059669" value={metrics.completed}    label="Completados" />
        <Metric icon={Loader2}       color="#f59e0b" value={metrics.in_progress}  label="En curso" />
        <Metric icon={Clock}         color="#ef4444" value={metrics.overdue}      label="Vencidos" />
        <Metric icon={Package}       color="#8b5cf6" value={metrics.total_parts_qty} label="Repuestos usados" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card title={`Timeline de mantenimientos (${mantenimientos.length})`}>
            {mantenimientos.length === 0 ? (
              <Empty msg="Sin historial todavía." />
            ) : (
              <div className="px-5 py-2">
                {mantenimientos.map((m, i) => (
                  <div key={m.id} className="flex gap-3 py-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{
                          background:
                            m.status === 'completed' ? '#059669' :
                            m.status === 'overdue'   ? '#ef4444' :
                            m.status === 'in_progress' ? '#f59e0b' : '#2563eb',
                        }}
                      />
                      {i < mantenimientos.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <MantTipoBadge tipo={m.tipo} />
                        <StatusBadge status={m.status} small />
                        <span className="text-xs text-fg-subtle">{m.scheduled_date}</span>
                        {m.duration_min && (
                          <span className="text-xs text-fg-subtle">· {m.duration_min} min</span>
                        )}
                      </div>
                      {m.kit && (
                        <div className="text-[11px] text-fg-subtle">Kit: {m.kit.name}</div>
                      )}
                      {m.notes && <div className="text-[13px] text-fg-muted mt-0.5">{m.notes}</div>}
                      {(m.parts ?? []).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(m.parts ?? []).map((p, pi) => (
                            <span
                              key={pi}
                              className="inline-flex items-center gap-1 bg-input-bg border border-border rounded-md px-2 py-0.5 text-[11px] text-fg-muted"
                            >
                              <Package size={10} />
                              {p.repuesto.name} ×{p.qty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: alerts + parts agg */}
        <div className="space-y-5">
          <Card title={`Alertas activas (${alertas.length})`}>
            {alertas.length === 0 ? (
              <Empty msg="Sin alertas activas." />
            ) : (
              alertas.map((a) => (
                <div key={a.id} className="flex items-start gap-2 px-5 py-3 border-b border-border last:border-b-0">
                  <AlertTriangle
                    size={14}
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: a.severity === 'critical' ? '#ef4444' : '#f59e0b' }}
                  />
                  <span className="text-xs text-fg-muted leading-snug">{a.message}</span>
                </div>
              ))
            )}
          </Card>

          <Card title={`Repuestos consumidos (${parts_aggregated.length})`}>
            {parts_aggregated.length === 0 ? (
              <Empty msg="Sin repuestos consumidos todavía." />
            ) : (
              <div className="px-5 py-2 space-y-2">
                {parts_aggregated.slice(0, 10).map((p) => (
                  <div key={p.repuesto.id} className="flex items-center justify-between text-xs">
                    <div className="flex-1 truncate">
                      <div className="text-fg font-semibold truncate">{p.repuesto.name}</div>
                      <div className="text-fg-subtle">{p.repuesto.code}</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-fg font-bold">×{p.qty}</div>
                      <div className="text-fg-subtle">${p.cost.toLocaleString('es-AR')}</div>
                    </div>
                  </div>
                ))}
                {parts_aggregated.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-border flex justify-between text-xs">
                    <span className="text-fg-muted font-semibold">Costo total</span>
                    <span className="text-fg font-extrabold">
                      ${metrics.total_parts_cost.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <QRModal
        open={showQR}
        onClose={() => setShowQR(false)}
        equipoId={equipo.id}
        equipoCode={equipo.code}
        equipoSerial={equipo.serial}
        qrToken={equipo.qr_token}
      />

      {equipoQ.data && (
        <Modal
          open={editing}
          onClose={() => setEditing(false)}
          title="Editar equipo"
          maxWidth={620}
        >
          <EquipoForm
            initial={equipoQ.data}
            onCancel={() => setEditing(false)}
            onSubmit={(data) => updateM.mutateAsync(data)}
            busy={updateM.isPending}
            error={editError}
          />
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: typeof MapPin }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[13px] text-fg font-medium flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-fg-subtle" />}
        {value}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, color, value, label }: { icon: typeof Wrench; color: string; value: number; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card">
      <Icon size={18} style={{ color }} className="mb-2" />
      <div className="text-2xl font-extrabold text-fg leading-none">{value}</div>
      <div className="text-[11px] text-fg-subtle mt-1">{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border">
        <span className="text-sm font-bold text-fg">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="p-8 text-center text-fg-subtle text-sm">{msg}</div>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="h-full flex items-center justify-center text-fg-subtle">{children}</div>;
}
