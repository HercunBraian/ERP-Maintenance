import { useState } from 'react';
import { Sun, Moon, LogOut, Mail, Shield, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/badges';

export function MobPerfil() {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light',
  );
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  if (!user) return null;

  return (
    <div className="font-sans pt-6">
      {/* Avatar header */}
      <div className="px-5 pb-5 flex flex-col items-center gap-3">
        <Avatar initials={user.avatar ?? user.fullName.slice(0, 2).toUpperCase()} size={80} />
        <div className="text-center">
          <div className="text-lg font-extrabold text-fg">{user.fullName}</div>
          <div className="text-xs text-fg-muted">{user.email}</div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{
            background: user.role === 'admin' ? '#dbeafe' : '#dcfce7',
            color:      user.role === 'admin' ? '#1e40af' : '#166534',
          }}
        >
          {user.role === 'admin' ? <Shield size={11} /> : <Wrench size={11} />}
          {user.role === 'admin' ? 'Administrador' : 'Técnico'}
        </span>
      </div>

      <div className="px-5 space-y-2">
        <Row icon={Mail} label="Email" value={user.email} />

        <button
          onClick={toggleTheme}
          className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            {theme === 'dark' ? <Sun size={18} className="text-primary" /> : <Moon size={18} className="text-primary" />}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-bold text-fg">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</div>
            <div className="text-[11px] text-fg-subtle">Cambiar apariencia</div>
          </div>
        </button>

        <button
          onClick={() => void signOut()}
          className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <LogOut size={18} className="text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-bold text-red-500">Cerrar sesión</div>
            <div className="text-[11px] text-fg-subtle">Salir de tu cuenta</div>
          </div>
        </button>
      </div>

      <div className="text-center text-[10px] text-fg-subtle mt-8 pb-4">
        MaintenancePro · ERP/CMMS v3.0
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card">
      <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center">
        <Icon size={16} className="text-fg-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">{label}</div>
        <div className="text-sm text-fg truncate">{value}</div>
      </div>
    </div>
  );
}
