// Shapes returned by the backend API. Kept slim — just the fields the
// frontend currently reads.

export type Role = 'admin' | 'technician';

export type EquipmentStatus =
  | 'operational'
  | 'alert'
  | 'overdue'
  | 'maintenance'
  | 'inactive';

export type MantStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'cancelled';

export type MantTipo =
  | 'preventive-6m'
  | 'preventive-12m'
  | 'corrective'
  | 'use-based';

export type AlertType = 'overdue' | 'upcoming' | 'low_stock';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface ApiList<T> {
  rows: T[];
  total: number;
}

export interface ClienteRef {
  id: string;
  code: number;
  name: string;
}

export interface EquipoRef {
  id: string;
  code: number;
  serial: string;
  model: string;
  brand?: string;
}

export interface Equipo {
  id: string;
  code: number;
  serial: string;
  model: string;
  brand: string;
  type: string;
  category: string | null;
  cliente_id: string;
  status: EquipmentStatus;
  install_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  maintenance_interval: string;
  location: string | null;
  notes: string | null;
  qr_token: string;
  scan_count: number;
  last_scanned_at: string | null;
  cliente?: ClienteRef;
}

export interface Cliente {
  id: string;
  code: number;
  name: string;
  status: 'active' | 'inactive';
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: 'Total Care' | 'Remoto' | 'Preventive' | 'Total Remoto' | 'Full Preventive' | 'Otro';
  since: string | null;
  notes: string | null;
}

export interface Mantenimiento {
  id: string;
  code: number;
  equipo_id: string;
  cliente_id: string;
  tipo: MantTipo;
  status: MantStatus;
  scheduled_date: string;
  technician_id: string | null;
  kit_id: string | null;
  notes: string | null;
  duration_min: number | null;
  started_at: string | null;
  completed_at: string | null;
  equipo?: EquipoRef;
  cliente?: ClienteRef;
}

// ─── Checklist types ─────────────────────────────────────────────────────────

export type ChecklistItemType = 'boolean' | 'number' | 'text' | 'section';
export type ChecklistStatus   = 'in_progress' | 'completed';

export interface ChecklistItem {
  id:       string;
  label:    string;
  type:     ChecklistItemType;
  required?: boolean;
  unit?:    string;
}

export interface ChecklistTemplate {
  id:             string;
  name:           string;
  equipment_type: string;
  version:        number;
  is_active:      boolean;
  items:          ChecklistItem[];
  created_at:     string;
  updated_at:     string;
}

export interface EquipmentChecklist {
  id:                    string;
  equipo_id:             string;
  checklist_template_id: string;
  template:              ChecklistTemplate;
}

export interface MaintenanceChecklist {
  id:               string;
  mantenimiento_id: string;
  template_snapshot: ChecklistItem[];
  answers:          Record<string, string | number | boolean | null>;
  status:           ChecklistStatus;
  started_at:       string;
  completed_at:     string | null;
}

export interface ChecklistTemplateCreateInput {
  name:           string;
  equipment_type: string;
  items:          ChecklistItem[];
}

// ─────────────────────────────────────────────────────────────────────────────

export interface MantenimientoDetail extends Mantenimiento {
  equipo: EquipoRef & { status: EquipmentStatus; location: string | null };
  technician?: { id: string; full_name: string } | null;
  kit?: { id: string; code: string; name: string; frequency: string; estimated_time_min: number } | null;
  parts: Array<{
    id: string;
    qty: number;
    created_at: string;
    repuesto: { id: string; code: string; name: string; unit: string; price: number };
    deposito: { id: string; code: string; name: string } | null;
  }>;
  checklist?: MaintenanceChecklist | null;
}

export interface MantCreateInput {
  equipo_id: string;
  tipo: MantTipo;
  scheduled_date: string;
  technician_id?: string | null;
  kit_id?: string | null;
  notes?: string;
}
export type MantUpdateInput = Partial<MantCreateInput> & { status?: MantStatus };

export interface AddPartInput {
  repuesto_id: string;
  qty: number;
  deposito_id: string;
}

export interface Repuesto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  compatible_models: string[];
  stock?: Array<{
    stock: number;
    min_stock: number;
    critical_stock: number;
    deposito: { id: string; code: string; name: string };
  }>;
}

export interface RepuestoCreateInput {
  code: string;
  name: string;
  description?: string;
  unit?: string;
  price?: number;
  compatible_models?: string[];
}

export interface AdjustStockInput {
  repuesto_id: string;
  deposito_id: string;
  delta: number;
  notes?: string;
}

export interface SetThresholdsInput {
  repuesto_id:    string;
  deposito_id:    string;
  min_stock:      number;
  critical_stock: number;
}

export interface Deposito {
  id:       string;
  code:     string;
  name:     string;
  address?: string | null;
}

export interface EquipmentType {
  id:         string;
  name:       string;
  created_at: string;
}

export interface EquipmentCategory {
  id:         string;
  name:       string;
  created_at: string;
}

export interface KitDetail {
  id: string;
  code: string;
  name: string;
  equipment_type: string;
  brand: string | null;
  frequency: '1m' | '3m' | '6m' | '12m' | 'use';
  estimated_time_min: number;
  price: number;
  parts: Array<{
    qty: number;
    repuesto: { id: string; code: string; name: string; unit: string; price: number };
  }>;
}

export interface Kit {
  id: string;
  code: string;
  name: string;
  equipment_type: string;
  brand: string | null;
  frequency: KitDetail['frequency'];
  estimated_time_min: number;
  price: number;
}

export interface KitCreateInput {
  code: string;
  name: string;
  equipment_type: string;
  brand?: string;
  frequency: KitDetail['frequency'];
  estimated_time_min?: number;
  price?: number;
}

export interface AddKitPartInput {
  repuesto_id: string;
  qty: number;
}

// ─── Users (admin management) ────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar: string | null;
  phone: string | null;
  dept: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  full_name: string;
  role?: Role;
  dept?: string;
  phone?: string;
  avatar?: string;
}

export interface UserUpdateInput {
  full_name?: string;
  role?: Role;
  dept?: string | null;
  phone?: string | null;
  avatar?: string | null;
}

// ─── Trazabilidad composite responses ────────────────────────────────────────

interface PartAggregated {
  repuesto: { id: string; code: string; name: string; unit: string; price: number };
  qty: number;
  cost: number;
}

export interface TrazabilidadEquipo {
  equipo: Equipo & { cliente: ClienteRef };
  timeline: Array<{
    id: string;
    code: number;
    tipo: MantTipo;
    status: MantStatus;
    scheduled_date: string;
    started_at: string | null;
    completed_at: string | null;
    duration_min: number | null;
    notes: string | null;
    technician?: { id: string; full_name: string; avatar: string | null } | null;
    kit?: { id: string; code: string; name: string } | null;
    parts?: Array<{
      qty: number;
      repuesto: { id: string; code: string; name: string; unit: string; price: number };
    }>;
  }>;
  alertas: Alerta[];
  parts_aggregated: PartAggregated[];
  metrics: {
    total_mantenimientos: number;
    completed: number;
    in_progress: number;
    scheduled: number;
    overdue: number;
    total_duration_min: number;
    total_parts_qty: number;
    total_parts_cost: number;
  };
}

export interface TrazabilidadCliente {
  cliente: Cliente;
  equipos: Array<{
    id: string;
    code: number;
    serial: string;
    model: string;
    brand: string;
    type: string;
    status: EquipmentStatus;
    install_date: string | null;
    last_maintenance_date: string | null;
    next_maintenance_date: string | null;
    location: string | null;
  }>;
  mantenimientos_recent: Array<{
    id: string;
    code: number;
    tipo: MantTipo;
    status: MantStatus;
    scheduled_date: string;
    completed_at: string | null;
    duration_min: number | null;
    equipo: { id: string; code: number; serial: string; model: string };
    technician?: { id: string; full_name: string } | null;
  }>;
  parts_aggregated: PartAggregated[];
  metrics: {
    equipos_total: number;
    equipos_by_status: {
      operational: number;
      alert: number;
      overdue: number;
      maintenance: number;
      inactive: number;
    };
    mantenimientos_total: number;
    mantenimientos_completed: number;
    mantenimientos_overdue: number;
    mantenimientos_pending: number;
    total_parts_qty: number;
    total_parts_cost: number;
  };
}

export interface Alerta {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  entity_type: 'equipment' | 'part';
  entity_id: string;
  cliente_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
  cliente?: ClienteRef | null;
}

export interface StockRow {
  id: string;
  stock: number;
  min_stock: number;
  critical_stock: number;
  updated_at: string;
  repuesto: { id: string; code: string; name: string; unit: string; price: number };
  deposito: { id: string; code: string; name: string };
}

// ─── Mutation inputs ─────────────────────────────────────────────────────────

export interface ClienteCreateInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  type?: 'Total Care' | 'Remoto' | 'Preventive' | 'Total Remoto' | 'Full Preventive' | 'Otro';
  status?: 'active' | 'inactive';
  since?: string;
  notes?: string;
}
export type ClienteUpdateInput = Partial<ClienteCreateInput>;

export interface EquipoCreateInput {
  serial: string;
  model: string;
  brand: string;
  type: string;
  category?: string;
  cliente_id: string;
  install_date?: string;
  maintenance_interval?: '1m' | '3m' | '6m' | '12m';
  location?: string;
  notes?: string;
}
export type EquipoUpdateInput = Partial<EquipoCreateInput> & { status?: EquipmentStatus };

// ─── Composite read returned by /api/equipos/:id/full ───────────────────────

export interface EquipoFull {
  equipo: Equipo & {
    cliente: ClienteRef & {
      contact_name: string | null;
      phone: string | null;
      email: string | null;
    };
  };
  mantenimientos: Array<Mantenimiento & {
    kit?: { id: string; code: string; name: string; frequency: string } | null;
    parts?: Array<{
      qty: number;
      repuesto: { id: string; code: string; name: string; unit: string; price: number };
    }>;
  }>;
  alertas: Alerta[];
  scans: Array<{
    id: string;
    scanned_at: string;
    user_agent: string | null;
    ip: string | null;
  }>;
  parts_aggregated: Array<{
    repuesto: { id: string; code: string; name: string; unit: string; price: number };
    qty: number;
    cost: number;
  }>;
  metrics: {
    total: number;
    completed: number;
    in_progress: number;
    overdue: number;
    scheduled: number;
    last_completed_date: string | null;
    next_scheduled_date: string | null;
    total_parts_qty: number;
    total_parts_cost: number;
  };
}
