
const { useState: useStateEq } = React;

function EquipmentList() {
  const { equipment, clients, navigate, getClientById } = useApp();
  const [search, setSearch] = useState$e('');
  const [statusFilter, setStatusFilter] = useState$e('all');

  const filtered = equipment.filter(e => {
    const q = search.toLowerCase();
    const cl = getClientById(e.clientId);
    const matchSearch = !search || e.serial.toLowerCase().includes(q) || e.model.toLowerCase().includes(q) || e.brand.toLowerCase().includes(q) || cl?.name.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusOptions = ['all','operational','alert','overdue','maintenance'];

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
          <Icon name="search" size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar serie, modelo, cliente..." style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {statusOptions.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: statusFilter === s ? 'var(--primary)' : 'var(--bg-card)',
              color: statusFilter === s ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{{ all:'Todos', operational:'Operativo', alert:'Alerta', overdue:'Vencido', maintenance:'En mant.' }[s]}</button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 100px 120px 110px 40px', gap: 0, padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          {['Serie', 'Modelo / Marca', 'Cliente', 'Estado', 'Próx. mant.', 'Intervalo', ''].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sin equipos encontrados</div>}
        {filtered.map((eq, idx) => {
          const cl = getClientById(eq.clientId);
          const isOverdue = eq.status === 'overdue';
          const daysToNext = Math.round((new Date(eq.nextMaintenance) - new Date()) / 86400000);
          return (
            <button key={eq.id} onClick={() => navigate('equipment-detail', { equipmentId: eq.id })} style={{
              width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 100px 120px 110px 40px',
              padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', alignItems: 'center', gap: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>{eq.serial}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{eq.category}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{eq.model}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{eq.brand}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{cl?.name || '—'}</div>
              <div><StatusBadge status={eq.status} small /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: isOverdue ? '#ef4444' : daysToNext <= 30 ? '#f59e0b' : 'var(--text)' }}>
                  {eq.nextMaintenance}
                </div>
                {isOverdue && <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>VENCIDO</div>}
                {!isOverdue && daysToNext <= 30 && daysToNext > 0 && <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>en {daysToNext}d</div>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{eq.maintenanceInterval === '6m' ? 'Semestral' : 'Anual'}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Icon name="chevronRight" size={16} color="var(--text-muted)" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EquipmentDetail() {
  const { selectedEquipmentId, getEquipmentById, getClientById, getMaintenancesByEquipment, getKitById, getPartById, getUserById, navigate, openModal } = useApp();
  const eq = getEquipmentById(selectedEquipmentId);
  const client = getClientById(eq?.clientId);
  const maints = getMaintenancesByEquipment(selectedEquipmentId);
  const [activeTab, setActiveTab] = useStateEq('timeline');

  if (!eq) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Equipo no encontrado</div>;

  const statusColors = { operational: '#059669', alert: '#f59e0b', overdue: '#ef4444', maintenance: '#2563eb' };

  const timelineItems = maints.map(m => ({
    ...m,
    kit: m.kit ? getKitById(m.kit) : null,
    technician: m.technicianId ? getUserById(m.technicianId) : null,
    partsDetails: m.parts.map(p => ({ ...p, part: getPartById(p.partId) })),
  }));

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <button onClick={() => navigate('equipment')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>
        <Icon name="chevronLeft" size={16} color="var(--primary)" /> Volver a Equipos
      </button>

      {/* Header card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: statusColors[eq.status] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${statusColors[eq.status]}30` }}>
              <Icon name="equipment" size={24} color={statusColors[eq.status]} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{eq.model}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary)12', padding: '2px 8px', borderRadius: 4 }}>{eq.serial}</span>
                <StatusBadge status={eq.status} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{eq.brand} · {eq.type}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <QRGenerateButton equipment={eq} client={client} />
            <button onClick={() => navigate('maintenance-create')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Icon name="plus" size={14} color="#fff" /> Nuevo mantenimiento
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Cliente', value: client?.name, icon: 'building' },
            { label: 'Ubicación', value: eq.location, icon: 'tag' },
            { label: 'Instalado', value: eq.installDate, icon: 'calendar' },
            { label: 'Próx. mantenimiento', value: eq.nextMaintenance, icon: 'clock', highlight: eq.status === 'overdue' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{f.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name={f.icon} size={13} color={f.highlight ? '#ef4444' : 'var(--text-muted)'} />
                <span style={{ fontSize: 13, fontWeight: 600, color: f.highlight ? '#ef4444' : 'var(--text)' }}>{f.value}</span>
              </div>
            </div>
          ))}
        </div>
        {eq.notes && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
            <Icon name="info" size={13} color="#d97706" style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {eq.notes}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['timeline','Timeline'], ['parts','Repuestos usados'], ['services','Servicios']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: activeTab === id ? 'var(--primary)' : 'transparent',
            color: activeTab === id ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {activeTab === 'timeline' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', boxShadow: 'var(--shadow)' }}>
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 15, top: 20, bottom: 20, width: 2, background: 'var(--border)', borderRadius: 1 }} />
            {timelineItems.map((m, idx) => {
              const typeColors = { 'preventive-6m': '#059669', 'preventive-12m': '#0284c7', 'corrective': '#dc2626', 'use-based': '#7c3aed' };
              const tc = typeColors[m.type] || '#64748b';
              const isFirst = idx === 0;
              return (
                <div key={m.id} style={{ display: 'flex', gap: 24, marginBottom: idx < timelineItems.length - 1 ? 24 : 0, position: 'relative' }}>
                  {/* Dot */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: m.status === 'completed' ? tc : m.status === 'overdue' ? '#ef4444' : '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '3px solid var(--bg-card)',
                    boxShadow: `0 0 0 2px ${m.status === 'completed' ? tc : '#2563eb'}`,
                    zIndex: 1,
                  }}>
                    <Icon name={m.status === 'completed' ? 'check' : m.status === 'overdue' ? 'alertTriangle' : 'clock'} size={14} color="#fff" />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <MaintenanceTypeLabel type={m.type} />
                          <StatusBadge status={m.status} small />
                          {isFirst && <span style={{ fontSize: 10, background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>MÁS RECIENTE</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.date}</div>
                        {m.technician && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Técnico: {m.technician.name}</div>}
                      </div>
                      {m.duration && <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}><Icon name="clock" size={12} color="var(--text-muted)" style={{ verticalAlign: 'middle', marginRight: 3 }} />{m.duration} min</div>}
                    </div>
                    {m.kit && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}><strong>Kit:</strong> {m.kit.name}</div>}
                    {m.partsDetails.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        {m.partsDetails.map((p, pi) => (
                          <span key={pi} style={{ fontSize: 11, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', color: 'var(--text-secondary)' }}>
                            {p.part?.name} ×{p.qty}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border)' }}>"{m.notes}"</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'parts' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 100px 120px 80px', gap: 0 }}>
            {['Repuesto', 'Código', 'Último uso', 'Qty total'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>
          {(() => {
            const partMap = {};
            timelineItems.forEach(m => {
              m.partsDetails.forEach(p => {
                if (!partMap[p.partId]) partMap[p.partId] = { part: p.part, qty: 0, lastDate: m.date };
                partMap[p.partId].qty += p.qty;
                if (m.date > partMap[p.partId].lastDate) partMap[p.partId].lastDate = m.date;
              });
            });
            return Object.entries(partMap).map(([pid, data], idx) => (
              <div key={pid} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 80px', padding: '12px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{data.part?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{data.part?.description}</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>{data.part?.code}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{data.lastDate}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{data.qty}</div>
              </div>
            ));
          })()}
        </div>
      )}

      {activeTab === 'services' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, borderBottom: '1px solid var(--border)' }}>
            {[
              { label: 'Mantenimientos totales', value: maints.length },
              { label: 'Preventivos completados', value: maints.filter(m => m.type.startsWith('preventive') && m.status === 'completed').length },
              { label: 'Correctivos', value: maints.filter(m => m.type === 'corrective').length },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Próximos servicios programados</div>
            {[
              { label: `Preventivo ${eq.maintenanceInterval === '6m' ? '6 meses' : '12 meses'}`, date: eq.nextMaintenance, type: eq.maintenanceInterval === '6m' ? 'preventive-6m' : 'preventive-12m' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <Icon name="calendar" size={16} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <MaintenanceTypeLabel type={s.type} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Fecha programada: {s.date}</div>
                </div>
                <button onClick={() => navigate('maintenance-create')} style={{ padding: '6px 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Programar</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// fix useState reference
const useState$e = React.useState;
function Equipment() {
  const { currentView } = useApp();
  return currentView === 'equipment-detail' ? <EquipmentDetail /> : <EquipmentList />;
}

Object.assign(window, { Equipment });
