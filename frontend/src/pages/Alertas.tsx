import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell, CheckCircle, Clock, Package, Filter as FilterIcon } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Alerta, AlertSeverity, AlertType } from '../lib/types';
import { SeverityBadge } from '../components/badges';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../hooks/useRealtime';

type SeverityF = 'all' | AlertSeverity;
type ResolvedF = 'false' | 'true' | 'all';

const TYPE_META: Record<AlertType, { label: string; icon: typeof AlertTriangle; color: string }> = {
  overdue:    { label: 'Vencidos',         icon: Clock,          color: '#ef4444' },
  upcoming:   { label: 'Próximos',         icon: AlertTriangle,  color: '#f59e0b' },
  low_stock:  { label: 'Stock bajo',       icon: Package,        color: '#8b5cf6' },
};

export function Alertas() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [severityF, setSeverityF] = useState<SeverityF>('all');
  const [resolvedF, setResolvedF] = useState<ResolvedF>('false');
  const [resolveError, setResolveError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['alertas', { severityF, resolvedF }],
    queryFn: () => api.alertas.list({
      severity: severityF === 'all' ? undefined : severityF,
      resolved: resolvedF,
      limit: 200,
    }),
  });

  useRealtime('rt-alertas', 'alertas',
    useCallback(() => qc.invalidateQueries({ queryKey: ['alertas'] }), [qc]));

  const resolveM = useMutation({
    mutationFn: (id: string) => api.alertas.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas'] });
      setResolveError(null);
    },
    onError: (err) => setResolveError(err instanceof ApiError ? err.message : 'Error al resolver'),
  });

  // Group by type
  const grouped = useMemo(() => {
    const map: Record<AlertType, Alerta[]> = { overdue: [], upcoming: [], low_stock: [] };
    for (const a of list.data?.rows ?? []) map[a.type].push(a);
    return map;
  }, [list.data]);

  const totals = {
    overdue:    grouped.overdue.length,
    upcoming:   grouped.upcoming.length,
    low_stock:  grouped.low_stock.length,
    critical:   (list.data?.rows ?? []).filter((a) => a.severity === 'critical').length,
  };

  return (
    <div className="px-7 pt-7 pb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI icon={Clock}         color="#ef4444" value={totals.overdue}   label="Vencidos" />
        <KPI icon={AlertTriangle} color="#f59e0b" value={totals.upcoming}  label="Próximos" />
        <KPI icon={Package}       color="#8b5cf6" value={totals.low_stock} label="Stock bajo" />
        <KPI icon={Bell}          color="#dc2626" value={totals.critical}  label="Críticos" highlight />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <FilterIcon size={14} className="text-fg-subtle" />
        <span className="text-xs text-fg-subtle font-semibold uppercase tracking-wider">Severidad:</span>
        {(['all','critical','warning','info'] as SeverityF[]).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityF(s)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              severityF === s ? 'bg-primary text-white border-primary' : 'bg-card text-fg-muted border-border hover:bg-hover-bg'
            }`}
          >
            {{ all: 'Todas', critical: 'Crítico', warning: 'Warning', info: 'Info' }[s]}
          </button>
        ))}
        <span className="text-xs text-fg-subtle font-semibold uppercase tracking-wider ml-3">Estado:</span>
        {(['false','true','all'] as ResolvedF[]).map((r) => (
          <button
            key={r}
            onClick={() => setResolvedF(r)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              resolvedF === r ? 'bg-primary text-white border-primary' : 'bg-card text-fg-muted border-border hover:bg-hover-bg'
            }`}
          >
            {{ false: 'Activas', true: 'Resueltas', all: 'Todas' }[r]}
          </button>
        ))}
      </div>

      {resolveError && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
          <AlertTriangle size={14} /> {resolveError}
        </div>
      )}

      <div className="space-y-5">
        {(Object.entries(grouped) as [AlertType, Alerta[]][]).map(([type, items]) => (
          <Section
            key={type}
            type={type}
            items={items}
            isAdmin={isAdmin}
            onResolve={(id) => { setResolveError(null); resolveM.mutate(id); }}
            resolving={resolveM.variables}
          />
        ))}

        {(list.data?.rows ?? []).length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
            <div className="text-sm font-semibold text-fg">Sin alertas que mostrar</div>
            <div className="text-xs text-fg-subtle mt-1">Todo en orden con los filtros aplicados.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  type, items, isAdmin, onResolve, resolving,
}: {
  type: AlertType;
  items: Alerta[];
  isAdmin: boolean;
  onResolve: (id: string) => void;
  resolving: string | undefined;
}) {
  if (items.length === 0) return null;
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-input-bg">
        <div className="flex items-center gap-2">
          <Icon size={15} style={{ color: meta.color }} />
          <span className="text-sm font-bold text-fg">{meta.label}</span>
          <span className="text-xs text-fg-subtle">({items.length})</span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {items.map((a) => (
          <Row key={a.id} alerta={a} isAdmin={isAdmin} onResolve={onResolve} resolving={resolving === a.id} />
        ))}
      </div>
    </div>
  );
}

function Row({
  alerta, isAdmin, onResolve, resolving,
}: {
  alerta: Alerta;
  isAdmin: boolean;
  onResolve: (id: string) => void;
  resolving: boolean;
}) {
  const meta = TYPE_META[alerta.type];
  const isResolved = !!alerta.resolved_at;
  const md = (alerta.metadata ?? {}) as Record<string, unknown>;

  const detail = useMemo(() => {
    if (alerta.type === 'overdue' && typeof md.daysOverdue === 'number') return `${md.daysOverdue} días vencido`;
    if (alerta.type === 'upcoming' && typeof md.daysAhead === 'number') return `En ${md.daysAhead} días`;
    if (alerta.type === 'low_stock' && typeof md.currentStock === 'number') return `Stock ${md.currentStock}/${md.minStock ?? '?'}`;
    return null;
  }, [alerta.type, md]);

  return (
    <div className={`flex items-start gap-3 px-5 py-3 ${isResolved ? 'opacity-60' : ''}`}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: meta.color + '20' }}
      >
        <AlertTriangle size={14} style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-fg leading-snug">{alerta.message}</div>
        <div className="text-xs text-fg-subtle mt-0.5 flex items-center gap-2 flex-wrap">
          {detail && <span style={{ color: meta.color, fontWeight: 600 }}>{detail}</span>}
          {alerta.cliente && <span>· {alerta.cliente.name}</span>}
          <span>· {alerta.created_at?.slice(0,10)}</span>
        </div>
      </div>
      <SeverityBadge severity={alerta.severity} />
      {!isResolved && isAdmin && (
        <button
          onClick={() => onResolve(alerta.id)}
          disabled={resolving}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            resolving
              ? 'bg-bg border border-border text-fg-subtle cursor-not-allowed'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <CheckCircle size={12} /> {resolving ? 'Resolviendo…' : 'Resolver'}
        </button>
      )}
      {isResolved && (
        <span className="text-[10px] text-fg-subtle whitespace-nowrap">
          ✓ {alerta.resolved_at?.slice(0,10)}
        </span>
      )}
    </div>
  );
}

function KPI({ icon: Icon, value, label, color, highlight }: { icon: typeof Bell; value: number; label: string; color: string; highlight?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: color + '20' }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-extrabold leading-none" style={{ color: highlight && value > 0 ? color : 'var(--text)' }}>
          {value}
        </div>
        <div className="text-[11px] text-fg-subtle mt-1">{label}</div>
      </div>
    </div>
  );
}
