
const { useState: useStateSt } = React;

function Reports() {
  const { maintenances, equipment, clients, parts, getEquipmentById, getClientById } = useApp();
  const [activeReport, setActiveReport] = useStateSt('summary');

  const completedMaints = maintenances.filter(m => m.status === 'completed');
  const overdueMaints = maintenances.filter(m => m.status === 'overdue');

  const reports = [
    { id: 'summary', label: 'Resumen general', icon: 'dashboard' },
    { id: 'maintenance', label: 'Mantenimientos', icon: 'maintenance' },
    { id: 'stock', label: 'Inventario', icon: 'inventory' },
    { id: 'client', label: 'Por cliente', icon: 'clients' },
  ];

  const ExportBtn = ({ label, icon }) => (
    <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
      <Icon name={icon} size={14} color="var(--text-muted)" />{label}
    </button>
  );

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
          {reports.map(r => (
            <button key={r.id} onClick={() => setActiveReport(r.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: activeReport === r.id ? 'var(--primary)' : 'transparent',
              color: activeReport === r.id ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
            }}>
              <Icon name={r.icon} size={14} color={activeReport === r.id ? '#fff' : 'var(--text-muted)'} />
              {r.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <ExportToolbar reportType={activeReport} />
      </div>

      {activeReport === 'summary' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total clientes', value: clients.length, sub: `${clients.filter(c=>c.status==='active').length} activos`, color: '#2563eb' },
              { label: 'Total equipos', value: equipment.length, sub: `${equipment.filter(e=>e.status==='operational').length} operativos`, color: '#059669' },
              { label: 'Mantenimientos completados', value: completedMaints.length, sub: 'histórico total', color: '#0284c7' },
              { label: 'Mantenimientos vencidos', value: overdueMaints.length, sub: 'requieren atención', color: '#ef4444' },
            ].map((k,i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.sub}</div>
              </div>
            ))}
          </div>
          {/* Maintenance breakdown by type */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Distribución por tipo de mantenimiento</div>
            {[
              { type: 'preventive-6m', label: 'Preventivo 6 meses', color: '#059669' },
              { type: 'preventive-12m', label: 'Preventivo 12 meses', color: '#0284c7' },
              { type: 'corrective', label: 'Correctivo', color: '#dc2626' },
            ].map(t => {
              const cnt = maintenances.filter(m => m.type === t.type).length;
              const pct = Math.round(cnt / maintenances.length * 100);
              return (
                <div key={t.type} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{cnt} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: t.color, borderRadius: 999, transition: 'width 0.8s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeReport === 'maintenance' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '90px 1.5fr 1fr 120px 100px 80px', background: 'var(--bg)' }}>
            {['Fecha','Equipo','Cliente','Tipo','Estado','Duración'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>
          {maintenances.map((m, idx) => {
            const eq = getEquipmentById(m.equipmentId);
            const cl = getClientById(m.clientId);
            return (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '90px 1.5fr 1fr 120px 100px 80px', padding: '11px 20px', borderBottom: idx < maintenances.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{m.date}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{eq?.model}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{eq?.serial}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{cl?.name}</div>
                <MaintenanceTypeLabel type={m.type} />
                <StatusBadge status={m.status} small />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.duration ? `${m.duration} min` : '—'}</div>
              </div>
            );
          })}
        </div>
      )}

      {activeReport === 'stock' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '130px 1.5fr 1fr 120px 80px', background: 'var(--bg)' }}>
            {['Código','Nombre','Depósito','Stock actual','Estado'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>
          {parts.map((p, idx) => {
            const s = p.stock === 0 ? 'critical' : p.stock <= p.criticalStock ? 'critical' : p.stock <= p.minStock ? 'low' : 'normal';
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '130px 1.5fr 1fr 120px 80px', padding: '11px 20px', borderBottom: idx < parts.length-1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--primary)' }}>{p.code}</div>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.description}</div></div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.depot}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: s === 'critical' ? '#ef4444' : s === 'low' ? '#f59e0b' : 'var(--text)' }}>{p.stock} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>/ {p.minStock} mín</span></div>
                <StatusBadge status={s} small />
              </div>
            );
          })}
        </div>
      )}

      {activeReport === 'client' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {clients.map(cl => {
            const eqs = equipment.filter(e => e.clientId === cl.id);
            const ms = maintenances.filter(m => m.clientId === cl.id);
            return (
              <div key={cl.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 24px', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Icon name="building" size={18} color="var(--primary)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{cl.name}</span>
                    <StatusBadge status={cl.status} small />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                  {[
                    { label: 'Equipos', value: eqs.length, color: 'var(--text)' },
                    { label: 'Operativos', value: eqs.filter(e=>e.status==='operational').length, color: '#059669' },
                    { label: 'Vencidos', value: eqs.filter(e=>e.status==='overdue').length, color: '#ef4444' },
                    { label: 'Total mant.', value: ms.length, color: 'var(--text)' },
                    { label: 'Completados', value: ms.filter(m=>m.status==='completed').length, color: '#059669' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '10px', background: 'var(--bg)', borderRadius: 8 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Settings() {
  const { currentUser, users, navigate } = useApp();
  const [activeTab, setActiveTab] = useStateSt('users');

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 24 }}>
        {[['users','Usuarios'],['roles','Roles y permisos'],['system','Sistema']].map(([id,l]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeTab === id ? 'var(--primary)' : 'transparent', color: activeTab === id ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s' }}>{l}</button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Gestión de usuarios</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Icon name="plus" size={14} color="#fff" /> Agregar usuario
            </button>
          </div>
          {users.map((u, idx) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: idx < users.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <Avatar initials={u.avatar} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email} · {u.dept}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: u.role === 'admin' ? '#2563eb18' : '#05966918', color: u.role === 'admin' ? '#2563eb' : '#059669' }}>
                {u.role === 'admin' ? 'Administrador' : 'Técnico'}
              </span>
              <button style={{ padding: '5px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>Editar</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { role: 'Administrador', desc: 'Acceso total al sistema', perms: ['Gestión de usuarios', 'Configuración del sistema', 'Todos los módulos', 'Exportar reportes', 'Gestión de kits e inventario'] },
            { role: 'Técnico de campo', desc: 'Operaciones de mantenimiento', perms: ['Ver clientes y equipos', 'Crear y actualizar mantenimientos', 'Ver inventario', 'Usar kits asignados', 'Ver alertas propias'] },
          ].map(r => (
            <div key={r.role} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{r.role}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>{r.desc}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {r.perms.map(p => <span key={p} style={{ fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={11} color="#059669" />{p}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'system' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { label: 'Nombre de la empresa', value: 'Servicios Técnicos S.A.' },
              { label: 'Email de notificaciones', value: 'alertas@servtec.com' },
              { label: 'Días de alerta anticipada', value: '30' },
              { label: 'Zona horaria', value: 'America/Buenos_Aires' },
            ].map(f => (
              <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '260px 1fr', alignItems: 'center', gap: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{f.label}</label>
                <input defaultValue={f.value} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
              </div>
            ))}
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button style={{ padding: '9px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Profile() {
  const { currentUser, navigate } = useApp();
  const [tab, setTab] = useStateSt('info');
  if (!currentUser) return null;
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 18 }}>
          <Avatar initials={currentUser.avatar} size={60} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{currentUser.name}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 6, background: currentUser.role === 'admin' ? '#2563eb18' : '#05966918', color: currentUser.role === 'admin' ? '#2563eb' : '#059669' }}>
                {currentUser.role === 'admin' ? 'Administrador' : 'Técnico'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentUser.dept}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          {[['info','Información'],['password','Contraseña'],['prefs','Preferencias']].map(([id,l]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === id ? 'var(--primary)' : 'transparent', color: tab === id ? '#fff' : 'var(--text-secondary)' }}>{l}</button>
          ))}
        </div>

        <div style={{ padding: '24px 28px' }}>
          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelStyle}>Nombre completo</label><input defaultValue={currentUser.name} style={inputStyle} /></div>
                <div><label style={labelStyle}>Departamento</label><input defaultValue={currentUser.dept} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Email</label><input defaultValue={currentUser.email} style={inputStyle} /></div>
              <div><label style={labelStyle}>Teléfono</label><input defaultValue={currentUser.phone} style={inputStyle} /></div>
              <button style={{ padding: '9px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>Guardar cambios</button>
            </div>
          )}
          {tab === 'password' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['Contraseña actual', 'Nueva contraseña', 'Confirmar nueva contraseña'].map(l => (
                <div key={l}><label style={labelStyle}>{l}</label><input type="password" placeholder="••••••••" style={inputStyle} /></div>
              ))}
              <button style={{ padding: '9px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>Cambiar contraseña</button>
            </div>
          )}
          {tab === 'prefs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Notificaciones por email', desc: 'Recibir alertas de mantenimientos vencidos', checked: true },
                { label: 'Alertas de stock', desc: 'Notificar cuando el stock baje del mínimo', checked: true },
                { label: 'Resumen semanal', desc: 'Reporte de actividad cada lunes', checked: false },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.label}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.desc}</div></div>
                  <div style={{ width: 40, height: 22, borderRadius: 999, background: p.checked ? 'var(--primary)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: p.checked ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Reports, Settings, Profile });
