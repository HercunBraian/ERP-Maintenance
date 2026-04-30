import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Wrench, AlertTriangle, Clock, CheckCircle, ChevronRight, Sun,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Mantenimiento } from '../../lib/types';
import { MantTipoBadge } from '../../components/badges';
import { useAuth } from '../../contexts/AuthContext';

export function MobHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const mants = useQuery({
    queryKey: ['mantenimientos', 'mob-home'],
    queryFn: () => api.mantenimientos.list({ limit: 200 }),
  });

  const buckets = useMemo(() => {
    const all = mants.data?.rows ?? [];
    return {
      overdue:    all.filter((m) => m.status === 'overdue'),
      inProgress: all.filter((m) => m.status === 'in_progress'),
      todayList:  all.filter((m) => m.status === 'scheduled' && m.scheduled_date === today),
      upcoming:   all.filter((m) => m.status === 'scheduled' && m.scheduled_date > today).slice(0, 5),
      completedToday: all.filter((m) => m.status === 'completed' && m.scheduled_date === today),
    };
  }, [mants.data, today]);

  return (
    <div className="font-sans">
      {/* Header strip with date + KPIs */}
      <header className="bg-sidebar text-white px-5 pt-6 pb-5 rounded-b-3xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/50 text-xs font-semibold uppercase tracking-wider">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long' })}
            </div>
            <div className="text-2xl font-extrabold leading-tight">
              {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
            </div>
          </div>
          <Sun size={24} className="text-amber-400" />
        </div>
        {user && (
          <div className="text-white/70 text-sm">
            Hola, <span className="text-white font-bold">{user.fullName.split(' ')[0]}</span>
          </div>
        )}
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat icon={Clock}        color="#ef4444" value={buckets.overdue.length}       label="Vencidos" />
          <Stat icon={Wrench}       color="#f59e0b" value={buckets.inProgress.length}    label="En curso" />
          <Stat icon={CheckCircle}  color="#10b981" value={buckets.completedToday.length} label="Hechos" />
        </div>
      </header>

      <div className="px-5 py-5 space-y-5">
        {/* Vencidos */}
        {buckets.overdue.length > 0 && (
          <Section title="Vencidos · prioridad alta" tone="red">
            {buckets.overdue.map((m) => <Card key={m.id} m={m} onClick={() => navigate(`/equipos/${m.equipo_id}`)} />)}
          </Section>
        )}

        {/* En curso */}
        {buckets.inProgress.length > 0 && (
          <Section title="En curso ahora" tone="amber">
            {buckets.inProgress.map((m) => <Card key={m.id} m={m} onClick={() => navigate(`/equipos/${m.equipo_id}`)} />)}
          </Section>
        )}

        {/* Hoy */}
        <Section title={`Programados para hoy (${buckets.todayList.length})`} tone="blue">
          {buckets.todayList.length === 0 ? (
            <Empty msg="Sin OTs programadas para hoy." />
          ) : (
            buckets.todayList.map((m) => <Card key={m.id} m={m} onClick={() => navigate(`/equipos/${m.equipo_id}`)} />)
          )}
        </Section>

        {/* Próximos */}
        {buckets.upcoming.length > 0 && (
          <Section title="Próximos" tone="default">
            {buckets.upcoming.map((m) => <Card key={m.id} m={m} onClick={() => navigate(`/equipos/${m.equipo_id}`)} />)}
          </Section>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, color, value, label }: { icon: typeof Wrench; color: string; value: number; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={13} style={{ color }} />
        <span className="text-2xl font-extrabold text-white leading-none">{value}</span>
      </div>
      <div className="text-[10px] text-white/60 font-medium">{label}</div>
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone: 'red' | 'amber' | 'blue' | 'default'; children: React.ReactNode }) {
  const dot = { red: '#ef4444', amber: '#f59e0b', blue: '#2563eb', default: '#94a3b8' }[tone];
  return (
    <section>
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
        <h2 className="text-xs font-bold uppercase tracking-wider text-fg-muted">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Card({ m, onClick }: { m: Mantenimiento; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card text-left active:scale-[0.99] transition-transform"
    >
      <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Wrench size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-fg truncate">{m.equipo?.model ?? '—'}</div>
        <div className="text-[11px] text-fg-subtle truncate">{m.equipo?.serial} · {m.cliente?.name}</div>
        <div className="mt-1 flex items-center gap-1.5">
          <MantTipoBadge tipo={m.tipo} />
          <span className="text-[10px] text-fg-subtle">{m.scheduled_date}</span>
        </div>
      </div>
      <ChevronRight size={18} className="text-fg-subtle flex-shrink-0" />
    </button>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center text-fg-subtle text-xs flex items-center justify-center gap-2">
      <AlertTriangle size={14} /> {msg}
    </div>
  );
}
