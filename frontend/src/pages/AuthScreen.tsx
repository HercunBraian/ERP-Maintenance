import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Cpu, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AuthScreen() {
  const { signIn, session, loading } = useAuth();
  const [email, setEmail] = useState('admin@cmms.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Completá todos los campos');
      return;
    }
    setBusy(true);
    setError('');
    const { error: err } = await signIn(email, password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-stretch bg-bg font-sans">
      {/* Left brand panel — only visible on lg+ */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-sidebar relative overflow-hidden p-12">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Cpu size={18} color="#fff" strokeWidth={2} />
            </div>
            <span className="text-white text-lg font-extrabold tracking-tight">MaintenancePro</span>
          </div>
          <h2 className="text-white text-[26px] font-bold leading-snug mb-4">
            Gestión de mantenimiento industrial profesional
          </h2>
          <p className="text-white/55 text-sm leading-relaxed">
            Control completo de preventivos, correctivos, trazabilidad e inventario desde un solo lugar.
          </p>
        </div>
        <div className="text-white/30 text-xs">© 2026 MaintenancePro — ERP/CMMS v3.0</div>
        <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-primary opacity-[0.08]" />
        <div className="absolute top-32 -right-8 w-32 h-32 rounded-full bg-primary opacity-[0.05]" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-[10px] bg-primary flex items-center justify-center">
              <Cpu size={20} color="#fff" />
            </div>
            <div>
              <div className="text-base font-extrabold text-fg tracking-tight">MaintenancePro</div>
              <div className="text-[11px] text-fg-subtle font-medium">ERP / CMMS Industrial</div>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-fg mb-1.5 tracking-tight">Iniciar sesión</h1>
          <p className="text-sm text-fg-muted mb-8">Accedé a tu panel de mantenimiento</p>

          <div className="bg-primary/10 border border-primary/30 rounded-lg px-3.5 py-2.5 mb-6 text-xs text-primary">
            <strong>Demo:</strong> admin@cmms.com / lucas@cmms.com
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-fg-muted mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-border bg-input-bg text-fg text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-fg-muted mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-border bg-input-bg text-fg text-sm outline-none focus:border-primary"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-badge-red-bg text-badge-red-fg text-sm">
                <AlertTriangle size={15} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className={`w-full py-2.5 rounded-lg text-white text-sm font-bold tracking-wide transition-opacity ${
                busy ? 'bg-primary-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'
              }`}
            >
              {busy ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
