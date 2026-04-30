
const { useState: useStateMob, useEffect: useEffectMob, useRef: useRefMob } = React;

// ─── MOBILE DETECTION HOOK ────────────────────────────────────────────────────
function useMobile() {
  const [isMobile, setIsMobile] = useStateMob(() => window.innerWidth < 768);
  useEffectMob(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ─── MOBILE HEADER ────────────────────────────────────────────────────────────
function MobileHeader({ title, back, onBack, right }) {
  const { alerts } = useApp();
  const critical = alerts.filter(a => a.severity === 'critical').length;
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--sidebar-bg)', color: '#fff',
      padding: '0 16px', height: 56,
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }}>
      {back && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
          <Icon name="chevronLeft" size={22} color="currentColor" />
        </button>
      )}
      {!back && (
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cpu" size={14} color="#fff" />
        </div>
      )}
      <span style={{ flex: 1, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</span>
      {right && right}
      {!right && !back && critical > 0 && (
        <div style={{ position: 'relative' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>{critical}</div>
        </div>
      )}
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, onNavigate }) {
  const { alerts } = useApp();
  const overdueCount = alerts.filter(a => a.type === 'overdue').length;
  const tabs = [
    { id: 'mob-home', icon: 'dashboard', label: 'Hoy' },
    { id: 'mob-equipment', icon: 'equipment', label: 'Equipos' },
    { id: 'mob-new', icon: 'plus', label: 'Nueva OT', fab: true },
    { id: 'mob-alerts', icon: 'alerts', label: 'Alertas', badge: overdueCount },
    { id: 'mob-profile', icon: 'user', label: 'Yo' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom, 8px)', height: 64,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onNavigate(t.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: t.fab ? 0 : 3, background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, position: 'relative', height: '100%',
        }}>
          {t.fab ? (
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37,99,235,0.45)',
              transform: 'translateY(-10px)',
            }}>
              <Icon name="plus" size={24} color="#fff" />
            </div>
          ) : (
            <>
              <div style={{ position: 'relative' }}>
                <Icon name={t.icon} size={22} color={active === t.id ? 'var(--primary)' : 'var(--text-muted)'} />
                {t.badge > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -6, width: 15, height: 15, borderRadius: '50%', background: '#ef4444', fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge}</span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: active === t.id ? 700 : 500, color: active === t.id ? 'var(--primary)' : 'var(--text-muted)' }}>{t.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── SCREEN: HOY (today's work) ───────────────────────────────────────────────
function MobHome({ onNavigate, setDetailEquipId }) {
  const { maintenances, currentUser, getEquipmentById, getClientById } = useApp();
  const myWork = maintenances.filter(m =>
    m.technicianId === currentUser?.id ||
    m.status === 'scheduled' || m.status === 'in-progress' || m.status === 'overdue'
  ).sort((a, b) => {
    const order = { 'overdue': 0, 'in-progress': 1, 'scheduled': 2, 'completed': 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayWork = myWork.filter(m => m.date === today || m.status === 'in-progress' || m.status === 'overdue').slice(0, 6);
  const upcoming = myWork.filter(m => m.date > today && m.status === 'scheduled').slice(0, 4);

  const statusConfig = {
    overdue: { color: '#ef4444', bg: '#fef2f2', label: 'VENCIDO', dot: '#ef4444' },
    'in-progress': { color: '#f59e0b', bg: '#fffbeb', label: 'EN CURSO', dot: '#f59e0b' },
    scheduled: { color: '#2563eb', bg: '#eff6ff', label: 'PROGRAMADO', dot: '#2563eb' },
    completed: { color: '#059669', bg: '#f0fdf4', label: 'COMPLETADO', dot: '#059669' },
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <MobileHeader title={`Hola, ${currentUser?.name?.split(' ')[0]} 👋`} right={
        <QRScanButton onScanResult={(serial) => {
          const eq = useApp().equipment.find(e => e.serial === serial || e.id === serial);
          if (eq) { setDetailEquipId(eq.id); onNavigate('mob-equip-detail'); }
        }} />
      } />

      {/* Date strip */}
      <div style={{ background: 'var(--primary)', padding: '14px 20px 16px', color: '#fff' }}>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 2 }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Pendientes', value: myWork.filter(m => m.status === 'scheduled' || m.status === 'overdue').length },
            { label: 'En curso', value: myWork.filter(m => m.status === 'in-progress').length },
            { label: 'Vencidos', value: myWork.filter(m => m.status === 'overdue').length },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Today / Priority */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Prioridad hoy
          <button onClick={() => onNavigate('mob-maintenance-list')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver todos</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {todayWork.length === 0 && (
            <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <Icon name="checkCircle" size={28} color="#059669" /><br />Sin trabajos urgentes hoy 🎉
            </div>
          )}
          {todayWork.map(m => {
            const eq = getEquipmentById(m.equipmentId);
            const cl = getClientById(m.clientId);
            const sc = statusConfig[m.status] || statusConfig.scheduled;
            return (
              <button key={m.id} onClick={() => { setDetailEquipId(m.equipmentId); onNavigate('mob-equip-detail'); }} style={{
                width: '100%', background: 'var(--bg-card)', border: `1px solid var(--border)`,
                borderLeft: `4px solid ${sc.dot}`, borderRadius: 14,
                padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                boxShadow: 'var(--shadow)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em' }}>{sc.label}</span>
                  </div>
                  <MaintenanceTypeLabel type={m.type} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{eq?.model || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <Icon name="building" size={11} color="var(--text-muted)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{cl?.name}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg)', padding: '2px 8px', borderRadius: 4 }}>{eq?.serial}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <Icon name="tag" size={10} color="var(--text-muted)" style={{ verticalAlign: 'middle', marginRight: 3 }} />{eq?.location}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Próximos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.map(m => {
                const eq = getEquipmentById(m.equipmentId);
                const cl = getClientById(m.clientId);
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="calendar" size={18} color="var(--primary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{eq?.model}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cl?.name} · {m.date}</div>
                    </div>
                    <MaintenanceTypeLabel type={m.type} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: EQUIPOS ──────────────────────────────────────────────────────────
function MobEquipment({ onNavigate, setDetailEquipId }) {
  const { equipment, getClientById } = useApp();
  const [search, setSearchMobEq] = useStateMob('');
  const inputRef = useRefMob(null);

  const filtered = equipment.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    const cl = getClientById(e.clientId);
    return e.serial.toLowerCase().includes(q) || e.model.toLowerCase().includes(q) || cl?.name.toLowerCase().includes(q);
  });

  const statusDot = { operational: '#059669', alert: '#f59e0b', overdue: '#ef4444', maintenance: '#2563eb', inactive: '#94a3b8' };

  return (
    <div style={{ paddingBottom: 80 }}>
      <MobileHeader title="Equipos" right={
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4, display: 'flex' }}>
          <Icon name="filter" size={18} color="currentColor" />
        </button>
      } />

      {/* Search */}
      <div style={{ padding: '12px 16px', background: 'var(--sidebar-bg)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Icon name="search" size={16} color="rgba(255,255,255,0.5)" />
          <input
            ref={inputRef}
            value={search} onChange={e => setSearchMobEq(e.target.value)}
            placeholder="Serie, modelo o cliente..."
            style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: 14, outline: 'none', flex: 1 }}
          />
          {/* QR scan button */}
          <QRScanButton onScanResult={(serial) => { setSearchMobEq(serial); }} />
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!search && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            {equipment.length} equipos registrados
          </div>
        )}
        {search && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            <Icon name="search" size={28} color="var(--border)" /><br />Sin resultados para "{search}"
          </div>
        )}
        {filtered.map(eq => {
          const cl = getClientById(eq.clientId);
          const dot = statusDot[eq.status] || '#94a3b8';
          return (
            <button key={eq.id} onClick={() => { setDetailEquipId(eq.id); onNavigate('mob-equip-detail'); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 14, cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow)',
            }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: dot + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${dot}30` }}>
                <Icon name="equipment" size={20} color={dot} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{eq.model}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{cl?.name}</div>
                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary)12', padding: '1px 7px', borderRadius: 4 }}>{eq.serial}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <StatusBadge status={eq.status} small />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{eq.nextMaintenance}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCREEN: EQUIP DETAIL (mobile) ───────────────────────────────────────────
function MobEquipDetail({ equipId, onBack, onNewOT }) {
  const { getEquipmentById, getClientById, getMaintenancesByEquipment, getKitById, getPartById, getUserById } = useApp();
  const eq = getEquipmentById(equipId);
  const cl = getClientById(eq?.clientId);
  const maints = getMaintenancesByEquipment(equipId);
  const [tab, setTab] = useStateMob('info');
  if (!eq) return null;

  const statusColor = { operational: '#059669', alert: '#f59e0b', overdue: '#ef4444', maintenance: '#2563eb' };
  const sc = statusColor[eq.status] || '#94a3b8';

  return (
    <div style={{ paddingBottom: 80 }}>
      <MobileHeader title={eq.model} back onBack={onBack} right={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <QRGenerateButton equipment={eq} client={cl} />
          <button onClick={onNewOT} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            + OT
          </button>
        </div>
      } />

      {/* Hero card */}
      <div style={{ background: `linear-gradient(135deg, ${sc}18, ${sc}05)`, borderBottom: `3px solid ${sc}`, padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: sc + '20', border: `2px solid ${sc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="equipment" size={24} color={sc} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{eq.brand}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{eq.model}</div>
            <div style={{ marginTop: 5, display: 'flex', gap: 6 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary)15', padding: '2px 8px', borderRadius: 5 }}>{eq.serial}</span>
              <StatusBadge status={eq.status} small />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Cliente', value: cl?.name, icon: 'building' },
            { label: 'Ubicación', value: eq.location, icon: 'tag' },
            { label: 'Instalado', value: eq.installDate, icon: 'calendar' },
            { label: 'Próx. mant.', value: eq.nextMaintenance, icon: 'clock', highlight: eq.status === 'overdue' },
          ].map(f => (
            <div key={f.label} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: f.highlight ? '#ef4444' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</div>
            </div>
          ))}
        </div>
        {eq.notes && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#92400e' }}>
            <Icon name="info" size={11} color="#d97706" style={{ verticalAlign: 'middle', marginRight: 4 }} />{eq.notes}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: '0 16px' }}>
        {[['info','Resumen'],['timeline','Historial'],['parts','Repuestos']].map(([id,l]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === id ? 700 : 500,
            color: tab === id ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: 'Total mant.', value: maints.length, color: 'var(--text)' },
                { label: 'Completados', value: maints.filter(m=>m.status==='completed').length, color: '#059669' },
                { label: 'Correctivos', value: maints.filter(m=>m.type==='corrective').length, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={onNewOT} style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              <Icon name="plus" size={18} color="#fff" /> Crear nueva OT para este equipo
            </button>
          </div>
        )}

        {tab === 'timeline' && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
            {maints.map((m, idx) => {
              const typeColors = { 'preventive-6m': '#059669', 'preventive-12m': '#0284c7', 'corrective': '#dc2626', 'use-based': '#7c3aed' };
              const tc = typeColors[m.type] || '#64748b';
              const tech = m.technicianId ? getUserById(m.technicianId) : null;
              return (
                <div key={m.id} style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.status === 'completed' ? tc : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 0 3px var(--bg-card)`, zIndex: 1, marginTop: 4 }}>
                    <Icon name={m.status === 'completed' ? 'check' : 'alertTriangle'} size={11} color="#fff" />
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${tc}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.date}</span>
                      <MaintenanceTypeLabel type={m.type} />
                    </div>
                    {tech && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>👤 {tech.name}</div>}
                    {m.notes && <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{m.notes}"</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'parts' && (
          <div>
            {(() => {
              const partMap = {};
              maints.forEach(m => m.parts.forEach(p => {
                const part = getPartById(p.partId);
                if (!partMap[p.partId]) partMap[p.partId] = { part, qty: 0, lastDate: m.date };
                partMap[p.partId].qty += p.qty;
              }));
              return Object.entries(partMap).map(([pid, data]) => (
                <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8 }}>
                  <Icon name="package" size={16} color="var(--text-muted)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{data.part?.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{data.part?.code}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>×{data.qty}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>usados</div>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: NUEVA OT (mobile simplified) ─────────────────────────────────────
function MobNewOT({ presetEquipId, onBack, onDone }) {
  const { equipment, kits, MOCK_PARTS, addMaintenance, getEquipmentById, getClientById } = useApp();
  const [step, setStepMob] = useStateMob(1);
  const [form, setFormMob] = useStateMob({
    equipmentId: presetEquipId || '',
    type: 'preventive-6m',
    date: new Date().toISOString().slice(0, 10),
    technicianId: 'U002',
    kit: '',
    parts: [],
    notes: '',
  });
  const [saved, setSavedMob] = useStateMob(false);

  const selectedEq = form.equipmentId ? getEquipmentById(form.equipmentId) : null;
  const cl = selectedEq ? getClientById(selectedEq.clientId) : null;
  const suggestedKits = kits.filter(k => selectedEq && (k.equipmentType === selectedEq.type || k.frequency === (form.type === 'preventive-12m' ? '12m' : '6m')));

  const update = (k, v) => setFormMob(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    addMaintenance(form);
    setSavedMob(true);
    setTimeout(onDone, 1500);
  };

  const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box', WebkitAppearance: 'none' };

  if (saved) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 16, padding: 32 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="checkCircle" size={36} color="#059669" />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', textAlign: 'center' }}>¡OT creada!</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Volviendo...</div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 100 }}>
      <MobileHeader title="Nueva Orden de Trabajo" back onBack={onBack} />

      {/* Steps */}
      <div style={{ display: 'flex', padding: '14px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', gap: 8 }}>
        {[1,2].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= s ? 'var(--primary)' : 'var(--bg)', border: `2px solid ${step >= s ? 'var(--primary)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: step >= s ? '#fff' : 'var(--text-muted)', flexShrink: 0 }}>
              {step > s ? <Icon name="check" size={12} color="#fff" /> : s}
            </div>
            <span style={{ fontSize: 12, fontWeight: step === s ? 700 : 500, color: step === s ? 'var(--text)' : 'var(--text-muted)' }}>
              {s === 1 ? 'Equipo y tipo' : 'Kit y detalles'}
            </span>
            {s < 2 && <div style={{ flex: 1, height: 2, background: step > s ? 'var(--primary)' : 'var(--border)', borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 16px' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>Equipo *</label>
              <select value={form.equipmentId} onChange={e => update('equipmentId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">— Seleccionar equipo —</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.serial} — {eq.model}</option>)}
              </select>
              {selectedEq && (
                <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--primary)08', border: '1px solid var(--primary)25', borderRadius: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{selectedEq.brand} {selectedEq.model}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cl?.name} · {selectedEq.location}</div>
                  <div style={{ marginTop: 6 }}><StatusBadge status={selectedEq.status} small /></div>
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>Tipo de mantenimiento *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { id: 'preventive-6m', label: 'Preventivo 6M', emoji: '🔧', color: '#059669' },
                  { id: 'preventive-12m', label: 'Preventivo 12M', emoji: '📅', color: '#0284c7' },
                  { id: 'corrective', label: 'Correctivo (urgente)', emoji: '⚠️', color: '#dc2626' },
                  { id: 'use-based', label: 'Por uso / horas', emoji: '⏱️', color: '#7c3aed' },
                ].map(t => (
                  <button key={t.id} onClick={() => update('type', t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    border: `2px solid ${form.type === t.id ? t.color : 'var(--border)'}`,
                    background: form.type === t.id ? t.color + '10' : 'var(--bg-card)',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 20 }}>{t.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: form.type === t.id ? 700 : 500, color: form.type === t.id ? t.color : 'var(--text)' }}>{t.label}</span>
                    {form.type === t.id && <Icon name="checkCircle" size={18} color={t.color} style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>Fecha</label>
              <input type="date" value={form.date} onChange={e => update('date', e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Kit suggestion */}
            {suggestedKits.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>Kit sugerido 🎯</label>
                {suggestedKits.slice(0, 2).map(k => (
                  <button key={k.id} onClick={() => { update('kit', k.id); update('parts', k.parts.map(p => ({ ...p, name: MOCK_PARTS.find(pt => pt.id === p.partId)?.name }))); }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 8,
                    border: `2px solid ${form.kit === k.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.kit === k.id ? 'var(--primary)08' : 'var(--bg-card)',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="package" size={20} color="var(--primary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{k.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.parts.length} repuestos · ~{k.estimatedTime} min</div>
                    </div>
                    {form.kit === k.id && <Icon name="checkCircle" size={22} color="var(--primary)" />}
                  </button>
                ))}
              </div>
            )}

            {/* Parts list */}
            {form.parts.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>Repuestos ({form.parts.length})</label>
                {form.parts.map(p => (
                  <div key={p.partId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 6 }}>
                    <Icon name="package" size={14} color="var(--text-muted)" />
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{p.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => update('parts', form.parts.map(fp => fp.partId === p.partId ? { ...fp, qty: Math.max(1, fp.qty - 1) } : fp))} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>−</button>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', minWidth: 20, textAlign: 'center' }}>{p.qty}</span>
                      <button onClick={() => update('parts', form.parts.map(fp => fp.partId === p.partId ? { ...fp, qty: fp.qty + 1 } : fp))} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>+</button>
                    </div>
                    <button onClick={() => update('parts', form.parts.filter(fp => fp.partId !== p.partId))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icon name="x" size={14} color="#ef4444" /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>Observaciones</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Describa el trabajo, hallazgos, novedades..." rows={4} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
            </div>

            {/* Photo attachment */}
            <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-card)' }}>
              <Icon name="upload" size={24} color="var(--text-muted)" />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>Adjuntar fotos o planillas</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Tocá para abrir cámara o galería</div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom action */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        {step > 1 && (
          <button onClick={() => setStepMob(s => s - 1)} style={{ flex: 1, padding: '14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            ← Atrás
          </button>
        )}
        {step < 2 ? (
          <button onClick={() => setStepMob(s => s + 1)} disabled={!form.equipmentId} style={{ flex: 2, padding: '14px', background: form.equipmentId ? 'var(--primary)' : 'var(--border)', color: form.equipmentId ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: form.equipmentId ? 'pointer' : 'not-allowed' }}>
            Continuar →
          </button>
        ) : (
          <button onClick={handleSave} style={{ flex: 2, padding: '14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="check" size={18} color="#fff" /> Guardar OT
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: ALERTAS MOBILE ───────────────────────────────────────────────────
function MobAlerts({ onNavigate, setDetailEquipId }) {
  const { alerts, getEquipmentById, getClientById } = useApp();
  const sorted = [...alerts].sort((a, b) => {
    const ord = { critical: 0, warning: 1, info: 2 };
    return (ord[a.severity] ?? 9) - (ord[b.severity] ?? 9);
  });

  return (
    <div style={{ paddingBottom: 80 }}>
      <MobileHeader title="Alertas" />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(a => {
          const eq = a.entityType === 'equipment' ? getEquipmentById(a.entityId) : null;
          const cl = a.clientId ? getClientById(a.clientId) : null;
          const colors = { critical: '#ef4444', warning: '#f59e0b', info: '#2563eb' };
          const c = colors[a.severity] || '#64748b';
          return (
            <div key={a.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `4px solid ${c}`, borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: c + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="alertTriangle" size={16} color={c} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>{a.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {cl && `${cl.name} · `}
                    {a.type === 'overdue' && <span style={{ color: '#ef4444', fontWeight: 700 }}>{a.daysOverdue} días vencido</span>}
                    {a.type === 'upcoming' && <span style={{ color: '#f59e0b', fontWeight: 700 }}>En {a.daysAhead} días</span>}
                    {a.type === 'low-stock' && <span style={{ color: '#8b5cf6', fontWeight: 700 }}>Stock: {a.currentStock}/{a.minStock}</span>}
                  </div>
                </div>
                <SeverityBadge severity={a.severity} />
              </div>
              {eq && (
                <button onClick={() => { setDetailEquipId(eq.id); onNavigate('mob-equip-detail'); }} style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="equipment" size={14} color="var(--primary)" /> Ver equipo
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCREEN: PERFIL MOBILE ────────────────────────────────────────────────────
function MobProfile() {
  const { currentUser, logout, theme, toggleTheme } = useApp();
  if (!currentUser) return null;
  return (
    <div style={{ paddingBottom: 80 }}>
      <MobileHeader title="Mi perfil" />
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Avatar card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, margin: '0 auto 14px' }}>{currentUser.avatar}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{currentUser.name}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 6, background: currentUser.role === 'admin' ? '#2563eb18' : '#05966918', color: currentUser.role === 'admin' ? '#2563eb' : '#059669' }}>
              {currentUser.role === 'admin' ? 'Administrador' : 'Técnico'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{currentUser.email}</div>
        </div>

        {/* Quick actions */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          {[
            { label: 'Modo ' + (theme === 'dark' ? 'claro' : 'oscuro'), icon: theme === 'dark' ? 'sun' : 'moon', action: toggleTheme, right: null },
            { label: 'Cambiar contraseña', icon: 'lock', action: () => {}, right: <Icon name="chevronRight" size={16} color="var(--text-muted)" /> },
            { label: 'Notificaciones', icon: 'bell', action: () => {}, right: <Icon name="chevronRight" size={16} color="var(--text-muted)" /> },
          ].map((item, i, arr) => (
            <button key={item.label} onClick={item.action} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={item.icon} size={17} color="var(--text-secondary)" />
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.label}</span>
              {item.right}
            </button>
          ))}
        </div>

        <button onClick={logout} style={{ width: '100%', padding: '15px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, color: '#ef4444', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon name="logout" size={18} color="#ef4444" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─── MOBILE APP SHELL ─────────────────────────────────────────────────────────
function MobileApp() {
  const [screen, setScreen] = useStateMob('mob-home');
  const [detailEquipId, setDetailEquipId] = useStateMob(null);
  const [presetEquipId, setPresetEquipId] = useStateMob(null);
  const scrollRef = useRefMob(null);

  const navigate = (s, opts = {}) => {
    setScreen(s);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const openNewOT = (equipId = null) => {
    setPresetEquipId(equipId);
    setScreen('mob-new-ot');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {screen === 'mob-home' && <MobHome onNavigate={navigate} setDetailEquipId={setDetailEquipId} />}
        {screen === 'mob-equipment' && <MobEquipment onNavigate={navigate} setDetailEquipId={setDetailEquipId} />}
        {screen === 'mob-equip-detail' && <MobEquipDetail equipId={detailEquipId} onBack={() => navigate(screen === 'mob-equip-detail' ? 'mob-equipment' : 'mob-home')} onNewOT={() => openNewOT(detailEquipId)} />}
        {screen === 'mob-new-ot' && <MobNewOT presetEquipId={presetEquipId} onBack={() => navigate('mob-home')} onDone={() => navigate('mob-home')} />}
        {screen === 'mob-maintenance-list' && (
          <div style={{ paddingBottom: 80 }}>
            <MobileHeader title="Mis trabajos" back onBack={() => navigate('mob-home')} />
            <div style={{ padding: 16 }}>
              <Maintenance />
            </div>
          </div>
        )}
        {screen === 'mob-alerts' && <MobAlerts onNavigate={navigate} setDetailEquipId={setDetailEquipId} />}
        {screen === 'mob-profile' && <MobProfile />}
      </div>

      {!['mob-new-ot', 'mob-equip-detail', 'mob-maintenance-list'].includes(screen) && (
        <BottomNav
          active={screen}
          onNavigate={(s) => {
            if (s === 'mob-new') { openNewOT(null); return; }
            navigate(s);
          }}
        />
      )}
      {screen === 'mob-equip-detail' && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 60 }}>
          <button onClick={() => openNewOT(detailEquipId)} style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,99,235,0.45)' }}>
            <Icon name="plus" size={24} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MobileApp, useMobile });
