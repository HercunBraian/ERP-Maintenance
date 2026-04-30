
const { useState: useStateTr } = React;

function Traceability() {
  const { equipment, clients, maintenances, getEquipmentById, getClientById, getMaintenancesByEquipment, getMaintenancesByClient, getPartById, getUserById, getKitById, navigate } = useApp();
  const [mode, setMode] = useStateTr('equipment'); // equipment | client
  const [selectedId, setSelectedId] = useStateTr('');

  const selectedEquipment = mode === 'equipment' ? getEquipmentById(selectedId) : null;
  const selectedClient = mode === 'client' ? getClientById(selectedId) : null;

  const eqMaints = selectedEquipment ? getMaintenancesByEquipment(selectedId) : [];
  const clEquipment = selectedClient ? equipment.filter(e => e.clientId === selectedId) : [];
  const clMaints = selectedClient ? getMaintenancesByClient(selectedId) : [];

  const typeColors = { 'preventive-6m': '#059669', 'preventive-12m': '#0284c7', 'corrective': '#dc2626', 'use-based': '#7c3aed' };

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      {/* Mode toggle + selector */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Vista por</div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
            {[['equipment','Equipo'],['client','Cliente']].map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); setSelectedId(''); }} style={{
                padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: mode === m ? 'var(--primary)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, maxWidth: 400 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            {mode === 'equipment' ? 'Seleccionar equipo' : 'Seleccionar cliente'}
          </div>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">— {mode === 'equipment' ? 'Elegir equipo...' : 'Elegir cliente...'} —</option>
            {mode === 'equipment'
              ? equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.serial} — {eq.model} ({getClientById(eq.clientId)?.name})</option>)
              : clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)
            }
          </select>
        </div>
      </div>

      {/* Equipment traceability */}
      {mode === 'equipment' && selectedEquipment && (
        <div>
          {/* Equipment header */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="equipment" size={22} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{selectedEquipment.model}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary)12', padding: '2px 8px', borderRadius: 4 }}>{selectedEquipment.serial}</span>
                  <StatusBadge status={selectedEquipment.status} small />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{getClientById(selectedEquipment.clientId)?.name}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,80px)', gap: 16, textAlign: 'center' }}>
              {[
                { label: 'Mantenimientos', value: eqMaints.length },
                { label: 'Preventivos', value: eqMaints.filter(m => m.type.startsWith('preventive')).length },
                { label: 'Correctivos', value: eqMaints.filter(m => m.type === 'corrective').length },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full timeline */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Historial completo</div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
              {eqMaints.map((m, idx) => {
                const tc = typeColors[m.type] || '#64748b';
                const tech = m.technicianId ? getUserById(m.technicianId) : null;
                const kit = m.kit ? getKitById(m.kit) : null;
                const partsUsed = m.parts.map(p => ({ ...p, part: getPartById(p.partId) }));
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 20, marginBottom: idx < eqMaints.length - 1 ? 20 : 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: m.status === 'completed' ? tc : m.status === 'overdue' ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 3px var(--bg-card), 0 0 0 5px ${tc}40`, zIndex: 1 }}>
                      <Icon name={m.status === 'completed' ? 'check' : m.status === 'overdue' ? 'alertTriangle' : 'clock'} size={13} color="#fff" />
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', borderLeft: `3px solid ${tc}` }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{m.date}</span>
                        <MaintenanceTypeLabel type={m.type} />
                        <StatusBadge status={m.status} small />
                        {m.duration && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}><Icon name="clock" size={11} color="var(--text-muted)" style={{ verticalAlign: 'middle', marginRight: 3 }} />{m.duration} min</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: m.notes ? 10 : 0 }}>
                        {tech && <div><span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Técnico </span><span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{tech.name}</span></div>}
                        {kit && <div><span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Kit </span><span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{kit.name}</span></div>}
                        {partsUsed.length > 0 && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Repuestos utilizados</span>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {partsUsed.map((p, pi) => <span key={pi} style={{ fontSize: 11, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px', color: 'var(--text-secondary)' }}>{p.part?.name} ×{p.qty}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                      {m.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', paddingTop: 8, borderTop: '1px solid var(--border)' }}>"{m.notes}"</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Client traceability */}
      {mode === 'client' && selectedClient && (
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="building" size={22} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{selectedClient.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedClient.contact} · {selectedClient.email}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'Equipos', value: clEquipment.length },
                { label: 'Total mantenimientos', value: clMaints.length },
                { label: 'Completados', value: clMaints.filter(m => m.status === 'completed').length },
                { label: 'Pendientes/Vencidos', value: clMaints.filter(m => m.status === 'overdue' || m.status === 'scheduled').length },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment list with mini timelines */}
          {clEquipment.map(eq => {
            const eqM = getMaintenancesByEquipment(eq.id);
            return (
              <div key={eq.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Icon name="equipment" size={16} color="var(--primary)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{eq.model}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--primary)', background: 'var(--primary)12', padding: '1px 7px', borderRadius: 4 }}>{eq.serial}</span>
                    <StatusBadge status={eq.status} small />
                  </div>
                  <button onClick={() => { setMode('equipment'); setSelectedId(eq.id); }} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver timeline →</button>
                </div>
                <div style={{ padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {eqM.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin historial de mantenimientos</span>
                  ) : eqM.map((m, i) => {
                    const tc = typeColors[m.type] || '#64748b';
                    return (
                      <div key={i} style={{ flexShrink: 0, padding: '8px 12px', background: tc + '10', border: `1px solid ${tc}30`, borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: tc, textTransform: 'uppercase' }}>{m.type === 'preventive-6m' ? '6M' : m.type === 'preventive-12m' ? '12M' : m.type === 'corrective' ? 'CORR.' : 'USO'}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{m.date}</div>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.status === 'completed' ? '#059669' : m.status === 'overdue' ? '#ef4444' : '#f59e0b', margin: '4px auto 0' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!selectedId && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', gap: 12 }}>
          <Icon name="traceability" size={48} color="var(--border)" />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Seleccioná un {mode === 'equipment' ? 'equipo' : 'cliente'} para ver su trazabilidad</div>
          <div style={{ fontSize: 13 }}>Historial completo de mantenimientos, repuestos y técnicos</div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Traceability });
