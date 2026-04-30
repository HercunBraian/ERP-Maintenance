
const { useState: useState$c } = React;

function ClientsList() {
  const { clients, equipment, navigate } = useApp();
  const [search, setSearch] = useState$c('');
  const [filter, setFilter] = useState$c('all');

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
          <Icon name="search" size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, contacto, email..." style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }} />
        </div>
        {['all', 'active', 'inactive'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: filter === f ? 'var(--primary)' : 'var(--bg-card)',
            color: filter === f ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{{ all: 'Todos', active: 'Activos', inactive: 'Inactivos' }[f]}</button>
        ))}
        <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filtered.length} clientes</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(c => {
          const eqs = equipment.filter(e => e.clientId === c.id);
          const overdueEqs = eqs.filter(e => e.status === 'overdue').length;
          return (
            <button key={c.id} onClick={() => navigate('client-detail', { clientId: c.id })} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '20px', textAlign: 'left', cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s', boxShadow: 'var(--shadow)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary)18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="building" size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{c.name}</div>
                    <StatusBadge status={c.status} small />
                  </div>
                </div>
                {overdueEqs > 0 && (
                  <span style={{ background: '#fef2f2', color: '#ef4444', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                    {overdueEqs} vencido{overdueEqs > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                <Icon name="user" size={12} color="var(--text-muted)" style={{ verticalAlign: 'middle', marginRight: 5 }} />
                {c.contact}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Icon name="mail" size={12} color="var(--text-muted)" style={{ verticalAlign: 'middle', marginRight: 5 }} />
                {c.email}
              </div>
              <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{eqs.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Equipos</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: eqs.filter(e => e.status === 'operational').length > 0 ? '#059669' : 'var(--text)' }}>{eqs.filter(e => e.status === 'operational').length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Operativos</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: overdueEqs > 0 ? '#ef4444' : 'var(--text)' }}>{overdueEqs}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vencidos</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', alignSelf: 'flex-end' }}>Desde {c.since.slice(0,7)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClientDetail() {
  const { selectedClientId, getClientById, getEquipmentByClient, getMaintenancesByClient, navigate } = useApp();
  const client = getClientById(selectedClientId);
  const eqs = getEquipmentByClient(selectedClientId);
  const maints = getMaintenancesByClient(selectedClientId);

  if (!client) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Cliente no encontrado</div>;

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <button onClick={() => navigate('clients')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>
        <Icon name="chevronLeft" size={16} color="var(--primary)" /> Volver a Clientes
      </button>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px', marginBottom: 20, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--primary)18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="building" size={26} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{client.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={client.status} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cliente desde {client.since}</span>
              </div>
            </div>
          </div>
          <button style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => navigate('maintenance-create')}>
            <Icon name="plus" size={14} color="#fff" /> Nuevo mantenimiento
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Contacto', value: client.contact, icon: 'user' },
            { label: 'Email', value: client.email, icon: 'mail' },
            { label: 'Teléfono', value: client.phone, icon: 'bell' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Equipos */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Equipos ({eqs.length})</span>
          </div>
          {eqs.map(eq => (
            <button key={eq.id} onClick={() => navigate('equipment-detail', { equipmentId: eq.id })} style={{
              width: '100%', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: '1px solid var(--border)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="equipment" size={16} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{eq.model}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{eq.serial} · {eq.type}</div>
              </div>
              <StatusBadge status={eq.status} small />
            </button>
          ))}
        </div>

        {/* Historial resumido */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Historial de mantenimientos ({maints.length})</span>
          </div>
          {maints.slice(0, 6).map(m => (
            <div key={m.id} style={{ padding: '11px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.status === 'completed' ? '#059669' : m.status === 'overdue' ? '#ef4444' : '#2563eb', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{m.date}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{useApp().getEquipmentById(m.equipmentId)?.model}</div>
              </div>
              <MaintenanceTypeLabel type={m.type} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Clients() {
  const { currentView } = useApp();
  return currentView === 'client-detail' ? <ClientDetail /> : <ClientsList />;
}

Object.assign(window, { Clients });
