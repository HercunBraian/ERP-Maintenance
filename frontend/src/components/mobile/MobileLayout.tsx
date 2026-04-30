import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Calendar, Cpu, Bell, User, Plus } from 'lucide-react';

export function MobileLayout() {
  const navigate = useNavigate();
  return (
    <div className="h-screen flex flex-col font-sans bg-bg overflow-hidden">
      {/* Routed content */}
      <div className="flex-1 overflow-y-auto pb-[88px]">
        <Outlet />
      </div>

      {/* Bottom navigation with floating action button in the middle */}
      <nav
        className="fixed bottom-0 inset-x-0 bg-card border-t border-border flex items-end justify-around px-2 py-1.5 z-30"
        style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
      >
        <Tab to="/dashboard" icon={Calendar} label="Hoy" />
        <Tab to="/equipos"   icon={Cpu}      label="Equipos" />

        {/* FAB: Nueva OT */}
        <button
          onClick={() => navigate('/mantenimientos?new=1')}
          className="relative -mt-7 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-card-lg active:scale-95 transition-transform"
          aria-label="Nueva orden de trabajo"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>

        <Tab to="/alertas" icon={Bell}  label="Alertas" />
        <Tab to="/perfil"  icon={User}  label="Yo" />
      </nav>
    </div>
  );
}

function Tab({
  to, icon: Icon, label,
}: { to: string; icon: typeof Calendar; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2 transition-colors ${
          isActive ? 'text-primary' : 'text-fg-subtle'
        }`
      }
    >
      <Icon size={20} strokeWidth={2} />
      <span className="text-[10px] font-semibold">{label}</span>
    </NavLink>
  );
}
