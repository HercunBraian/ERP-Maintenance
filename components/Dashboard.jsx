
function Dashboard() {
  const { kpiData, alerts, maintenances, equipment, clients, navigate, getEquipmentById, getClientById } = useApp();

  const upcomingMaints = maintenances.filter(m => m.status === 'scheduled').slice(0, 5);
  const recentCompleted = maintenances.filter(m => m.status === 'completed').slice(0, 4);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').slice(0, 4);

  const kpis = [
    { label: 'Vencidos', value: kpiData.overdue, color: '#ef4444', bg: '#fef2f2', icon: 'alertTriangle', sub: 'mantenimientos', link: 'alerts' },
    { label: 'Próximos 30 días', value: kpiData.upcoming, color: '#f59e0b', bg: '#fffbeb', icon: 'clock', sub: 'mantenimientos', link: 'alerts' },
    { label: 'Stock crítico', value: kpiData.criticalStock, color: '#8b5cf6', bg: '#f5f3ff', icon: 'inventory', sub: 'repuestos', link: 'inventory' },
    { label: 'En progreso', value: kpiData.inProgress, color: '#2563eb', bg: '#eff6ff', icon: 'loader', sub: 'trabajos', link: 'maintenance' },
    { label: 'Completados', value: kpiData.completedThisMonth, color: '#059669', bg: '#f0fdf4', icon: 'checkCircle', sub: 'este mes', link: 'maintenance' },
    { label: 'Equipos activos', value: equipment.filter(e => e.status === 'operational').length, color: '#0284c7', bg: '#f0f9ff', icon: 'equipment', sub: 'operativos', link: 'equipment' },
  ];

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
        {kpis.map((k, i) => (
          <button key={i} onClick={() => navigate(k.link)} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '18px 18px 16px', textAlign: 'left', cursor: 'pointer',
            transition: 'transform 0.1s, box-shadow 0.1s', boxShadow: 'var(--shadow)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 9, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon name={k.icon} size={18} color={k.color} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.sub}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Upcoming Maintenances */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Mantenimientos programados</span>
            <button onClick={() => navigate('maintenance')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver todos →</button>
          </div>
          {upcomingMaints.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sin mantenimientos programados</div>
          ) : (
            upcomingMaints.map(m => {
              const eq = getEquipmentById(m.equipmentId);
              const cl = getClientById(m.clientId);
              return (
                <button key={m.id} onClick={() => navigate('equipment-detail', { equipmentId: m.equipmentId })} style={{
                  width: '100%', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid var(--border)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="maintenance" size={16} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq?.model || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cl?.name} · {eq?.serial}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <MaintenanceTypeLabel type={m.type} />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{m.date}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Critical Alerts */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Alertas críticas</span>
            <button onClick={() => navigate('alerts')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver todas →</button>
          </div>
          {criticalAlerts.map(a => (
            <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: a.severity === 'critical' ? '#fef2f2' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Icon name="alertTriangle" size={15} color={a.severity === 'critical' ? '#ef4444' : '#f59e0b'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{a.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {a.type === 'overdue' && <span style={{ color: '#ef4444', fontWeight: 600 }}>{a.daysOverdue} días vencido</span>}
                  {a.type === 'upcoming' && <span style={{ color: '#f59e0b', fontWeight: 600 }}>En {a.daysAhead} días</span>}
                  {a.type === 'low-stock' && <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Stock: {a.currentStock}/{a.minStock}</span>}
                </div>
              </div>
              <SeverityBadge severity={a.severity} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Recent Activity */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Actividad reciente</span>
          </div>
          {recentCompleted.map((m, idx) => {
            const eq = getEquipmentById(m.equipmentId);
            const cl = getClientById(m.clientId);
            return (
              <div key={m.id} style={{ padding: '12px 20px', borderBottom: idx < recentCompleted.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>
                    <strong>{m.technicianId === 'U002' ? 'Lucas F.' : m.technicianId === 'U003' ? 'María G.' : 'Diego R.'}</strong>{' '}
                    completó <strong><MaintenanceTypeLabel type={m.type} /></strong> en{' '}
                    <button onClick={() => navigate('equipment-detail', { equipmentId: m.equipmentId })} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 600 }}>{eq?.model}</button>
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{cl?.name} · {m.date} · {m.duration} min</div>
                </div>
                <StatusBadge status="completed" small />
              </div>
            );
          })}
        </div>

        {/* Equipment status summary */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Estado de equipos</div>
          {[
            { status: 'operational', label: 'Operativos', icon: 'checkCircle', color: '#059669' },
            { status: 'alert', label: 'Con alerta', icon: 'alertTriangle', color: '#f59e0b' },
            { status: 'overdue', label: 'Vencidos', icon: 'xCircle', color: '#ef4444' },
            { status: 'maintenance', label: 'En mantenimiento', icon: 'loader', color: '#2563eb' },
          ].map(s => {
            const count = equipment.filter(e => e.status === s.status).length;
            const pct = Math.round(count / equipment.length * 100);
            return (
              <div key={s.status} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon name={s.icon} size={14} color={s.color} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{count}</span>
                </div>
                <div style={{ height: 5, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 999, transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
          <button onClick={() => navigate('equipment')} style={{ width: '100%', padding: '9px 0', marginTop: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Ver todos los equipos
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
