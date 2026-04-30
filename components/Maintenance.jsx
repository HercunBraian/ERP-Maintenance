
const { useState: useStateMn, useEffect: useEffectMn } = React;

function MaintenanceList() {
  const { maintenances, getEquipmentById, getClientById, navigate } = useApp();
  const [filter, setFilterMn] = useStateMn('all');
  const [search, setSearchMn] = useStateMn('');

  const filtered = maintenances.filter(m => {
    const eq = getEquipmentById(m.equipmentId);
    const cl = getClientById(m.clientId);
    const q = search.toLowerCase();
    const matchSearch = !search || eq?.model.toLowerCase().includes(q) || eq?.serial.toLowerCase().includes(q) || cl?.name.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || m.status === filter;
    return matchSearch && matchFilter;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const statCounts = {
    all: maintenances.length,
    scheduled: maintenances.filter(m => m.status === 'scheduled').length,
    'in-progress': maintenances.filter(m => m.status === 'in-progress').length,
    completed: maintenances.filter(m => m.status === 'completed').length,
    overdue: maintenances.filter(m => m.status === 'overdue').length,
  };

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
          <Icon name="search" size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearchMn(e.target.value)} placeholder="Buscar por equipo, serie, cliente..." style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%' }} />
        </div>
        <button onClick={() => navigate('maintenance-create')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Icon name="plus" size={15} color="#fff" /> Nuevo mantenimiento
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(statCounts).map(([s, cnt]) => (
          <button key={s} onClick={() => setFilterMn(s)} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: filter === s ? 'var(--primary)' : 'var(--bg-card)',
            color: filter === s ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {{ all:'Todos', scheduled:'Programados', 'in-progress':'En progreso', completed:'Completados', overdue:'Vencidos' }[s]}
            <span style={{ background: filter === s ? 'rgba(255,255,255,0.25)' : 'var(--bg)', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 7px', color: filter === s ? '#fff' : 'var(--text-muted)' }}>{cnt}</span>
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1.5fr 1.2fr 120px 110px 100px 32px', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          {['Fecha', 'Equipo', 'Cliente', 'Tipo', 'Estado', 'Técnico', ''].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Sin resultados</div>}
        {filtered.map((m, idx) => {
          const eq = getEquipmentById(m.equipmentId);
          const cl = getClientById(m.clientId);
          const { getUserById } = useApp();
          const tech = m.technicianId ? getUserById(m.technicianId) : null;
          return (
            <button key={m.id} onClick={() => navigate('equipment-detail', { equipmentId: m.equipmentId })} style={{
              width: '100%', display: 'grid', gridTemplateColumns: '90px 1.5fr 1.2fr 120px 110px 100px 32px',
              padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{m.date}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{eq?.model || '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{eq?.serial}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{cl?.name}</div>
              <MaintenanceTypeLabel type={m.type} />
              <StatusBadge status={m.status} small />
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tech ? tech.name.split(' ')[0] : <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}</div>
              <Icon name="chevronRight" size={15} color="var(--text-muted)" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MaintenanceCreate() {
  const { equipment, clients, kits, MOCK_PARTS, addMaintenance, navigate, getClientById, getEquipmentById } = useApp();
  const [step, setStep] = useStateMn(1);
  const [form, setForm] = useStateMn({
    equipmentId: '', clientId: '', type: 'preventive-6m', date: new Date().toISOString().slice(0,10),
    technicianId: 'U002', kit: '', parts: [], notes: '', attachments: [],
  });
  const [saved, setSaved] = useStateMn(false);

  const selectedEq = form.equipmentId ? getEquipmentById(form.equipmentId) : null;
  const suggestedKits = kits.filter(k => selectedEq && (k.equipmentType === selectedEq.type || k.frequency === (form.type === 'preventive-12m' ? '12m' : '6m')));

  const updateForm = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addPart = (partId) => {
    if (form.parts.find(p => p.partId === partId)) return;
    const part = MOCK_PARTS.find(p => p.id === partId);
    updateForm('parts', [...form.parts, { partId, qty: 1, name: part?.name, code: part?.code }]);
  };
  const removePart = (partId) => updateForm('parts', form.parts.filter(p => p.partId !== partId));
  const updatePartQty = (partId, qty) => updateForm('parts', form.parts.map(p => p.partId === partId ? { ...p, qty: parseInt(qty) || 1 } : p));

  const handleSave = () => {
    addMaintenance({ ...form, id: undefined });
    setSaved(true);
    setTimeout(() => navigate('maintenance'), 1500);
  };

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 };

  if (saved) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="checkCircle" size={32} color="#059669" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>¡Mantenimiento creado!</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Redirigiendo...</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 860, margin: '0 auto' }}>
      <button onClick={() => navigate('maintenance')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 24, padding: 0 }}>
        <Icon name="chevronLeft" size={16} color="var(--primary)" /> Volver
      </button>

      {/* Steps indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
        {[1,2,3].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= s ? 'var(--primary)' : 'var(--bg-card)',
                border: `2px solid ${step >= s ? 'var(--primary)' : 'var(--border)'}`,
                fontSize: 13, fontWeight: 700, color: step >= s ? '#fff' : 'var(--text-muted)',
              }}>{step > s ? <Icon name="check" size={14} color="#fff" /> : s}</div>
              <span style={{ fontSize: 13, fontWeight: step === s ? 700 : 500, color: step === s ? 'var(--text)' : 'var(--text-muted)' }}>
                {['Equipo y tipo', 'Kit y repuestos', 'Revisión y guardar'][i]}
              </span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > s ? 'var(--primary)' : 'var(--border)', margin: '0 12px', maxWidth: 60 }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, boxShadow: 'var(--shadow)' }}>
        {/* Step 1 */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>Selección de equipo y tipo de servicio</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Equipo *</label>
                <select value={form.equipmentId} onChange={e => { updateForm('equipmentId', e.target.value); updateForm('clientId', equipment.find(eq => eq.id === e.target.value)?.clientId || ''); }} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— Seleccionar equipo —</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.serial} — {eq.model} ({getClientById(eq.clientId)?.name})</option>
                  ))}
                </select>
                {selectedEq && (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedEq.brand} {selectedEq.model}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Ubicación: {selectedEq.location}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Últ. mantenimiento: {selectedEq.lastMaintenance}</div>
                    <div style={{ marginTop: 4 }}><StatusBadge status={selectedEq.status} small /></div>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Tipo de mantenimiento *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'preventive-6m', label: 'Preventivo 6 meses', desc: 'Semestral programado', color: '#059669' },
                    { id: 'preventive-12m', label: 'Preventivo 12 meses', desc: 'Anual programado', color: '#0284c7' },
                    { id: 'corrective', label: 'Correctivo', desc: 'Falla o emergencia', color: '#dc2626' },
                    { id: 'use-based', label: 'Por uso', desc: 'Basado en horas de trabajo', color: '#7c3aed' },
                  ].map(t => (
                    <button key={t.id} onClick={() => updateForm('type', t.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${form.type === t.id ? t.color : 'var(--border)'}`,
                      background: form.type === t.id ? t.color + '10' : 'var(--bg)',
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: form.type === t.id ? t.color : 'var(--border)', flexShrink: 0 }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: form.type === t.id ? t.color : 'var(--text)' }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle}>Fecha programada *</label>
                <input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Técnico asignado</label>
                <select value={form.technicianId} onChange={e => updateForm('technicianId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— Sin asignar —</option>
                  <option value="U002">Lucas Fernández</option>
                  <option value="U003">María González</option>
                  <option value="U004">Diego Ramírez</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>Kit sugerido y repuestos</div>
            {suggestedKits.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Kits sugeridos para este equipo</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {suggestedKits.map(k => (
                    <button key={k.id} onClick={() => { updateForm('kit', k.id); updateForm('parts', k.parts.map(p => ({ ...p, name: MOCK_PARTS.find(pt => pt.id === p.partId)?.name, code: MOCK_PARTS.find(pt => pt.id === p.partId)?.code }))); }} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${form.kit === k.id ? 'var(--primary)' : 'var(--border)'}`,
                      background: form.kit === k.id ? 'var(--primary)08' : 'var(--bg)',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="package" size={18} color="var(--primary)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{k.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.parts.length} repuestos · ~{k.estimatedTime} min · ${k.price.toLocaleString('es-AR')}</div>
                      </div>
                      {form.kit === k.id && <Icon name="checkCircle" size={20} color="var(--primary)" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Repuestos ({form.parts.length})</label>
              {form.parts.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {form.parts.map(p => (
                    <div key={p.partId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6 }}>
                      <Icon name="package" size={14} color="var(--text-muted)" />
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.code}</span>
                      <input type="number" min={1} value={p.qty} onChange={e => updatePartQty(p.partId, e.target.value)} style={{ width: 52, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-card)', color: 'var(--text)', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                      <button onClick={() => removePart(p.partId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}><Icon name="x" size={14} color="#ef4444" /></button>
                    </div>
                  ))}
                </div>
              )}
              <select onChange={e => { if (e.target.value) { addPart(e.target.value); e.target.value = ''; } }} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">+ Agregar repuesto manualmente...</option>
                {MOCK_PARTS.filter(p => !form.parts.find(fp => fp.partId === p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name} (Stock: {p.stock})</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Observaciones</label>
              <textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} placeholder="Describa el trabajo a realizar, hallazgos previos, precauciones..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Adjuntos</label>
              <div style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                <Icon name="upload" size={20} color="var(--text-muted)" />
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Arrastrá planillas, fotos, reportes...</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>PDF, JPG, PNG — máx. 10MB</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>Revisión final</div>
            {selectedEq && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Equipo</div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{selectedEq.model}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{selectedEq.serial}</div></div>
                  <div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Tipo</div><MaintenanceTypeLabel type={form.type} /></div>
                  <div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Fecha</div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{form.date}</div></div>
                </div>
              </div>
            )}
            {form.parts.length > 0 && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Repuestos a utilizar</div>
                {form.parts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text)', padding: '4px 0', borderBottom: i < form.parts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span>{p.name}</span><span style={{ fontWeight: 600 }}>×{p.qty}</span>
                  </div>
                ))}
              </div>
            )}
            {form.notes && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{form.notes}"</div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('maintenance')} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {step === 1 ? 'Cancelar' : '← Atrás'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !form.equipmentId} style={{ padding: '10px 24px', background: form.equipmentId || step > 1 ? 'var(--primary)' : 'var(--border)', color: form.equipmentId || step > 1 ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: form.equipmentId || step > 1 ? 'pointer' : 'not-allowed' }}>
              Continuar →
            </button>
          ) : (
            <button onClick={handleSave} style={{ padding: '10px 28px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={16} color="#fff" /> Guardar mantenimiento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Maintenance() {
  const { currentView } = useApp();
  return currentView === 'maintenance-create' ? <MaintenanceCreate /> : <MaintenanceList />;
}

Object.assign(window, { Maintenance });
