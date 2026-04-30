import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { MobileLayout } from './components/mobile/MobileLayout';
import { useIsMobile } from './hooks/useIsMobile';
import { AuthScreen } from './pages/AuthScreen';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { ClienteDetail } from './pages/ClienteDetail';
import { Equipos } from './pages/Equipos';
import { EquipoDetail } from './pages/EquipoDetail';
import { Mantenimientos } from './pages/Mantenimientos';
import { Inventario } from './pages/Inventario';
import { Kits } from './pages/Kits';
import { Trazabilidad } from './pages/Trazabilidad';
import { Alertas } from './pages/Alertas';
import { Reportes } from './pages/Reportes';
import { PublicScan } from './pages/PublicScan';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { MobHome } from './pages/mobile/MobHome';
import { MobEquipos } from './pages/mobile/MobEquipos';
import { MobPerfil } from './pages/mobile/MobPerfil';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-fg-subtle">Cargando…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Placeholder({ name }: { name: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-fg mb-2">{name}</h1>
      <p className="text-fg-muted">Próximamente.</p>
    </div>
  );
}

/**
 * Authenticated routes — same paths render different components depending on
 * viewport. Mobile gets simplified, touch-first views; desktop gets the full
 * sidebar app. Detail pages (cliente/:id, equipo/:id) are shared because the
 * existing ones already work fine on small screens.
 */
function AppRoutes() {
  const isMobile = useIsMobile();
  return (
    <Route
      element={
        <RequireAuth>
          {isMobile ? <MobileLayout /> : <Layout />}
        </RequireAuth>
      }
    >
      <Route index element={<Navigate to="/dashboard" replace />} />

      {/* Mobile-specific overrides for the bottom-nav targets */}
      <Route path="/dashboard" element={isMobile ? <MobHome />    : <Dashboard />} />
      <Route path="/equipos"   element={isMobile ? <MobEquipos /> : <Equipos />} />
      <Route path="/perfil"    element={isMobile ? <MobPerfil />  : <Navigate to="/profile" replace />} />

      {/* Shared routes — same component for both layouts */}
      <Route path="/clientes"       element={<Clientes />} />
      <Route path="/clientes/:id"   element={<ClienteDetail />} />
      <Route path="/equipos/:id"    element={<EquipoDetail />} />
      <Route path="/mantenimientos" element={<Mantenimientos />} />
      <Route path="/inventario"     element={<Inventario />} />
      <Route path="/kits"           element={<Kits />} />
      <Route path="/alertas"        element={<Alertas />} />
      <Route path="/trazabilidad"   element={<Trazabilidad />} />
      <Route path="/reportes"       element={<Reportes />} />
      <Route path="/settings"       element={<Settings />} />
      <Route path="/profile"        element={isMobile ? <MobPerfil /> : <Profile />} />
      <Route path="*"               element={<Placeholder name="No encontrado" />} />
    </Route>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC — no RequireAuth wrapper */}
            <Route path="/scan/:token" element={<PublicScan />} />
            <Route path="/login"       element={<AuthScreen />} />

            {/* Authenticated tree (mobile/desktop layout switch happens inside) */}
            {AppRoutes()}
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
