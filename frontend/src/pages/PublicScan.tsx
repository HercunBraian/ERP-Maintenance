import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu, CheckCircle, AlertTriangle, XCircle, Calendar, Building2, Wrench, ChevronRight,
  Loader2, ScanLine, Lock,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface ScanData {
  equipo_id: string;
  serial: string;
  model: string;
  brand: string;
  cliente_name: string;
  status: string;
  next_maintenance_date: string | null;
  scan_count: number;
}

const STATUS: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  operational: { label: 'OPERATIVO',          color: '#059669', bg: '#d1fae5', icon: CheckCircle },
  alert:       { label: 'PRÓXIMO',            color: '#f59e0b', bg: '#fef3c7', icon: AlertTriangle },
  overdue:     { label: 'VENCIDO',            color: '#ef4444', bg: '#fee2e2', icon: XCircle },
  maintenance: { label: 'EN MANTENIMIENTO',   color: '#2563eb', bg: '#dbeafe', icon: Wrench },
  inactive:    { label: 'INACTIVO',           color: '#64748b', bg: '#f1f5f9', icon: XCircle },
};

export function PublicScan() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const isAuth = !!session;

  const q = useQuery({
    queryKey: ['public-scan', token],
    queryFn: () => api.scan.public(token!),
    enabled: !!token,
    retry: 0,
  });

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      {/* Header */}
      <header className="bg-sidebar px-5 py-4 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Cpu size={18} color="#fff" />
        </div>
        <div className="flex-1">
          <div className="text-white text-base font-extrabold tracking-tight">MaintenancePro</div>
          <div className="text-white/40 text-[10px]">Scan público de equipo</div>
        </div>
        <ScanLine size={18} className="text-white/30" />
      </header>

      <main className="flex-1 flex items-center justify-center p-5">
        {q.isLoading && <Loader2 className="animate-spin text-fg-subtle" size={32} />}

        {q.isError && (
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-card">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-fg mb-2">Equipo no encontrado</h2>
            <p className="text-sm text-fg-muted">
              El código QR escaneado no corresponde a ningún equipo registrado o el token expiró.
            </p>
          </div>
        )}

        {q.data && <ScanCard data={q.data} isAuth={isAuth} onNavigate={navigate} />}
      </main>

      {/* Footer */}
      <footer className="px-5 py-3 text-center text-[11px] text-fg-subtle border-t border-border bg-card flex-shrink-0">
        © 2026 MaintenancePro · ERP/CMMS
      </footer>
    </div>
  );
}

function ScanCard({ data, isAuth, onNavigate }: { data: ScanData; isAuth: boolean; onNavigate: (to: string) => void }) {
  const status = STATUS[data.status] ?? STATUS.inactive!;
  const Icon = status.icon;

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Big status banner */}
      <div
        className="rounded-2xl p-6 flex items-center gap-4 shadow-card border-l-8"
        style={{ background: status.bg, borderColor: status.color }}
      >
        <Icon size={40} style={{ color: status.color }} strokeWidth={2.5} />
        <div className="flex-1">
          <div className="text-[11px] font-bold tracking-wider" style={{ color: status.color }}>
            ESTADO
          </div>
          <div className="text-2xl font-extrabold leading-tight" style={{ color: status.color }}>
            {status.label}
          </div>
        </div>
      </div>

      {/* Equipo info */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Cpu size={22} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-fg leading-tight">{data.model}</div>
            <div className="text-xs text-fg-muted">{data.brand}</div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <Field label="Número de serie" value={<code className="font-mono text-fg font-semibold">{data.serial}</code>} />
          <Field label="Cliente" icon={Building2} value={data.cliente_name} />
          <Field
            label="Próximo mantenimiento"
            icon={Calendar}
            value={data.next_maintenance_date ?? 'No programado'}
          />
          <Field label="Escaneado" value={`${data.scan_count} ${data.scan_count === 1 ? 'vez' : 'veces'}`} />
        </div>
      </div>

      {/* Actions */}
      {isAuth ? (
        <div className="space-y-2">
          <button
            onClick={() => onNavigate('/mantenimientos?new=1')}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Wrench size={16} /> Registrar mantenimiento
          </button>
          <Link
            to={`/equipos/${data.equipo_id}`}
            className="w-full flex items-center justify-center gap-2 py-3 bg-card border border-border text-fg rounded-xl text-sm font-semibold hover:bg-hover-bg transition-colors"
          >
            Ver detalle completo <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-dashed border-border rounded-2xl p-4 flex items-center gap-3 text-sm">
          <Lock size={18} className="text-fg-subtle flex-shrink-0" />
          <div className="flex-1 text-fg-muted text-xs">
            Iniciá sesión para registrar mantenimientos y ver el historial completo.
          </div>
          <Link
            to="/login"
            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:opacity-90"
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, icon: Icon,
}: { label: string; value: React.ReactNode; icon?: typeof Calendar }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[11px] font-bold text-fg-subtle uppercase tracking-wider flex items-center gap-1">
        {Icon && <Icon size={11} />} {label}
      </div>
      <div className="text-sm text-fg font-medium text-right">{value}</div>
    </div>
  );
}
