import type { EquipmentStatus, MantStatus, AlertSeverity, MantTipo } from '../lib/types';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  // equipment
  operational:  { label: 'Operativo',          cls: 'bg-badge-green-bg  text-badge-green-fg' },
  alert:        { label: 'Alerta',             cls: 'bg-badge-yellow-bg text-badge-yellow-fg' },
  overdue:      { label: 'Vencido',            cls: 'bg-badge-red-bg    text-badge-red-fg' },
  maintenance:  { label: 'En mantenimiento',   cls: 'bg-badge-blue-bg   text-badge-blue-fg' },
  inactive:     { label: 'Inactivo',           cls: 'bg-badge-gray-bg   text-badge-gray-fg' },
  // mantenimiento
  scheduled:    { label: 'Programado',         cls: 'bg-badge-blue-bg   text-badge-blue-fg' },
  in_progress:  { label: 'En progreso',        cls: 'bg-badge-yellow-bg text-badge-yellow-fg' },
  completed:    { label: 'Completado',         cls: 'bg-badge-green-bg  text-badge-green-fg' },
  cancelled:    { label: 'Cancelado',          cls: 'bg-badge-gray-bg   text-badge-gray-fg' },
  // cliente
  active:       { label: 'Activo',             cls: 'bg-badge-green-bg  text-badge-green-fg' },
};

export function StatusBadge({
  status, small = false,
}: { status: EquipmentStatus | MantStatus | 'active' | 'inactive'; small?: boolean }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.inactive!;
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${s.cls} ${
        small ? 'px-2 py-px text-[11px]' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      {s.label}
    </span>
  );
}

const SEV_MAP: Record<AlertSeverity, { label: string; cls: string }> = {
  critical: { label: 'Crítico',     cls: 'bg-badge-red-bg    text-badge-red-fg' },
  warning:  { label: 'Advertencia', cls: 'bg-badge-yellow-bg text-badge-yellow-fg' },
  info:     { label: 'Info',        cls: 'bg-badge-blue-bg   text-badge-blue-fg' },
};

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const s = SEV_MAP[severity];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-px text-[11px] font-bold uppercase tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  );
}

const TIPO_MAP: Record<MantTipo, { label: string; color: string }> = {
  'preventive-6m':  { label: 'Preventivo 6M',  color: '#059669' },
  'preventive-12m': { label: 'Preventivo 12M', color: '#0284c7' },
  'corrective':     { label: 'Correctivo',     color: '#dc2626' },
  'use-based':      { label: 'Por uso',        color: '#7c3aed' },
};

export function MantTipoBadge({ tipo }: { tipo: MantTipo }) {
  const s = TIPO_MAP[tipo] ?? { label: tipo, color: '#64748b' };
  return (
    <span
      className="inline-flex items-center rounded px-2 py-px text-[11px] font-semibold whitespace-nowrap"
      style={{ background: s.color + '24', color: s.color }}
    >
      {s.label}
    </span>
  );
}

export function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
