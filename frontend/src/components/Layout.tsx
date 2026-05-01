import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Cpu, Wrench, Package, Boxes, Bell,
  ScanLine, ChartBar, Settings, ChevronLeft, ChevronRight,
  Sun, Moon, LogOut, Plus, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './badges';
import { GlobalSearch } from './GlobalSearch';

const NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes',      icon: Users,           label: 'Clientes' },
  { to: '/equipos',       icon: Cpu,             label: 'Equipos' },
  { to: '/mantenimientos',icon: Wrench,          label: 'Mantenimientos' },
  { to: '/inventario',    icon: Package,         label: 'Inventario' },
  { to: '/kits',          icon: Boxes,           label: 'Kits' },
  { to: '/alertas',       icon: Bell,            label: 'Alertas' },
  { to: '/trazabilidad',  icon: ScanLine,        label: 'Trazabilidad' },
  { to: '/reportes',      icon: ChartBar,        label: 'Reportes' },
] as const;

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  equipos: 'Equipos',
  mantenimientos: 'Mantenimientos',
  inventario: 'Inventario',
  kits: 'Kits',
  alertas: 'Alertas',
  trazabilidad: 'Trazabilidad',
  reportes: 'Reportes',
  settings:   'Configuración',
  checklists: 'Plantillas de Checklist',
};

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light',
  );
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
  return { theme, toggle };
}

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (c: boolean) => void }) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const w = collapsed ? 64 : 220;

  return (
    <aside
      className="bg-sidebar flex flex-col flex-shrink-0 overflow-hidden border-r border-white/[0.08] transition-all duration-200"
      style={{ width: w, minWidth: w }}
    >
      {/* Logo */}
      <div className={`h-[60px] flex items-center gap-2.5 border-b border-white/[0.08] flex-shrink-0 ${collapsed ? 'px-4 justify-center' : 'px-5'}`}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Cpu size={17} color="#fff" strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white text-sm font-extrabold tracking-tight whitespace-nowrap">MaintenancePro</div>
            <div className="text-white/30 text-[10px] font-medium whitespace-nowrap">ERP / CMMS</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full flex items-center gap-2.5 rounded-lg mb-0.5 transition-colors text-sm font-medium ` +
              (collapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5') + ' ' +
              (isActive
                ? 'bg-primary text-white'
                : 'text-white/50 hover:bg-white/[0.07] hover:text-white')
            }
          >
            <item.icon size={17} strokeWidth={1.8} />
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}

        <div className="h-px bg-white/[0.08] mx-1 my-3" />

        {user?.role === 'admin' && (
          <NavLink
            to="/checklists"
            className={({ isActive }) =>
              `w-full flex items-center gap-2.5 rounded-lg mb-0.5 transition-colors text-sm font-medium ` +
              (collapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5') + ' ' +
              (isActive
                ? 'bg-primary text-white'
                : 'text-white/50 hover:bg-white/[0.07] hover:text-white')
            }
          >
            <ClipboardList size={17} strokeWidth={1.8} />
            {!collapsed && <span className="whitespace-nowrap">Checklists</span>}
          </NavLink>
        )}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 rounded-lg transition-colors text-sm font-medium ` +
            (collapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5') + ' ' +
            (isActive
              ? 'bg-primary text-white'
              : 'text-white/50 hover:bg-white/[0.07] hover:text-white')
          }
        >
          <Settings size={17} strokeWidth={1.8} />
          {!collapsed && <span>Configuración</span>}
        </NavLink>
      </nav>

      {/* Theme + user */}
      <div className="px-2 py-3 border-t border-white/[0.08] flex-shrink-0">
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-2.5 rounded-lg text-sm font-medium text-white/40 hover:bg-white/[0.07] hover:text-white transition-colors mb-1.5 ${collapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'}`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
        </button>

        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <Avatar initials={user.avatar ?? user.fullName.slice(0, 2).toUpperCase()} size={28} />
            <div className="flex-1 overflow-hidden">
              <div className="text-white text-xs font-semibold truncate">{user.fullName.split(' ')[0]}</div>
              <div className="text-white/30 text-[10px]">{user.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
            </div>
            <button
              onClick={() => void signOut()}
              title="Cerrar sesión"
              className="text-white/30 hover:text-white transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-white/25 hover:text-white/70 transition-colors ${collapsed ? 'justify-center' : 'justify-end'}`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}

function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const segment = location.pathname.split('/')[1] || 'dashboard';
  const title = VIEW_TITLES[segment] ?? segment;

  return (
    <header className="h-[60px] bg-card border-b border-border flex items-center px-5 gap-4 sticky top-0 z-30 flex-shrink-0">
      <h1 className="text-base font-bold text-fg flex-1">{title}</h1>

      <GlobalSearch />

      <button
        onClick={() => navigate('/mantenimientos?new=1')}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus size={15} /> Nuevo
      </button>

      <button
        onClick={() => navigate('/alertas')}
        className="relative p-1.5 rounded-lg text-fg-muted hover:bg-hover-bg hover:text-fg transition-colors"
      >
        <Bell size={18} />
      </button>

      {user && (
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-hover-bg transition-colors">
          <Avatar initials={user.avatar ?? user.fullName.slice(0, 2).toUpperCase()} size={30} />
          <div className="text-left">
            <div className="text-xs font-bold text-fg">{user.fullName.split(' ')[0]}</div>
            <div className="text-[10px] text-fg-subtle">{user.role === 'admin' ? 'Admin' : 'Técnico'}</div>
          </div>
        </button>
      )}
    </header>
  );
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden bg-bg">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
