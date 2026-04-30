
const { useState: useStateInv } = React;

function Inventory() {
  const { parts } = useApp();
  const [search, setSearch] = useStateInv('');
  const [filter, setFilter] = useStateInv('all');

  const getStockStatus = (p) => {
    if (p.stock === 0) return 'critical';
    if (p.stock <= p.criticalStock) return 'critical';
    if (p.stock <= p.minStock) return 'low';
    return 'normal';
  };

  const filtered = parts.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const s = getStockStatus(p);
    const matchFilter = filter === 'all' || s === filter;
    return matchSearch && matchFilter;
  });

  const counts = { all: parts.length, critical: parts.filter(p => getStockStatus(p) === 'critical').length, low: parts.filter(p => getStockStatus(p) === 'low').length, normal: parts.filter(p => getStockStatus(p) === 'normal').length };

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total repuestos', value: counts.all, color: '#2563eb', icon: 'package' },
          { label: 'Stock crítico', value: counts.critical, color: '#ef4444', icon: 'alertTriangle' },
          { label: 'Stock bajo', value: counts.low, color: '#f59e0b', icon: 'info' },
          { label: 'Stock normal', value: counts.normal, color: '#059669', icon: 'checkCircle' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Icon name={k.icon} size={18} color={k.color} />
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{k.value}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
          <Icon name="search" size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar repuesto, código..." style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }} />
        </div>
        {Object.entries(counts).map(([s, cnt]) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: filter === s ? 'var(--primary)' : 'var(--bg-card)',
            color: filter === s ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{{ all:'Todos', critical:'Crítico', low:'Bajo', normal:'Normal' }[s]} ({cnt})</button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 100px 160px 80px', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          {['Código', 'Nombre', 'Depósito', 'Estado', 'Stock / Mín / Crít.', 'Precio'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>
        {filtered.map((p, idx) => {
          const s = getStockStatus(p);
          const pct = Math.min(100, (p.stock / (p.minStock * 2)) * 100);
          return (
            <div key={p.id} style={{
              display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 100px 160px 80px',
              padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
              background: s === 'critical' ? '#fef2f205' : 'none',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{p.code}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.description}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.depot}</div>
              <div><StatusBadge status={s} small /></div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: s === 'critical' ? '#ef4444' : s === 'low' ? '#f59e0b' : 'var(--text)' }}>{p.stock}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {p.minStock} mín / {p.criticalStock} crít</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden', width: 120 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s === 'critical' ? '#ef4444' : s === 'low' ? '#f59e0b' : '#059669', borderRadius: 999 }} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>${p.price.toLocaleString('es-AR')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Kits() {
  const { kits, MOCK_PARTS } = useApp();
  const [selectedKit, setSelectedKit] = useStateInv(null);

  return (
    <div style={{ padding: '28px 28px 40px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
      {/* Kit list */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Kits disponibles</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{kits.length} kits configurados</div>
        </div>
        {kits.map(k => (
          <button key={k.id} onClick={() => setSelectedKit(k)} style={{
            width: '100%', padding: '14px 20px', borderBottom: '1px solid var(--border)',
            background: selectedKit?.id === k.id ? 'var(--primary)08' : 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left',
            borderLeft: selectedKit?.id === k.id ? '3px solid var(--primary)' : '3px solid transparent',
          }}
          onMouseEnter={e => { if (selectedKit?.id !== k.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { if (selectedKit?.id !== k.id) e.currentTarget.style.background = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="package" size={15} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{k.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 10, background: '#2563eb18', color: '#2563eb', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{k.frequency === '6m' ? '6 meses' : '12 meses'}</span>
                  <span style={{ fontSize: 10, background: 'var(--bg)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4 }}>{k.parts.length} repuestos</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Kit detail */}
      {selectedKit ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{selectedKit.name}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 12, background: '#2563eb18', color: '#2563eb', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>Frecuencia: {selectedKit.frequency}</span>
              <span style={{ fontSize: 12, background: 'var(--bg)', color: 'var(--text-secondary)', padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>{selectedKit.brand}</span>
              <span style={{ fontSize: 12, background: 'var(--bg)', color: 'var(--text-secondary)', padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>{selectedKit.equipmentType}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20, padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: 'Repuestos', value: selectedKit.parts.length },
              { label: 'Tiempo estimado', value: `${selectedKit.estimatedTime} min` },
              { label: 'Costo aprox.', value: `$${selectedKit.price.toLocaleString('es-AR')}` },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Repuestos incluidos</div>
          {selectedKit.parts.map((kp, i) => {
            const part = MOCK_PARTS.find(p => p.id === kp.partId);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 }}>
                <Icon name="package" size={14} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{part?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{part?.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>×{kp.qty}</div>
                  <div style={{ fontSize: 11, color: part?.stock >= kp.qty ? '#059669' : '#ef4444', fontWeight: 600 }}>Stock: {part?.stock}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)', padding: 40 }}>
          <Icon name="package" size={40} color="var(--text-muted)" />
          <div style={{ fontSize: 14 }}>Seleccioná un kit para ver el detalle</div>
        </div>
      )}
    </div>
  );
}

function Alerts() {
  const { alerts, getEquipmentById, getClientById, navigate } = useApp();
  const overdueAlerts = alerts.filter(a => a.type === 'overdue');
  const upcomingAlerts = alerts.filter(a => a.type === 'upcoming');
  const stockAlerts = alerts.filter(a => a.type === 'low-stock');

  const Section = ({ title, items, icon, color }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon name={icon} size={16} color={color} />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
        <span style={{ background: color + '20', color, borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 8px' }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          <Icon name="checkCircle" size={16} color="#059669" style={{ verticalAlign: 'middle', marginRight: 8 }} />Sin alertas de este tipo
        </div>
      ) : items.map(a => {
        const eq = a.entityType === 'equipment' ? getEquipmentById(a.entityId) : null;
        const cl = a.clientId ? getClientById(a.clientId) : null;
        return (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
            background: 'var(--bg-card)', border: `1px solid ${color}30`,
            borderLeft: `4px solid ${color}`, borderRadius: 10, marginBottom: 8,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={17} color={color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{a.message}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {cl && <span>{cl.name} · </span>}
                {a.type === 'overdue' && <span style={{ color, fontWeight: 700 }}>{a.daysOverdue} días vencido</span>}
                {a.type === 'upcoming' && <span style={{ color: '#f59e0b', fontWeight: 700 }}>En {a.daysAhead} días ({a.date})</span>}
                {a.type === 'low-stock' && <span style={{ color, fontWeight: 700 }}>Stock actual: {a.currentStock} / Mínimo: {a.minStock}</span>}
              </div>
            </div>
            <SeverityBadge severity={a.severity} />
            {eq && (
              <button onClick={() => navigate('equipment-detail', { equipmentId: eq.id })} style={{ padding: '6px 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Ver equipo
              </button>
            )}
            {a.type === 'low-stock' && (
              <button onClick={() => navigate('inventory')} style={{ padding: '6px 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Ver stock
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Mantenimientos vencidos', value: overdueAlerts.length, color: '#ef4444', icon: 'alertTriangle' },
          { label: 'Próximos (30 días)', value: upcomingAlerts.length, color: '#f59e0b', icon: 'clock' },
          { label: 'Stock crítico/bajo', value: stockAlerts.length, color: '#8b5cf6', icon: 'inventory' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', border: `1px solid ${k.color}30`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: k.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={k.icon} size={20} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>
      <Section title="Mantenimientos vencidos" items={overdueAlerts} icon="alertTriangle" color="#ef4444" />
      <Section title="Próximos mantenimientos" items={upcomingAlerts} icon="clock" color="#f59e0b" />
      <Section title="Stock bajo / crítico" items={stockAlerts} icon="inventory" color="#8b5cf6" />
    </div>
  );
}

Object.assign(window, { Inventory, Kits, Alerts });
