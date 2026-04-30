
const { useState: useStateQR, useEffect: useEffectQR, useRef: useRefQR, useCallback: useCallbackQR } = React;

// ─── QR CODE GENERATOR ────────────────────────────────────────────────────────
function QRCodeCanvas({ value, size = 220, id = 'qr-canvas-main' }) {
  const containerRef = useRefQR(null);
  const [ready, setReady] = useStateQR(false);

  useEffectQR(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (window.QRCode) {
        containerRef.current.innerHTML = '';
        try {
          new window.QRCode(containerRef.current, {
            text: value, width: size, height: size,
            colorDark: '#0f172a', colorLight: '#ffffff',
            correctLevel: window.QRCode.CorrectLevel.H,
          });
          setReady(true);
        } catch(e) {}
      } else {
        setTimeout(tryRender, 150);
      }
    };
    tryRender();
    return () => { cancelled = true; };
  }, [value, size]);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', minWidth: size, minHeight: size }}>
      <div ref={containerRef} id={id} style={{ borderRadius: 8, overflow: 'hidden', lineHeight: 0 }} />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="loader" size={24} color="#94a3b8" />
        </div>
      )}
    </div>
  );
}

// ─── QR MODAL (generator + download) ─────────────────────────────────────────
function QRModal({ equipment, client, onClose }) {
  const canvasRef = useRefQR(null);
  const qrValue = `CMMS:EQUIP:${equipment.serial}`;
  const [copied, setCopied] = useStateQR(false);

  const handleDownload = () => {
    // qrcodejs creates a canvas inside the container div
    const canvas = document.querySelector('#qr-modal-canvas canvas');
    const img = document.querySelector('#qr-modal-canvas img');
    const src = canvas ? canvas.toDataURL('image/png') : (img ? img.src : null);
    if (!src) return;
    const link = document.createElement('a');
    link.download = `QR-${equipment.serial}.png`;
    link.href = src;
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(qrValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: 20, padding: '28px 24px',
        maxWidth: 360, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        border: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>Código QR del equipo</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{equipment.model} · {equipment.brand}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} color="var(--text-muted)" />
          </button>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 16, background: '#fff', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <QRCodeCanvas value={qrValue} size={200} id="qr-modal-canvas" />
          </div>

          {/* Equipment info under QR */}
          <div style={{ width: '100%', background: 'var(--bg)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Serie', value: equipment.serial },
                { label: 'Cliente', value: client?.name || '—' },
                { label: 'Modelo', value: equipment.model },
                { label: 'Estado', value: null, status: equipment.status },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{f.label}</div>
                  {f.status ? <StatusBadge status={f.status} small /> : <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: f.label === 'Serie' ? 'monospace' : 'inherit' }}>{f.value}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* QR value */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <Icon name="tag" size={13} color="var(--text-muted)" />
            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qrValue}</span>
            <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#059669' : 'var(--text-muted)', padding: 0, display: 'flex' }}>
              <Icon name={copied ? 'check' : 'clipboard'} size={14} color="currentColor" />
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
            <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Icon name="download" size={15} color="#fff" /> Descargar PNG
            </button>
            <button onClick={() => { window.print(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Icon name="externalLink" size={15} color="currentColor" /> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── QR SCANNER ───────────────────────────────────────────────────────────────
function QRScanner({ onScan, onClose }) {
  const [status, setStatus] = useStateQR('starting'); // starting | scanning | error | no-camera
  const [errorMsg, setErrorMsg] = useStateQR('');
  const scannerInstanceRef = useRefQR(null);

  useEffectQR(() => {
    let scanner = null;
    const startScan = async () => {
      if (!window.Html5Qrcode) {
        setStatus('error');
        setErrorMsg('Librería de escaneo no disponible.');
        return;
      }
      try {
        scanner = new window.Html5Qrcode('qr-reader');
        scannerInstanceRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
          },
          () => {}
        );
        setStatus('scanning');
      } catch (err) {
        if (err?.message?.includes('Permission')) {
          setStatus('no-camera');
          setErrorMsg('Permiso de cámara denegado. Habilitá el acceso en ajustes.');
        } else {
          setStatus('error');
          setErrorMsg(err?.message || 'Error al iniciar la cámara.');
        }
      }
    };
    startScan();
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#000', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
          <Icon name="chevronLeft" size={16} color="#fff" /> Cancelar
        </button>
        <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 15, fontWeight: 700 }}>Escanear QR de equipo</span>
        <div style={{ width: 80 }} />
      </div>

      {/* Camera view */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div id="qr-reader" style={{ width: '100%', height: '100%', maxWidth: 400 }} />

        {/* Scanning overlay */}
        {status === 'scanning' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            {/* Corner guides */}
            {[
              { top: 'calc(50% - 120px)', left: 'calc(50% - 120px)', borderTop: '3px solid #2563eb', borderLeft: '3px solid #2563eb', borderRadius: '4px 0 0 0' },
              { top: 'calc(50% - 120px)', right: 'calc(50% - 120px)', borderTop: '3px solid #2563eb', borderRight: '3px solid #2563eb', borderRadius: '0 4px 0 0' },
              { bottom: 'calc(50% - 120px)', left: 'calc(50% - 120px)', borderBottom: '3px solid #2563eb', borderLeft: '3px solid #2563eb', borderRadius: '0 0 0 4px' },
              { bottom: 'calc(50% - 120px)', right: 'calc(50% - 120px)', borderBottom: '3px solid #2563eb', borderRight: '3px solid #2563eb', borderRadius: '0 0 4px 0' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 32, height: 32, ...s }} />
            ))}
            {/* Scan line animation */}
            <div style={{
              position: 'absolute', width: 240, height: 2,
              background: 'linear-gradient(to right, transparent, #2563eb, transparent)',
              top: 'calc(50% - 120px)',
              animation: 'scanline 2s ease-in-out infinite',
            }} />
          </div>
        )}

        {/* Error states */}
        {(status === 'error' || status === 'no-camera') && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="xCircle" size={32} color="#ef4444" />
            </div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, textAlign: 'center' }}>
              {status === 'no-camera' ? 'Sin acceso a cámara' : 'Error al iniciar'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' }}>{errorMsg}</div>
            <button onClick={onClose} style={{ marginTop: 8, padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Volver
            </button>
          </div>
        )}

        {status === 'starting' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Icon name="loader" size={32} color="#2563eb" />
            <div style={{ color: '#fff', fontSize: 14 }}>Iniciando cámara...</div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ padding: '16px 20px 32px', background: 'rgba(0,0,0,0.8)', textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
          Apuntá la cámara al código QR del equipo
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
          El escaneo es automático al detectar el código
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(240px); opacity: 0.7; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── EQUIPMENT QUICK VIEW (scan result) ───────────────────────────────────────
function EquipmentQuickView({ serial, onClose, onOpenDetail, onNewOT }) {
  const { equipment, getClientById, getMaintenancesByEquipment, isAuthenticated } = useApp();
  const eq = equipment.find(e => e.serial === serial || e.id === serial);
  const client = eq ? getClientById(eq.clientId) : null;
  const maints = eq ? getMaintenancesByEquipment(eq.id) : [];
  const lastCompleted = maints.find(m => m.status === 'completed');

  const statusConfig = {
    operational: { color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', label: 'Operativo', icon: 'checkCircle' },
    alert: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Con alerta', icon: 'alertTriangle' },
    overdue: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Mantenimiento VENCIDO', icon: 'alertTriangle' },
    maintenance: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'En mantenimiento', icon: 'loader' },
    inactive: { color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', label: 'Inactivo', icon: 'info' },
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: '24px 24px 0 0',
        padding: '8px 0 0', width: '100%', maxWidth: 480,
        boxShadow: '0 -20px 60px rgba(0,0,0,0.3)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' }} />

        {!eq ? (
          <div style={{ padding: '24px 24px 40px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="xCircle" size={28} color="#ef4444" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Equipo no encontrado</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Serie: <code style={{ fontFamily: 'monospace', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{serial}</code></div>
            <button onClick={onClose} style={{ padding: '12px 24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cerrar</button>
          </div>
        ) : (() => {
          const sc = statusConfig[eq.status] || statusConfig.inactive;
          const daysToNext = Math.round((new Date(eq.nextMaintenance) - new Date()) / 86400000);
          return (
            <div style={{ padding: '0 20px 32px' }}>
              {/* Status banner */}
              <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 14, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: sc.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={sc.icon} size={22} color={sc.color} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: sc.color }}>{sc.label}</div>
                  <div style={{ fontSize: 12, color: sc.color + 'cc' }}>
                    {eq.status === 'overdue'
                      ? `Vencido — urgente atención`
                      : eq.status === 'operational'
                      ? daysToNext > 0 ? `Próx. mantenimiento en ${daysToNext} días` : 'Al día'
                      : eq.nextMaintenance}
                  </div>
                </div>
              </div>

              {/* Equipment info */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{eq.model}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{eq.brand} · {eq.type}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Número de serie', value: eq.serial, mono: true },
                    { label: 'Cliente', value: client?.name },
                    { label: 'Ubicación', value: eq.location },
                    { label: 'Últ. mantenimiento', value: lastCompleted?.date || 'Sin registro' },
                  ].map(f => (
                    <div key={f.label} style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: f.mono ? 'monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next maintenance highlight */}
              <div style={{
                background: eq.status === 'overdue' ? '#fef2f2' : daysToNext <= 30 ? '#fffbeb' : 'var(--bg)',
                border: `1px solid ${eq.status === 'overdue' ? '#fecaca' : daysToNext <= 30 ? '#fde68a' : 'var(--border)'}`,
                borderRadius: 12, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <Icon name="calendar" size={18} color={eq.status === 'overdue' ? '#ef4444' : daysToNext <= 30 ? '#f59e0b' : 'var(--text-muted)'} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Próximo mantenimiento</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: eq.status === 'overdue' ? '#ef4444' : 'var(--text)' }}>{eq.nextMaintenance}</div>
                </div>
              </div>

              {/* Actions — full if auth, limited if not */}
              {isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => { onNewOT(eq.id); onClose(); }} style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Icon name="plus" size={18} color="#fff" /> Registrar mantenimiento
                  </button>
                  <button onClick={() => { onOpenDetail(eq.id); onClose(); }} style={{ width: '100%', padding: '13px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Icon name="eye" size={16} color="var(--text-muted)" /> Ver detalle completo
                  </button>
                </div>
              ) : (
                <div style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
                  <Icon name="lock" size={18} color="var(--text-muted)" style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Iniciá sesión para registrar mantenimientos</div>
                  <button style={{ padding: '9px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Iniciar sesión</button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── QR SCAN BUTTON (used in mobile search bar) ───────────────────────────────
function QRScanButton({ onScanResult }) {
  const [scanning, setScanning] = useStateQR(false);
  const [quickView, setQuickView] = useStateQR(null); // serial string

  const handleScan = (text) => {
    setScanning(false);
    // Parse CMMS:EQUIP:{serial} or raw serial
    const match = text.match(/CMMS:EQUIP:(.+)/);
    const serial = match ? match[1] : text.trim();
    setQuickView(serial);
    if (onScanResult) onScanResult(serial);
  };

  return (
    <>
      <button onClick={() => setScanning(true)} style={{
        background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <QRIcon size={16} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>QR</span>
      </button>

      {scanning && <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />}

      {quickView && (
        <EquipmentQuickView
          serial={quickView}
          onClose={() => setQuickView(null)}
          onOpenDetail={(id) => { setQuickView(null); }}
          onNewOT={(id) => { setQuickView(null); }}
        />
      )}
    </>
  );
}

// QR icon SVG (custom, more recognizable)
function QRIcon({ size = 20, color = 'rgba(255,255,255,0.85)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="5" y="5" width="3" height="3" fill={color} stroke="none" />
      <rect x="16" y="5" width="3" height="3" fill={color} stroke="none" />
      <rect x="5" y="16" width="3" height="3" fill={color} stroke="none" />
      <path d="M14 14h2v2h-2zM18 14h3M18 18v3M14 18h2v3M20 18h1v1" />
    </svg>
  );
}

// ─── QR BUTTON for desktop Equipment Detail ───────────────────────────────────
function QRGenerateButton({ equipment, client }) {
  const [open, setOpen] = useStateQR(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px',
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
        color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <QRIcon size={15} color="currentColor" />
        Generar QR
      </button>
      {open && <QRModal equipment={equipment} client={client} onClose={() => setOpen(false)} />}
    </>
  );
}

Object.assign(window, {
  QRCodeCanvas, QRModal, QRScanner, EquipmentQuickView,
  QRScanButton, QRGenerateButton, QRIcon,
});
