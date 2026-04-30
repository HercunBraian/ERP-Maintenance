import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Cpu, Building2, Wrench, Package, Clock, AlertTriangle,
  CheckCircle, Loader2, ScanLine,
} from 'lucide-react';
import { api } from '../lib/api';
import type { TrazabilidadEquipo, TrazabilidadCliente } from '../lib/types';
import { StatusBadge, MantTipoBadge, SeverityBadge } from '../components/badges';

type Tab = 'equipo' | 'cliente';

export function Trazabilidad() {
  const [tab, setTab] = useState<Tab>('equipo');
  const [pickedId, setPickedId] = useState<string | null>(null);

  return (
    <div className="px-7 pt-7 pb-10">
      <div className="flex items-center gap-2 mb-5">
        <ScanLine className="text-primary" />
        <h1 className="text-lg font-extrabold text-fg">Trazabilidad</h1>
      </div>

      <div className="flex gap-1 mb-5 bg-card border border-border rounded-lg p-1 w-fit">
        <TabBtn active={tab === 'equipo'} onClick={() => { setTab('equipo'); setPickedId(null); }}>
          <Cpu size={14} /> Por equipo
        </TabBtn>
        <TabBtn active={tab === 'cliente'} onClick={() => { setTab('cliente'); setPickedId(null); }}>
          <Building2 size={14} /> Por cliente
        </TabBtn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {tab === 'equipo'
          ? <EquipoSelector pickedId={pickedId} onPick={setPickedId} />
          : <ClienteSelector pickedId={pickedId} onPick={setPickedId} />}

        <div>
          {!pickedId && (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-fg-subtle">
              Seleccioná {tab === 'equipo' ? 'un equipo' : 'un cliente'} para ver su trazabilidad completa.
            </div>
          )}
          {pickedId && tab === 'equipo'  && <EquipoView  id={pickedId} />}
          {pickedId && tab === 'cliente' && <ClienteView id={pickedId} />}
        </div>
      </div>
    </div>
  );
}

// ─── Selectors ───────────────────────────────────────────────────────────────

function EquipoSelector({ pickedId, onPick }: { pickedId: string | null; onPick: (id: string) => void }) {
  const [q, setQ] = useState('');
  const list = useQuery({
    queryKey: ['equipos', 'trazabilidad-selector'],
    queryFn: () => api.equipos.list({ limit: 200 }),
    staleTime: 60_000,
  });
  const filtered = useMemo(() => {
    const all = list.data?.rows ?? [];
    if (!q.trim()) return all;
    const term = q.toLowerCase();
    return all.filter((e) =>
      e.serial.toLowerCase().includes(term) ||
      e.model.toLowerCase().includes(term) ||
      String(e.code).includes(term),
    );
  }, [list.data, q]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card flex flex-col" style={{ maxHeight: '70vh' }}>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <Search size={14} className="text-fg-subtle" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar equipo…"
          className="bg-transparent text-fg text-sm outline-none flex-1"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {filtered.map((e) => (
          <button
            key={e.id}
            onClick={() => onPick(e.id)}
            className={`w-full text-left px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-hover-bg transition-colors ${
              pickedId === e.id ? 'bg-primary/10' : ''
            }`}
          >
            <div className="text-[13px] font-semibold text-fg truncate">{e.model}</div>
            <div className="text-[11px] text-fg-subtle">{e.serial} · {e.cliente?.name ?? '—'}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-fg-subtle text-sm">Sin resultados.</div>
        )}
      </div>
    </div>
  );
}

function ClienteSelector({ pickedId, onPick }: { pickedId: string | null; onPick: (id: string) => void }) {
  const [q, setQ] = useState('');
  const list = useQuery({
    queryKey: ['clientes', 'trazabilidad-selector'],
    queryFn: () => api.clientes.list({ limit: 200 }),
    staleTime: 60_000,
  });
  const filtered = useMemo(() => {
    const all = list.data?.rows ?? [];
    if (!q.trim()) return all;
    const term = q.toLowerCase();
    return all.filter((c) => c.name.toLowerCase().includes(term) || String(c.code).includes(term));
  }, [list.data, q]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card flex flex-col" style={{ maxHeight: '70vh' }}>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <Search size={14} className="text-fg-subtle" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente…"
          className="bg-transparent text-fg text-sm outline-none flex-1"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            className={`w-full text-left px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-hover-bg transition-colors ${
              pickedId === c.id ? 'bg-primary/10' : ''
            }`}
          >
            <div className="text-[13px] font-semibold text-fg truncate">{c.name}</div>
            <div className="text-[11px] text-fg-subtle">{c.contact_name ?? c.code}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-fg-subtle text-sm">Sin resultados.</div>
        )}
      </div>
    </div>
  );
}

// ─── Equipo view ─────────────────────────────────────────────────────────────

function EquipoView({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ['trazabilidad', 'equipo', id],
    queryFn: () => api.trazabilidad.equipo(id),
  });

  if (q.isLoading) return <CenteredLoading />;
  if (!q.data) return <NoData />;
  const t: TrazabilidadEquipo = q.data;

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center gap-4">
        <div className="w-14 h-14 rounded-[14px] bg-primary/15 flex items-center justify-center">
          <Cpu className="text-primary" size={26} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-extrabold text-fg">{t.equipo.model}</div>
          <div className="text-xs text-fg-subtle flex flex-wrap gap-2 items-center mt-0.5">
            <code className="font-mono">{t.equipo.serial}</code>
            <span>·</span>
            <Link to={`/clientes/${t.equipo.cliente.id}`} className="text-primary hover:underline">
              {t.equipo.cliente.name}
            </Link>
            <StatusBadge status={t.equipo.status} small />
          </div>
        </div>
        <Link
          to={`/equipos/${t.equipo.id}`}
          className="text-primary text-xs font-semibold hover:opacity-80"
        >
          Ver detalle operativo →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={Wrench}      color="#2563eb" value={t.metrics.total_mantenimientos}        label="OTs totales" />
        <Metric icon={CheckCircle} color="#059669" value={t.metrics.completed}                   label="Completadas" />
        <Metric icon={Clock}       color="#ef4444" value={t.metrics.overdue}                     label="Vencidas" />
        <Metric icon={Package}     color="#8b5cf6" value={`$${t.metrics.total_parts_cost.toLocaleString('es-AR')}`} label="Costo total repuestos" />
      </div>

      <Card title={`Timeline completo (${t.timeline.length})`}>
        {t.timeline.length === 0 ? (
          <Empty msg="Sin registros." />
        ) : (
          <div className="px-5 py-3">
            {t.timeline.map((m, i) => (
              <div key={m.id} className="flex gap-3 py-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{
                    background:
                      m.status === 'completed' ? '#059669' :
                      m.status === 'overdue'   ? '#ef4444' :
                      m.status === 'in_progress' ? '#f59e0b' : '#2563eb',
                  }} />
                  {i < t.timeline.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <MantTipoBadge tipo={m.tipo} />
                    <StatusBadge status={m.status} small />
                    <span className="text-xs text-fg-subtle">{m.scheduled_date}</span>
                    {m.duration_min && <span className="text-xs text-fg-subtle">· {m.duration_min} min</span>}
                    {m.technician?.full_name && (
                      <span className="text-[11px] text-fg-muted">por {m.technician.full_name}</span>
                    )}
                  </div>
                  {m.kit && <div className="text-[11px] text-fg-subtle">Kit: {m.kit.name}</div>}
                  {m.notes && <div className="text-[13px] text-fg-muted mt-0.5">{m.notes}</div>}
                  {(m.parts ?? []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(m.parts ?? []).map((p, pi) => (
                        <span key={pi} className="inline-flex items-center gap-1 bg-input-bg border border-border rounded-md px-2 py-0.5 text-[11px] text-fg-muted">
                          <Package size={10} /> {p.repuesto.name} ×{p.qty}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title={`Repuestos consumidos (${t.parts_aggregated.length})`}>
          {t.parts_aggregated.length === 0 ? <Empty msg="Sin repuestos." /> : (
            <div className="px-5 py-2 space-y-2">
              {t.parts_aggregated.slice(0, 10).map((p) => (
                <div key={p.repuesto.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <div className="text-fg font-semibold truncate">{p.repuesto.name}</div>
                    <div className="text-fg-subtle">{p.repuesto.code}</div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-fg font-bold">×{p.qty}</div>
                    <div className="text-fg-subtle">${p.cost.toLocaleString('es-AR')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title={`Alertas (${t.alertas.length})`}>
          {t.alertas.length === 0 ? <Empty msg="Sin alertas." /> : (
            t.alertas.map((a) => (
              <div key={a.id} className="px-5 py-3 border-b border-border last:border-b-0">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-fg-muted">{a.message}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <SeverityBadge severity={a.severity} />
                      {a.resolved_at && <span className="text-[10px] text-fg-subtle">resuelta {a.resolved_at.slice(0,10)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Cliente view ────────────────────────────────────────────────────────────

function ClienteView({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ['trazabilidad', 'cliente', id],
    queryFn: () => api.trazabilidad.cliente(id),
  });

  if (q.isLoading) return <CenteredLoading />;
  if (!q.data) return <NoData />;
  const t: TrazabilidadCliente = q.data;

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center gap-4">
        <div className="w-14 h-14 rounded-[14px] bg-primary/15 flex items-center justify-center">
          <Building2 className="text-primary" size={26} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-extrabold text-fg">{t.cliente.name}</div>
          <div className="text-xs text-fg-subtle">{t.cliente.contact_name ?? '—'} · {t.cliente.email ?? '—'}</div>
        </div>
        <Link
          to={`/clientes/${t.cliente.id}`}
          className="text-primary text-xs font-semibold hover:opacity-80"
        >
          Ver ficha →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metric icon={Cpu}         color="#2563eb" value={t.metrics.equipos_total}            label="Equipos" />
        <Metric icon={Wrench}      color="#0284c7" value={t.metrics.mantenimientos_total}     label="OTs históricas" />
        <Metric icon={CheckCircle} color="#059669" value={t.metrics.mantenimientos_completed} label="Completadas" />
        <Metric icon={Clock}       color="#ef4444" value={t.metrics.mantenimientos_overdue}   label="Vencidas" />
        <Metric icon={Package}     color="#8b5cf6" value={`$${t.metrics.total_parts_cost.toLocaleString('es-AR')}`} label="Costo repuestos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title={`Equipos (${t.equipos.length})`}>
          {t.equipos.length === 0 ? <Empty msg="Sin equipos." /> : (
            <div>
              {t.equipos.map((e) => (
                <Link
                  key={e.id}
                  to={`/equipos/${e.id}`}
                  className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-hover-bg transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center">
                    <Cpu size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-fg truncate">{e.model}</div>
                    <div className="text-[11px] text-fg-subtle">{e.serial} · próximo: {e.next_maintenance_date ?? '—'}</div>
                  </div>
                  <StatusBadge status={e.status} small />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card title={`Actividad reciente (${t.mantenimientos_recent.length})`}>
          {t.mantenimientos_recent.length === 0 ? <Empty msg="Sin actividad." /> : (
            t.mantenimientos_recent.slice(0, 10).map((m) => (
              <div key={m.id} className="px-5 py-3 border-b border-border last:border-b-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <MantTipoBadge tipo={m.tipo} />
                  <StatusBadge status={m.status} small />
                  <span className="text-xs text-fg-subtle">{m.scheduled_date}</span>
                </div>
                <div className="text-[13px] text-fg-muted">{m.equipo.serial} · {m.equipo.model}</div>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card title={`Distribución de equipos`}>
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatusCount label="Operativos"  value={t.metrics.equipos_by_status.operational}  color="#059669" />
          <StatusCount label="Alerta"      value={t.metrics.equipos_by_status.alert}        color="#f59e0b" />
          <StatusCount label="Vencidos"    value={t.metrics.equipos_by_status.overdue}      color="#ef4444" />
          <StatusCount label="En mant."    value={t.metrics.equipos_by_status.maintenance}  color="#2563eb" />
          <StatusCount label="Inactivos"   value={t.metrics.equipos_by_status.inactive}     color="#94a3b8" />
        </div>
      </Card>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
        active ? 'bg-primary text-white' : 'text-fg-muted hover:bg-hover-bg'
      }`}
    >{children}</button>
  );
}

function Metric({ icon: Icon, color, value, label }: { icon: typeof Wrench; color: string; value: number | string; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card">
      <Icon size={18} style={{ color }} className="mb-2" />
      <div className="text-xl font-extrabold text-fg leading-none">{value}</div>
      <div className="text-[11px] text-fg-subtle mt-1">{label}</div>
    </div>
  );
}

function StatusCount({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-fg-subtle mt-0.5">{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-sm font-bold text-fg">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="p-6 text-center text-fg-subtle text-sm">{msg}</div>;
}

function CenteredLoading() {
  return (
    <div className="bg-card border border-border rounded-xl p-12 flex justify-center">
      <Loader2 className="animate-spin text-fg-subtle" />
    </div>
  );
}

function NoData() {
  return (
    <div className="bg-card border border-border rounded-xl p-12 text-center text-fg-subtle">
      Sin datos para mostrar.
    </div>
  );
}
