
const { useState, useRef, useEffect } = React;

function Sidebar() {
  const { currentView, navigate, sidebarCollapsed, setSidebarCollapsed, alerts, theme, toggleTheme, currentUser, logout } = useApp();

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'clients', icon: 'clients', label: 'Clientes' },
    { id: 'equipment', icon: 'equipment', label: 'Equipos' },
    { id: 'maintenance', icon: 'maintenance', label: 'Mantenimientos' },
    { id: 'inventory', icon: 'inventory', label: 'Inventario' },
    { id: 'kits', icon: 'kits', label: 'Kits' },
    { id: 'alerts', icon: 'alerts', label: 'Alertas' },
    { id: 'traceability', icon: 'traceability', label: 'Trazabilidad' },
    { id: 'reports', icon: 'reports', label: 'Reportes' },
  ];

  const overdueCount = alerts.filter(a => a.type === 'overdue').length;

  const w = sidebarCollapsed ? 64 : 220;

  return (
    <div style={{
      width: w, minWidth: w, height: '100vh', background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column', transition: 'width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s',
      overflow: 'hidden', borderRight: '1px solid var(--sidebar-border)', zIndex: 40, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ height: 60, display: 'flex', alignItems: 'center', padding: sidebarCollapsed ? '0 16px' : '0 20px', gap: 10, borderBottom: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="cpu" size={17} color="#fff" />
        </div>
        {!sidebarCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>MaintenancePro</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap' }}>ERP / CMMS</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(item => {
          const active = currentView === item.id || (currentView === 'client-detail' && item.id === 'clients') || (currentView === 'equipment-detail' && item.id === 'equipment') || (currentView === 'maintenance-create' && item.id === 'maintenance');
          const hasAlert = item.id === 'alerts' && overdueCount > 0;
          return (
            <button key={item.id} onClick={() => navigate(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: sidebarCollapsed ? '9px 0' : '9px 12px', borderRadius: 8,
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.12s', marginBottom: 2,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              position: 'relative',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}}
            >
              <Icon name={item.icon} size={17} color={active ? '#fff' : 'currentColor'} />
              {!sidebarCollapsed && (
                <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>
              )}
              {hasAlert && !sidebarCollapsed && (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{overdueCount}</span>
              )}
              {hasAlert && sidebarCollapsed && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              )}
            </button>
          );
        })}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 4px' }} />

        <button onClick={() => navigate('settings')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: sidebarCollapsed ? '9px 0' : '9px 12px', borderRadius: 8,
          background: currentView === 'settings' ? 'var(--primary)' : 'transparent',
          color: currentView === 'settings' ? '#fff' : 'rgba(255,255,255,0.5)',
          border: 'none', cursor: 'pointer', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          transition: 'all 0.12s',
        }}
        onMouseEnter={e => { if (currentView !== 'settings') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}}
        onMouseLeave={e => { if (currentView !== 'settings') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}}
        >
          <Icon name="settings" size={17} color="currentColor" />
          {!sidebarCollapsed && <span style={{ fontSize: 13.5, fontWeight: 500 }}>Configuración</span>}
        </button>
      </nav>

      {/* Bottom: theme + user */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
        <button onClick={toggleTheme} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: sidebarCollapsed ? '9px 0' : '9px 12px', borderRadius: 8,
          background: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start', marginBottom: 6,
          transition: 'all 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} color="currentColor" />
          {!sidebarCollapsed && <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
        </button>

        {!sidebarCollapsed && currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8 }}>
            <Avatar initials={currentUser.avatar} size={28} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name.split(' ')[0]}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, whiteSpace: 'nowrap' }}>{currentUser.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            ><Icon name="logout" size={15} color="currentColor" /></button>
          </div>
        )}

        <button onClick={() => setSidebarCollapsed(c => !c)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
          padding: '8px 12px', gap: 8, background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.25)', fontSize: 12, transition: 'color 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
        >
          <Icon name={sidebarCollapsed ? 'chevronRight' : 'chevronLeft'} size={14} color="currentColor" />
          {!sidebarCollapsed && <span>Colapsar</span>}
        </button>
      </div>
    </div>
  );
}

function Topbar() {
  const { navigate, notifications, currentUser, currentView, searchQuery, setSearchQuery, clients, equipment, openModal } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  const viewTitles = {
    dashboard: 'Dashboard',
    clients: 'Clientes',
    'client-detail': 'Detalle de Cliente',
    equipment: 'Equipos',
    'equipment-detail': 'Detalle de Equipo',
    maintenance: 'Mantenimientos',
    'maintenance-create': 'Nuevo Mantenimiento',
    inventory: 'Inventario',
    kits: 'Kits de Mantenimiento',
    alerts: 'Alertas',
    traceability: 'Trazabilidad',
    reports: 'Reportes',
    settings: 'Configuración',
    profile: 'Mi Perfil',
  };

  useEffect(() => {
    if (!searchQuery) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const clientResults = clients.filter(c => c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q)).slice(0,3).map(c => ({ type: 'client', label: c.name, sub: c.contact, id: c.id }));
    const equipResults = equipment.filter(e => e.serial.toLowerCase().includes(q) || e.model.toLowerCase().includes(q)).slice(0,3).map(e => ({ type: 'equipment', label: e.model, sub: e.serial, id: e.id }));
    setSearchResults([...clientResults, ...equipResults]);
  }, [searchQuery]);

  return (
    <div style={{
      height: 60, background: 'var(--topbar-bg)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
    }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{viewTitles[currentView] || currentView}</span>

      {/* Global Search */}
      <div style={{ position: 'relative' }} ref={searchRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 12px', width: searchOpen ? 260 : 220, transition: 'width 0.2s' }}>
          <Icon name="search" size={15} color="var(--text-muted)" />
          <input
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)} onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            placeholder="Buscar clientes, equipos, series..."
            style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }}
          />
          {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><Icon name="x" size={13} /></button>}
        </div>
        {searchOpen && searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 10, marginTop: 6, overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)', zIndex: 100,
          }}>
            {searchResults.map((r, i) => (
              <button key={i} onMouseDown={() => { navigate(r.type === 'client' ? 'client-detail' : 'equipment-detail', r.type === 'client' ? { clientId: r.id } : { equipmentId: r.id }); setSearchQuery(''); setSearchOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: r.type === 'client' ? '#2563eb18' : '#059669' + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={r.type === 'client' ? 'clients' : 'equipment'} size={14} color={r.type === 'client' ? '#2563eb' : '#059669'} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.sub} · {r.type === 'client' ? 'Cliente' : 'Equipo'}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Maintenance quick button */}
      <button onClick={() => navigate('maintenance-create')} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
        background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8,
        fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        <Icon name="plus" size={15} color="#fff" />
        Nuevo
      </button>

      {/* Notifications */}
      <button onClick={() => navigate('alerts')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <Icon name="bell" size={18} color="currentColor" />
        {notifications > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid var(--topbar-bg)' }} />}
      </button>

      {/* Profile */}
      <button onClick={() => navigate('profile')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <Avatar initials={currentUser?.avatar || 'US'} size={30} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{currentUser?.name?.split(' ')[0]}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{currentUser?.role === 'admin' ? 'Admin' : 'Técnico'}</div>
        </div>
      </button>
    </div>
  );
}

function MainLayout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        <Topbar />
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, MainLayout });
