
function App() {
  const { isAuthenticated, currentView } = useApp();
  const isMobile = useMobile();

  if (!isAuthenticated) return <AuthScreen />;

  if (isMobile) return <MobileApp />;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':        return <Dashboard />;
      case 'clients':
      case 'client-detail':    return <Clients />;
      case 'equipment':
      case 'equipment-detail': return <Equipment />;
      case 'maintenance':
      case 'maintenance-create': return <Maintenance />;
      case 'inventory':        return <Inventory />;
      case 'kits':             return <Kits />;
      case 'alerts':           return <Alerts />;
      case 'traceability':     return <Traceability />;
      case 'reports':          return <Reports />;
      case 'settings':         return <Settings />;
      case 'profile':          return <Profile />;
      default:                 return <Dashboard />;
    }
  };

  return (
    <MainLayout>
      {renderView()}
    </MainLayout>
  );
}

function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);
