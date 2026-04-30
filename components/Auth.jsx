
const { useState } = React;

function AuthScreen() {
  const { login } = useApp();
  const [view, setView] = useState('login'); // login | register | forgot
  const [email, setEmail] = useState('admin@cmms.com');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Completá todos los campos'); return; }
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 600));
    const result = login(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 800));
    setSuccess('Si el email existe, recibirás instrucciones en breve.');
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid var(--border)', background: 'var(--bg-input)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 };
  const btnPrimary = {
    width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
    background: loading ? 'var(--primary-muted)' : 'var(--primary)',
    color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s', letterSpacing: '0.01em',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: 'Inter, sans-serif',
    }}>
      {/* Left panel */}
      <div style={{
        display: 'none', width: 420, minHeight: '100vh',
        background: 'var(--sidebar-bg)',
        padding: '48px 40px', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }} className="auth-left">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="wrench" size={18} color="#fff" />
            </div>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>MaintenancePro</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
            Gestión de mantenimiento industrial profesional
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7 }}>
            Control completo de preventivos, correctivos, trazabilidad e inventario desde un solo lugar.
          </p>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          © 2025 MaintenancePro — ERP/CMMS v2.4
        </div>
        {/* Decorative */}
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'var(--primary)', opacity: 0.08 }} />
        <div style={{ position: 'absolute', top: 120, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'var(--primary)', opacity: 0.05 }} />
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="cpu" size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>MaintenancePro</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>ERP / CMMS Industrial</div>
            </div>
          </div>

          {view === 'login' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>Iniciar sesión</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>
                Accedé a tu panel de mantenimiento
              </p>

              {/* Demo hint */}
              <div style={{ background: 'var(--primary)18', border: '1px solid var(--primary)40', borderRadius: 8, padding: '10px 14px', marginBottom: 24, fontSize: 12, color: 'var(--primary)' }}>
                <strong>Demo:</strong> admin@cmms.com / demo — o lucas@cmms.com / demo
              </div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Correo electrónico</label>
                  <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={labelStyle}>Contraseña</label>
                    <button type="button" onClick={() => { setView('forgot'); setError(''); }} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                    <Icon name="alertTriangle" size={15} color="#dc2626" />
                    {error}
                  </div>
                )}

                <button type="submit" style={btnPrimary} disabled={loading}>
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
                ¿No tenés cuenta?{' '}
                <button onClick={() => { setView('register'); setError(''); }} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  Registrarse
                </button>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>Crear cuenta</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>Completá tus datos para comenzar</p>
              <form onSubmit={(e) => { e.preventDefault(); setSuccess('Cuenta creada. Esperá aprobación del administrador.'); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                  <div><label style={labelStyle}>Nombre</label><input style={inputStyle} placeholder="Juan" /></div>
                  <div><label style={labelStyle}>Apellido</label><input style={inputStyle} placeholder="García" /></div>
                </div>
                <div style={{ marginBottom: 18 }}><label style={labelStyle}>Email</label><input style={inputStyle} type="email" placeholder="juan@empresa.com" /></div>
                <div style={{ marginBottom: 18 }}><label style={labelStyle}>Contraseña</label><input style={inputStyle} type="password" placeholder="Mínimo 8 caracteres" /></div>
                <div style={{ marginBottom: 24 }}><label style={labelStyle}>Confirmar contraseña</label><input style={inputStyle} type="password" placeholder="Repetí la contraseña" /></div>
                {success ? (
                  <div style={{ padding: '12px 14px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontSize: 13, marginBottom: 16 }}>{success}</div>
                ) : (
                  <button type="submit" style={btnPrimary}>Crear cuenta</button>
                )}
              </form>
              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
                ¿Ya tenés cuenta?{' '}
                <button onClick={() => { setView('login'); setError(''); setSuccess(''); }} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  Iniciar sesión
                </button>
              </div>
            </div>
          )}

          {view === 'forgot' && (
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>Recuperar contraseña</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>Ingresá tu email para recibir instrucciones</p>
              {!success ? (
                <form onSubmit={handleForgot}>
                  <div style={{ marginBottom: 24 }}><label style={labelStyle}>Email</label><input style={inputStyle} type="email" placeholder="tu@empresa.com" /></div>
                  <button type="submit" style={btnPrimary} disabled={loading}>{loading ? 'Enviando...' : 'Enviar instrucciones'}</button>
                </form>
              ) : (
                <div style={{ padding: '14px 16px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontSize: 13, lineHeight: 1.6 }}>
                  <Icon name="checkCircle" size={16} color="#059669" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  {success}
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button onClick={() => { setView('login'); setSuccess(''); }} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  ← Volver al login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuthScreen });
