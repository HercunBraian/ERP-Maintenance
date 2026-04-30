
const { createContext, useContext, useState, useCallback } = React;

const AppContext = createContext(null);

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_USERS = [
  { id: 'U001', name: 'Admin Sistema', email: 'admin@cmms.com', role: 'admin', avatar: 'AS', phone: '+54 11 4000-0001', dept: 'Administración' },
  { id: 'U002', name: 'Lucas Fernández', email: 'lucas@cmms.com', role: 'technician', avatar: 'LF', phone: '+54 11 4000-0002', dept: 'Técnicos de campo' },
  { id: 'U003', name: 'María González', email: 'maria@cmms.com', role: 'technician', avatar: 'MG', phone: '+54 11 4000-0003', dept: 'Técnicos de campo' },
  { id: 'U004', name: 'Diego Ramírez', email: 'diego@cmms.com', role: 'technician', avatar: 'DR', phone: '+54 11 4000-0004', dept: 'Técnicos de campo' },
];

const MOCK_CLIENTS = [
  { id: 'CL001', name: 'Industrias Ferrox S.A.', address: 'Av. Industrial 1234, Buenos Aires', phone: '+54 11 4567-8901', email: 'mantenimiento@ferrox.com', contact: 'Ing. Carlos Mendoza', type: 'industrial', status: 'active', since: '2021-03-15', equipmentCount: 6 },
  { id: 'CL002', name: 'Frigoríficos del Sur S.R.L.', address: 'Ruta 8 km 45, La Plata', phone: '+54 221 456-7890', email: 'operaciones@frigosur.com', contact: 'Lic. Ana Romero', type: 'food', status: 'active', since: '2020-07-01', equipmentCount: 4 },
  { id: 'CL003', name: 'Cementos Andes Corp.', address: 'Parque Industrial Zona Norte', phone: '+54 351 234-5678', email: 'planta@cementosandes.com', contact: 'Ing. Roberto Silva', type: 'construction', status: 'active', since: '2019-11-20', equipmentCount: 8 },
  { id: 'CL004', name: 'Laboratorios Biopharma', address: 'Av. Corrientes 5678, CABA', phone: '+54 11 4222-3333', email: 'facilities@biopharma.com', contact: 'Dra. Laura Castro', type: 'pharma', status: 'active', since: '2022-01-10', equipmentCount: 3 },
  { id: 'CL005', name: 'Textil Norteña S.A.', address: 'Zona Franca Industrial, Tucumán', phone: '+54 381 555-6677', email: 'mantenimiento@textiln.com', contact: 'Sr. Fabio Torres', type: 'textile', status: 'inactive', since: '2018-05-12', equipmentCount: 5 },
  { id: 'CL006', name: 'Plásticos Modernos S.A.', address: 'Av. Constituyentes 8900, GBA', phone: '+54 11 4111-2222', email: 'planta@plastimod.com', contact: 'Ing. Sergio Ruiz', type: 'industrial', status: 'active', since: '2023-02-20', equipmentCount: 2 },
];

const MOCK_EQUIPMENT = [
  { id: 'EQ001', serial: 'FX-COMP-001', model: 'Atlas Copco GA90', brand: 'Atlas Copco', type: 'compresor', category: 'Neumática', clientId: 'CL001', status: 'operational', installDate: '2021-04-10', lastMaintenance: '2024-10-15', nextMaintenance: '2025-04-15', maintenanceInterval: '6m', location: 'Sala de máquinas 1', notes: 'Revisión de válvula pendiente' },
  { id: 'EQ002', serial: 'FX-BOMB-002', model: 'Grundfos CR32-4', brand: 'Grundfos', type: 'bomba', category: 'Hidráulica', clientId: 'CL001', status: 'alert', installDate: '2021-05-20', lastMaintenance: '2024-08-20', nextMaintenance: '2025-02-20', maintenanceInterval: '6m', location: 'Sala de bombeo', notes: '' },
  { id: 'EQ003', serial: 'FS-EVAP-001', model: 'Bohn LET200H', brand: 'Bohn', type: 'evaporador', category: 'Refrigeración', clientId: 'CL002', status: 'operational', installDate: '2020-08-01', lastMaintenance: '2025-02-01', nextMaintenance: '2025-08-01', maintenanceInterval: '6m', location: 'Cámara Fría A', notes: '' },
  { id: 'EQ004', serial: 'FS-COND-002', model: 'Tecumseh CAJ9513T', brand: 'Tecumseh', type: 'condensadora', category: 'Refrigeración', clientId: 'CL002', status: 'overdue', installDate: '2020-08-01', lastMaintenance: '2024-07-15', nextMaintenance: '2025-01-15', maintenanceInterval: '6m', location: 'Azotea', notes: 'VENCIDO — requiere atención urgente' },
  { id: 'EQ005', serial: 'CA-TRI-001', model: 'WEG W22 200HP', brand: 'WEG', type: 'motor', category: 'Eléctrica', clientId: 'CL003', status: 'maintenance', installDate: '2019-12-01', lastMaintenance: '2025-01-10', nextMaintenance: '2025-07-10', maintenanceInterval: '6m', location: 'Línea de producción 3', notes: 'En mantenimiento correctivo' },
  { id: 'EQ006', serial: 'CA-COMP-002', model: 'Ingersoll Rand R110', brand: 'Ingersoll Rand', type: 'compresor', category: 'Neumática', clientId: 'CL003', status: 'operational', installDate: '2020-03-15', lastMaintenance: '2024-09-15', nextMaintenance: '2025-03-15', maintenanceInterval: '6m', location: 'Sala de compresores', notes: '' },
  { id: 'EQ007', serial: 'BP-LAM-001', model: 'LaminAire LA-500', brand: 'Bioair', type: 'cabina_flujo_laminar', category: 'Laboratorio', clientId: 'CL004', status: 'operational', installDate: '2022-02-01', lastMaintenance: '2025-02-01', nextMaintenance: '2025-08-01', maintenanceInterval: '6m', location: 'Lab. Estéril B', notes: 'Filtros HEPA cambiados en último servicio' },
  { id: 'EQ008', serial: 'FX-HVAC-003', model: 'Carrier 30XA-162', brand: 'Carrier', type: 'chiller', category: 'HVAC', clientId: 'CL001', status: 'operational', installDate: '2022-06-01', lastMaintenance: '2024-12-01', nextMaintenance: '2025-12-01', maintenanceInterval: '12m', location: 'Azotea Sector B', notes: '' },
];

const MOCK_MAINTENANCES = [
  { id: 'MN001', equipmentId: 'EQ001', clientId: 'CL001', type: 'preventive-6m', date: '2025-04-15', status: 'scheduled', technicianId: 'U002', kit: 'KT001', parts: [{partId: 'PT001', qty: 2}, {partId: 'PT003', qty: 1}], notes: 'Preventivo semestral programado', duration: null },
  { id: 'MN002', equipmentId: 'EQ001', clientId: 'CL001', type: 'preventive-6m', date: '2024-10-15', status: 'completed', technicianId: 'U002', kit: 'KT001', parts: [{partId: 'PT001', qty: 2}, {partId: 'PT003', qty: 1}], notes: 'Sin novedades. Equipo en buen estado.', duration: 180 },
  { id: 'MN003', equipmentId: 'EQ001', clientId: 'CL001', type: 'preventive-6m', date: '2024-04-15', status: 'completed', technicianId: 'U003', kit: 'KT001', parts: [{partId: 'PT001', qty: 2}, {partId: 'PT003', qty: 1}, {partId: 'PT005', qty: 1}], notes: 'Reemplazo adicional filtro separador.', duration: 200 },
  { id: 'MN004', equipmentId: 'EQ001', clientId: 'CL001', type: 'corrective', date: '2023-12-05', status: 'completed', technicianId: 'U004', kit: null, parts: [{partId: 'PT007', qty: 1}], notes: 'Reparación urgente válvula de descarga. Ruido anormal detectado.', duration: 240 },
  { id: 'MN005', equipmentId: 'EQ002', clientId: 'CL001', type: 'preventive-6m', date: '2025-02-20', status: 'overdue', technicianId: null, kit: 'KT002', parts: [], notes: '', duration: null },
  { id: 'MN006', equipmentId: 'EQ004', clientId: 'CL002', type: 'preventive-6m', date: '2025-01-15', status: 'overdue', technicianId: null, kit: 'KT003', parts: [], notes: '', duration: null },
  { id: 'MN007', equipmentId: 'EQ005', clientId: 'CL003', type: 'corrective', date: '2025-01-10', status: 'in-progress', technicianId: 'U002', kit: null, parts: [{partId: 'PT010', qty: 1}], notes: 'Falla en bobinado. Extracción y reparación en taller.', duration: null },
  { id: 'MN008', equipmentId: 'EQ003', clientId: 'CL002', type: 'preventive-6m', date: '2025-02-01', status: 'completed', technicianId: 'U003', kit: 'KT003', parts: [{partId: 'PT008', qty: 4}], notes: 'Limpieza profunda aletas. Presión correcta.', duration: 150 },
  { id: 'MN009', equipmentId: 'EQ008', clientId: 'CL001', type: 'preventive-12m', date: '2024-12-01', status: 'completed', technicianId: 'U002', kit: 'KT004', parts: [{partId: 'PT001', qty: 4}, {partId: 'PT009', qty: 2}], notes: 'Anual completado. Carga refrigerante correcta.', duration: 360 },
];

const MOCK_PARTS = [
  { id: 'PT001', code: 'FLT-AIRE-001', name: 'Filtro de aire compresor', description: 'Filtro separador 1" NPT', stock: 8, minStock: 4, criticalStock: 2, unit: 'unidad', depot: 'Depósito Central', price: 1850, compatibleModels: ['GA90', 'R110'] },
  { id: 'PT002', code: 'FLT-ACEIT-002', name: 'Filtro de aceite', description: 'Filtro aceite compresor rotativo', stock: 2, minStock: 4, criticalStock: 2, unit: 'unidad', depot: 'Depósito Central', price: 2200, compatibleModels: ['GA90'] },
  { id: 'PT003', code: 'SEP-ACEIT-001', name: 'Separador de aceite', description: 'Elemento separador', stock: 5, minStock: 2, criticalStock: 1, unit: 'unidad', depot: 'Depósito Central', price: 8500, compatibleModels: ['GA90', 'R110'] },
  { id: 'PT004', code: 'KIT-SELL-001', name: 'Kit de sellos', description: 'Juego de sellos orings', stock: 12, minStock: 6, criticalStock: 3, unit: 'kit', depot: 'Depósito Central', price: 3200, compatibleModels: ['CR32-4'] },
  { id: 'PT005', code: 'FLT-SEP-002', name: 'Filtro separador agua/aceite', description: 'Separador 10 micrones', stock: 3, minStock: 4, criticalStock: 2, unit: 'unidad', depot: 'Depósito Norte', price: 4100, compatibleModels: ['GA90'] },
  { id: 'PT006', code: 'LUB-COMP-001', name: 'Aceite compresor 20L', description: 'Aceite sintético específico', stock: 6, minStock: 4, criticalStock: 2, unit: 'bidón', depot: 'Depósito Central', price: 12500, compatibleModels: ['GA90', 'R110'] },
  { id: 'PT007', code: 'VAL-DESC-001', name: 'Válvula de descarga', description: 'Válvula 1" BSP PN16', stock: 1, minStock: 2, criticalStock: 1, unit: 'unidad', depot: 'Depósito Central', price: 18700, compatibleModels: ['GA90'] },
  { id: 'PT008', code: 'FLT-HEPA-001', name: 'Filtro HEPA H14', description: 'Filtro absoluto para flujo laminar', stock: 4, minStock: 2, criticalStock: 1, unit: 'unidad', depot: 'Depósito Especial', price: 35000, compatibleModels: ['LA-500'] },
  { id: 'PT009', code: 'GAS-R410-001', name: 'Gas refrigerante R-410A', description: 'Cilindro 11.3 kg', stock: 3, minStock: 3, criticalStock: 1, unit: 'cilindro', depot: 'Depósito Central', price: 28000, compatibleModels: ['30XA-162', 'CAJ9513T'] },
  { id: 'PT010', code: 'BOB-WEG-001', name: 'Bobinado motor WEG 200HP', description: 'Reparación bobinado', stock: 0, minStock: 1, criticalStock: 1, unit: 'servicio', depot: 'Taller', price: 95000, compatibleModels: ['W22 200HP'] },
];

const MOCK_KITS = [
  { id: 'KT001', name: 'Kit Semestral Compresor Atlas Copco GA', equipmentType: 'compresor', brand: 'Atlas Copco', frequency: '6m', parts: [{partId: 'PT001', qty: 2}, {partId: 'PT002', qty: 1}, {partId: 'PT006', qty: 1}], estimatedTime: 180, price: 28550 },
  { id: 'KT002', name: 'Kit Semestral Bomba Grundfos CR', equipmentType: 'bomba', brand: 'Grundfos', frequency: '6m', parts: [{partId: 'PT004', qty: 1}], estimatedTime: 90, price: 3200 },
  { id: 'KT003', name: 'Kit Semestral Refrigeración', equipmentType: 'refrigeracion', brand: 'General', frequency: '6m', parts: [{partId: 'PT008', qty: 2}, {partId: 'PT009', qty: 1}], estimatedTime: 150, price: 98000 },
  { id: 'KT004', name: 'Kit Anual Chiller Carrier 30XA', equipmentType: 'chiller', brand: 'Carrier', frequency: '12m', parts: [{partId: 'PT001', qty: 4}, {partId: 'PT009', qty: 2}, {partId: 'PT006', qty: 2}], estimatedTime: 360, price: 90500 },
  { id: 'KT005', name: 'Kit Semestral Compresor Atlas Copco GA (Extendido)', equipmentType: 'compresor', brand: 'Atlas Copco', frequency: '12m', parts: [{partId: 'PT001', qty: 2}, {partId: 'PT002', qty: 1}, {partId: 'PT003', qty: 1}, {partId: 'PT005', qty: 1}, {partId: 'PT006', qty: 2}], estimatedTime: 240, price: 52700 },
];

const MOCK_ALERTS = [
  { id: 'AL001', type: 'overdue', entityId: 'EQ004', entityType: 'equipment', message: 'Mantenimiento vencido — Condensadora Tecumseh (FS-COND-002)', date: '2025-01-15', severity: 'critical', clientId: 'CL002', daysOverdue: 97 },
  { id: 'AL002', type: 'overdue', entityId: 'EQ002', entityType: 'equipment', message: 'Mantenimiento vencido — Bomba Grundfos CR32 (FX-BOMB-002)', date: '2025-02-20', severity: 'critical', clientId: 'CL001', daysOverdue: 62 },
  { id: 'AL003', type: 'upcoming', entityId: 'EQ001', entityType: 'equipment', message: 'Mantenimiento próximo — Compresor Atlas Copco (FX-COMP-001)', date: '2025-04-15', severity: 'warning', clientId: 'CL001', daysAhead: 23 },
  { id: 'AL004', type: 'upcoming', entityId: 'EQ006', entityType: 'equipment', message: 'Mantenimiento próximo — Compresor Ingersoll Rand (CA-COMP-002)', date: '2025-03-15', severity: 'info', clientId: 'CL003', daysAhead: 5 },
  { id: 'AL005', type: 'low-stock', entityId: 'PT002', entityType: 'part', message: 'Stock crítico — Filtro de aceite (FLT-ACEIT-002)', date: '2025-04-22', severity: 'warning', clientId: null, currentStock: 2, minStock: 4 },
  { id: 'AL006', type: 'low-stock', entityId: 'PT007', entityType: 'part', message: 'Stock crítico — Válvula de descarga (VAL-DESC-001)', date: '2025-04-22', severity: 'critical', clientId: null, currentStock: 1, minStock: 2 },
  { id: 'AL007', type: 'low-stock', entityId: 'PT010', entityType: 'part', message: 'Sin stock — Bobinado motor WEG (BOB-WEG-001)', date: '2025-04-22', severity: 'critical', clientId: null, currentStock: 0, minStock: 1 },
];

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

function AppProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState(null);
  const [modal, setModal] = useState(null); // {type, data}
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(MOCK_ALERTS.filter(a => a.severity === 'critical').length);

  const [clients, setClients] = useState(MOCK_CLIENTS);
  const [equipment, setEquipment] = useState(MOCK_EQUIPMENT);
  const [maintenances, setMaintenances] = useState(MOCK_MAINTENANCES);
  const [parts, setParts] = useState(MOCK_PARTS);
  const [kits] = useState(MOCK_KITS);
  const [alerts] = useState(MOCK_ALERTS);
  const [users] = useState(MOCK_USERS);

  const login = useCallback((email, password) => {
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && password === 'demo') {
      setCurrentUser(user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: 'Credenciales incorrectas' };
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  const navigate = useCallback((view, params = {}) => {
    setCurrentView(view);
    if (params.clientId) setSelectedClientId(params.clientId);
    if (params.equipmentId) setSelectedEquipmentId(params.equipmentId);
    if (params.maintenanceId) setSelectedMaintenanceId(params.maintenanceId);
  }, []);

  const openModal = useCallback((type, data = {}) => setModal({ type, data }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const getClientById = useCallback((id) => clients.find(c => c.id === id), [clients]);
  const getEquipmentById = useCallback((id) => equipment.find(e => e.id === id), [equipment]);
  const getEquipmentByClient = useCallback((clientId) => equipment.filter(e => e.clientId === clientId), [equipment]);
  const getMaintenancesByEquipment = useCallback((equipmentId) => maintenances.filter(m => m.equipmentId === equipmentId).sort((a, b) => new Date(b.date) - new Date(a.date)), [maintenances]);
  const getMaintenancesByClient = useCallback((clientId) => maintenances.filter(m => m.clientId === clientId), [maintenances]);
  const getPartById = useCallback((id) => parts.find(p => p.id === id), [parts]);
  const getKitById = useCallback((id) => kits.find(k => k.id === id), [kits]);
  const getUserById = useCallback((id) => users.find(u => u.id === id), [users]);
  const getAlertsByEquipment = useCallback((equipmentId) => alerts.filter(a => a.entityId === equipmentId), [alerts]);

  const addMaintenance = useCallback((data) => {
    const newMaint = { id: `MN${String(maintenances.length + 1).padStart(3,'0')}`, ...data, status: 'scheduled' };
    setMaintenances(prev => [newMaint, ...prev]);
    return newMaint;
  }, [maintenances]);

  const kpiData = {
    overdue: alerts.filter(a => a.type === 'overdue').length,
    upcoming: alerts.filter(a => a.type === 'upcoming').length,
    criticalStock: alerts.filter(a => a.type === 'low-stock').length,
    inProgress: maintenances.filter(m => m.status === 'in-progress').length,
    completedThisMonth: maintenances.filter(m => m.status === 'completed' && m.date >= '2025-04-01').length,
    scheduledThisMonth: maintenances.filter(m => m.status === 'scheduled' && m.date >= '2025-04-01' && m.date <= '2025-04-30').length,
  };

  const value = {
    theme, toggleTheme,
    isAuthenticated, currentUser, login, logout,
    currentView, navigate,
    sidebarCollapsed, setSidebarCollapsed,
    selectedClientId, setSelectedClientId,
    selectedEquipmentId, setSelectedEquipmentId,
    selectedMaintenanceId, setSelectedMaintenanceId,
    modal, openModal, closeModal,
    searchQuery, setSearchQuery,
    notifications,
    clients, equipment, maintenances, parts, kits, alerts, users,
    getClientById, getEquipmentById, getEquipmentByClient,
    getMaintenancesByEquipment, getMaintenancesByClient,
    getPartById, getKitById, getUserById, getAlertsByEquipment,
    addMaintenance,
    kpiData,
    MOCK_PARTS, MOCK_KITS,
  };

  return React.createElement(AppContext.Provider, { value }, children);
}

function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

Object.assign(window, { AppProvider, useApp, AppContext });
