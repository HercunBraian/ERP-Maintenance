import { useCallback, useMemo, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Clock, Package, Loader, CheckCircle, Cpu, ArrowRight, type LucideProps,
} from 'lucide-react';
import { api } from '../lib/api';
import type { EquipmentStatus, Mantenimiento } from '../lib/types';
import { StatusBadge, SeverityBadge, MantTipoBadge } from '../components/badges';
import { useRealtime } from '../hooks/useRealtime';

type Icon = ComponentType<LucideProps>;

interface KPI {
  label: string; sub: string; value: number;
  icon: Icon; tone: { fg: string; bg: string }; to: string;
}

export function Dashboard() {
  const qc = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  const equipos = useQuery({
    queryKey: ['equipos', 'all'],
    queryFn: () => api.equipos.list({ limit: 200 }),
  });
  const upcoming = useQuery({
    queryKey: ['mantenimientos', 'scheduled'],
    queryFn: () => api.mantenimientos.list({ status: 'scheduled', limit: 5 }),
  });
  const upcoming30 = useQuery({
    queryKey: ['mantenimientos', 'upcoming-30', today, in30],
    queryFn: () => api.mantenimientos.list({ status: 'scheduled', from: today, to: in30, limit: 1 }),
  });
  const overdueM = useQuery({
    queryKey: ['mantenimientos', 'overdue'],
    queryFn: () => api.mantenimientos.list({ status: 'overdue', limit: 1 }),
  });
  const completed = useQuery({
    queryKey: ['mantenimientos', 'completed'],
    queryFn: () => api.mantenimientos.list({ status: 'completed', limit: 4 }),
  });
  const inProgress = useQuery({
    queryKey: ['mantenimientos', 'in-progress'],
    queryFn: () => api.mantenimientos.list({ status: 'in_progress', limit: 100 }),
  });
  const alertsCritical = useQuery({
    queryKey: ['alertas', 'critical-unresolved'],
    queryFn: () => api.alertas.list({ severity: 'critical', resolved: 'false', limit: 4 }),
  });
  const stockLow = useQuery({
    queryKey: ['stock', 'low'],
    queryFn: () => api.stock.list({ low_stock: true, limit: 200 }),
  });

  // Live updates: any change to these tables refetches the relevant queries.
  useRealtime('rt-dash-mants',   'mantenimientos',     useCallback(() => qc.invalidateQueries({ queryKey: ['mantenimientos'] }), [qc]));
  useRealtime('rt-dash-equipos', 'equipos',            useCallback(() => qc.invalidateQueries({ queryKey: ['equipos'] }),       [qc]));
  useRealtime('rt-dash-alertas', 'alertas',            useCallback(() => qc.invalidateQueries({ queryKey: ['alertas'] }),       [qc]));
  useRealtime('rt-dash-stock',   'stock_por_deposito', useCallback(() => qc.invalidateQueries({ queryKey: ['stock'] }),         [qc]));

  const kpis: KPI[] = useMemo(() => {
    const overdue   = overdueM.data?.total ?? 0;
    const upcomingC = upcoming30.data?.total ?? 0;
    const lowStock  = stockLow.data?.total ?? 0;
    const inProg    = inProgress.data?.total ?? 0;
    const completedThisMonth = (completed.data?.rows ?? []).filter((m) => {
      const now = new Date();
      const d = new Date(m.scheduled_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const operational = (equipos.data?.rows ?? []).filter((e) => e.status === 'operational').length;

    return [
      { label: 'Vencidos',         sub: 'mantenimientos', value: overdue,            icon: AlertTriangle, tone: { fg: '#ef4444', bg: '#fef2f2' }, to: '/mantenimientos?status=overdue' },
      { label: 'Próximos 30 días', sub: 'mantenimientos', value: upcomingC,          icon: Clock,         tone: { fg: '#f59e0b', bg: '#fffbeb' }, to: '/mantenimientos?status=scheduled' },
      { label: 'Stock crítico',    sub: 'repuestos',      value: lowStock,           icon: Package,       tone: { fg: '#8b5cf6', bg: '#f5f3ff' }, to: '/inventario' },
      { label: 'En progreso',      sub: 'trabajos',       value: inProg,             icon: Loader,        tone: { fg: '#2563eb', bg: '#eff6ff' }, to: '/mantenimientos' },
      { label: 'Completados',      sub: 'este mes',       value: completedThisMonth, icon: CheckCircle,   tone: { fg: '#059669', bg: '#f0fdf4' }, to: '/mantenimientos' },
      { label: 'Equipos activos',  sub: 'operativos',     value: operational,        icon: Cpu,           tone: { fg: '#0284c7', bg: '#f0f9ff' }, to: '/equipos' },
    ];
  }, [overdueM.data, upcoming30.data, stockLow.data, inProgress.data, completed.data, equipos.data]);

  const equipoStatusBreakdown = useMemo(() => {
    const all = equipos.data?.rows ?? [];
    const total = Math.max(all.length, 1);
    const list: { status: EquipmentStatus; label: string; color: string }[] = [
      { status: 'operational', label: 'Operativos',       color: '#059669' },
      { status: 'alert',       label: 'Con alerta',       color: '#f59e0b' },
      { status: 'overdue',     label: 'Vencidos',         color: '#ef4444' },
      { status: 'maintenance', label: 'En mantenimiento', color: '#2563eb' },
    ];
    return list.map((s) => {
      const count = all.filter((e) => e.status === s.status).length;
      return { ...s, count, pct: Math.round((count / total) * 100) };
    });
  }, [equipos.data]);

  return (
    <div className="px-7 pt-7 pb-10">
      {/* KPI grid */}
      <div className="grid gap-3.5 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
        {kpis.map((k) => (
          <Link
            key={k.label}
            to={k.to}
            className="bg-card border border-border rounded-xl p-[18px_18px_16px] shadow-card hover:shadow-card-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="w-9 h-9 rounded-[9px] flex items-center justify-center mb-3" style={{ background: k.tone.bg }}>
              <k.icon size={18} color={k.tone.fg} strokeWidth={2} />
            </div>
            <div className="text-[28px] font-extrabold text-fg leading-none mb-1">{k.value}</div>
            <div className="text-xs font-bold text-fg mb-0.5">{k.label}</div>
            <div className="text-[11px] text-fg-subtle">{k.sub}</div>
          </Link>
        ))}
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Mantenimientos programados" link="/mantenimientos">
          {(upcoming.data?.rows ?? []).length === 0 ? (
            <Empty msg="Sin mantenimientos programados" />
          ) : (
            (upcoming.data?.rows ?? []).map((m: Mantenimiento) => (
              <Link
                key={m.id}
                to={`/equipos/${m.equipo_id}`}
                className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-hover-bg transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Cpu size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-fg truncate">{m.equipo?.model ?? '—'}</div>
                  <div className="text-[11px] text-fg-subtle truncate">
                    {m.cliente?.name} · {m.equipo?.serial}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <MantTipoBadge tipo={m.tipo} />
                  <div className="text-[11px] text-fg-subtle mt-0.5">{m.scheduled_date}</div>
                </div>
              </Link>
            ))
          )}
        </Card>

        <Card title="Alertas críticas" link="/alertas">
          {(alertsCritical.data?.rows ?? []).length === 0 ? (
            <Empty msg="Sin alertas críticas activas" />
          ) : (
            (alertsCritical.data?.rows ?? []).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 px-5 py-3 border-b border-border last:border-b-0"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-px"
                     style={{ background: a.severity === 'critical' ? '#fef2f2' : '#fffbeb' }}>
                  <AlertTriangle size={15} color={a.severity === 'critical' ? '#ef4444' : '#f59e0b'} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-fg leading-snug">{a.message}</div>
                  <div className="text-[11px] text-fg-subtle mt-0.5">
                    {a.created_at?.slice(0, 10)}
                  </div>
                </div>
                <SeverityBadge severity={a.severity} />
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card title="Actividad reciente">
            {(completed.data?.rows ?? []).map((m: Mantenimiento, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-3.5 px-5 py-3 ${
                  i < (completed.data?.rows ?? []).length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                <div className="flex-1 text-[13px] text-fg">
                  Completó <MantTipoBadge tipo={m.tipo} /> en{' '}
                  <Link to={`/equipos/${m.equipo_id}`} className="text-primary font-semibold hover:underline">
                    {m.equipo?.model}
                  </Link>
                  <div className="text-[11px] text-fg-subtle mt-0.5">
                    {m.cliente?.name} · {m.scheduled_date}
                    {m.duration_min ? ` · ${m.duration_min} min` : ''}
                  </div>
                </div>
                <StatusBadge status="completed" small />
              </div>
            ))}
            {(completed.data?.rows ?? []).length === 0 && <Empty msg="Sin actividad reciente" />}
          </Card>
        </div>

        <Card title="Estado de equipos">
          <div className="p-5 space-y-3.5">
            {equipoStatusBreakdown.map((s) => (
              <div key={s.status}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-fg-muted font-medium">{s.label}</span>
                  <span className="text-[13px] font-bold text-fg">{s.count}</span>
                </div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${s.pct}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
            <Link
              to="/equipos"
              className="flex items-center justify-center gap-1.5 w-full py-2 mt-3 bg-bg border border-border rounded-lg text-primary text-[13px] font-semibold hover:opacity-80"
            >
              Ver todos los equipos <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <span className="text-sm font-bold text-fg">{title}</span>
        {link && (
          <Link to={link} className="text-xs text-primary font-semibold hover:underline">Ver todos →</Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="p-8 text-center text-fg-subtle text-sm">{msg}</div>;
}
