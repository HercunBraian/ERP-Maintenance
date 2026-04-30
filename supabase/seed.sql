-- ============================================================================
-- MaintenancePro CMMS — Phase A seed
-- Mirrors MOCK_* from components/AppContext.jsx so the existing UI keeps
-- working once it's wired to Supabase.
--
-- NOTE: public.users rows use placeholder UUIDs. Phase B will replace them
-- with the real auth.users IDs after demo accounts are created.
-- ============================================================================

-- ─── DEPÓSITOS ────────────────────────────────────────────────────────────────
insert into public.depositos (code, name) values
  ('DEP-CEN', 'Depósito Central'),
  ('DEP-NOR', 'Depósito Norte'),
  ('DEP-ESP', 'Depósito Especial'),
  ('DEP-TAL', 'Taller');

-- ─── USERS (placeholders) ─────────────────────────────────────────────────────
insert into public.users (id, email, full_name, role, avatar, phone, dept) values
  ('00000000-0000-0000-0000-000000000001', 'admin@cmms.com',  'Admin Sistema',     'admin',      'AS', '+54 11 4000-0001', 'Administración'),
  ('00000000-0000-0000-0000-000000000002', 'lucas@cmms.com',  'Lucas Fernández',   'technician', 'LF', '+54 11 4000-0002', 'Técnicos de campo'),
  ('00000000-0000-0000-0000-000000000003', 'maria@cmms.com',  'María González',    'technician', 'MG', '+54 11 4000-0003', 'Técnicos de campo'),
  ('00000000-0000-0000-0000-000000000004', 'diego@cmms.com',  'Diego Ramírez',     'technician', 'DR', '+54 11 4000-0004', 'Técnicos de campo');

-- ─── CLIENTES ────────────────────────────────────────────────────────────────
insert into public.clientes (code, name, address, phone, email, contact_name, type, status, since) values
  ('CL001','Industrias Ferrox S.A.',      'Av. Industrial 1234, Buenos Aires', '+54 11 4567-8901','mantenimiento@ferrox.com',   'Ing. Carlos Mendoza','industrial',  'active',  '2021-03-15'),
  ('CL002','Frigoríficos del Sur S.R.L.', 'Ruta 8 km 45, La Plata',            '+54 221 456-7890','operaciones@frigosur.com',   'Lic. Ana Romero',    'food',        'active',  '2020-07-01'),
  ('CL003','Cementos Andes Corp.',        'Parque Industrial Zona Norte',      '+54 351 234-5678','planta@cementosandes.com',   'Ing. Roberto Silva', 'construction','active',  '2019-11-20'),
  ('CL004','Laboratorios Biopharma',      'Av. Corrientes 5678, CABA',         '+54 11 4222-3333','facilities@biopharma.com',   'Dra. Laura Castro',  'pharma',      'active',  '2022-01-10'),
  ('CL005','Textil Norteña S.A.',         'Zona Franca Industrial, Tucumán',   '+54 381 555-6677','mantenimiento@textiln.com',  'Sr. Fabio Torres',   'textile',     'inactive','2018-05-12'),
  ('CL006','Plásticos Modernos S.A.',     'Av. Constituyentes 8900, GBA',      '+54 11 4111-2222','planta@plastimod.com',       'Ing. Sergio Ruiz',   'industrial',  'active',  '2023-02-20');

-- ─── REPUESTOS ───────────────────────────────────────────────────────────────
insert into public.repuestos (code, name, description, unit, price, compatible_models) values
  ('FLT-AIRE-001', 'Filtro de aire compresor',     'Filtro separador 1" NPT',            'unidad',   1850,  array['GA90','R110']),
  ('FLT-ACEIT-002','Filtro de aceite',             'Filtro aceite compresor rotativo',   'unidad',   2200,  array['GA90']),
  ('SEP-ACEIT-001','Separador de aceite',          'Elemento separador',                 'unidad',   8500,  array['GA90','R110']),
  ('KIT-SELL-001', 'Kit de sellos',                'Juego de sellos orings',             'kit',      3200,  array['CR32-4']),
  ('FLT-SEP-002',  'Filtro separador agua/aceite', 'Separador 10 micrones',              'unidad',   4100,  array['GA90']),
  ('LUB-COMP-001', 'Aceite compresor 20L',         'Aceite sintético específico',        'bidón',   12500,  array['GA90','R110']),
  ('VAL-DESC-001', 'Válvula de descarga',          'Válvula 1" BSP PN16',                'unidad',  18700,  array['GA90']),
  ('FLT-HEPA-001', 'Filtro HEPA H14',              'Filtro absoluto para flujo laminar', 'unidad',  35000,  array['LA-500']),
  ('GAS-R410-001', 'Gas refrigerante R-410A',      'Cilindro 11.3 kg',                   'cilindro',28000,  array['30XA-162','CAJ9513T']),
  ('BOB-WEG-001',  'Bobinado motor WEG 200HP',     'Reparación bobinado',                'servicio',95000,  array['W22 200HP']);

-- ─── STOCK POR DEPÓSITO ──────────────────────────────────────────────────────
insert into public.stock_por_deposito (repuesto_id, deposito_id, stock, min_stock, critical_stock)
select r.id, d.id, s.stock, s.min_stock, s.critical_stock
from (values
  ('FLT-AIRE-001', 'DEP-CEN',  8, 4, 2),
  ('FLT-ACEIT-002','DEP-CEN',  2, 4, 2),
  ('SEP-ACEIT-001','DEP-CEN',  5, 2, 1),
  ('KIT-SELL-001', 'DEP-CEN', 12, 6, 3),
  ('FLT-SEP-002',  'DEP-NOR',  3, 4, 2),
  ('LUB-COMP-001', 'DEP-CEN',  6, 4, 2),
  ('VAL-DESC-001', 'DEP-CEN',  1, 2, 1),
  ('FLT-HEPA-001', 'DEP-ESP',  4, 2, 1),
  ('GAS-R410-001', 'DEP-CEN',  3, 3, 1),
  ('BOB-WEG-001',  'DEP-TAL',  0, 1, 1)
) as s(part_code, dep_code, stock, min_stock, critical_stock)
join public.repuestos r on r.code = s.part_code
join public.depositos d on d.code = s.dep_code;

-- ─── KITS ────────────────────────────────────────────────────────────────────
insert into public.kits (code, name, equipment_type, brand, frequency, estimated_time_min, price) values
  ('KT001','Kit Semestral Compresor Atlas Copco GA',             'compresor',     'Atlas Copco', '6m',  180, 28550),
  ('KT002','Kit Semestral Bomba Grundfos CR',                    'bomba',         'Grundfos',    '6m',   90,  3200),
  ('KT003','Kit Semestral Refrigeración',                        'refrigeracion', 'General',     '6m',  150, 98000),
  ('KT004','Kit Anual Chiller Carrier 30XA',                     'chiller',       'Carrier',     '12m', 360, 90500),
  ('KT005','Kit Semestral Compresor Atlas Copco GA (Extendido)', 'compresor',     'Atlas Copco', '12m', 240, 52700);

insert into public.kit_repuestos (kit_id, repuesto_id, qty)
select k.id, r.id, x.qty
from (values
  ('KT001','FLT-AIRE-001', 2), ('KT001','FLT-ACEIT-002', 1), ('KT001','LUB-COMP-001', 1),
  ('KT002','KIT-SELL-001', 1),
  ('KT003','FLT-HEPA-001', 2), ('KT003','GAS-R410-001', 1),
  ('KT004','FLT-AIRE-001', 4), ('KT004','GAS-R410-001', 2), ('KT004','LUB-COMP-001', 2),
  ('KT005','FLT-AIRE-001', 2), ('KT005','FLT-ACEIT-002', 1), ('KT005','SEP-ACEIT-001', 1), ('KT005','FLT-SEP-002', 1), ('KT005','LUB-COMP-001', 2)
) as x(kit_code, part_code, qty)
join public.kits k       on k.code = x.kit_code
join public.repuestos r  on r.code = x.part_code;

-- ─── EQUIPOS ─────────────────────────────────────────────────────────────────
insert into public.equipos
  (code, serial, model, brand, type, category, cliente_id, status,
   install_date, last_maintenance_date, next_maintenance_date,
   maintenance_interval, location, notes)
select e.code, e.serial, e.model, e.brand, e.type, e.category, c.id,
       e.status::equipment_status,
       e.install_date::date, e.last_m::date, e.next_m::date,
       e.interval, e.location, nullif(e.notes,'')
from (values
  ('EQ001','FX-COMP-001','Atlas Copco GA90',    'Atlas Copco',   'compresor',            'Neumática',     'CL001','operational','2021-04-10','2024-10-15','2025-04-15','6m', 'Sala de máquinas 1','Revisión de válvula pendiente'),
  ('EQ002','FX-BOMB-002','Grundfos CR32-4',     'Grundfos',      'bomba',                'Hidráulica',    'CL001','alert',      '2021-05-20','2024-08-20','2025-02-20','6m', 'Sala de bombeo',     ''),
  ('EQ003','FS-EVAP-001','Bohn LET200H',        'Bohn',          'evaporador',           'Refrigeración', 'CL002','operational','2020-08-01','2025-02-01','2025-08-01','6m', 'Cámara Fría A',      ''),
  ('EQ004','FS-COND-002','Tecumseh CAJ9513T',   'Tecumseh',      'condensadora',         'Refrigeración', 'CL002','overdue',    '2020-08-01','2024-07-15','2025-01-15','6m', 'Azotea',             'VENCIDO — requiere atención urgente'),
  ('EQ005','CA-TRI-001', 'WEG W22 200HP',       'WEG',           'motor',                'Eléctrica',     'CL003','maintenance','2019-12-01','2025-01-10','2025-07-10','6m', 'Línea de producción 3','En mantenimiento correctivo'),
  ('EQ006','CA-COMP-002','Ingersoll Rand R110', 'Ingersoll Rand','compresor',            'Neumática',     'CL003','operational','2020-03-15','2024-09-15','2025-03-15','6m', 'Sala de compresores',''),
  ('EQ007','BP-LAM-001', 'LaminAire LA-500',    'Bioair',        'cabina_flujo_laminar', 'Laboratorio',   'CL004','operational','2022-02-01','2025-02-01','2025-08-01','6m', 'Lab. Estéril B',     'Filtros HEPA cambiados en último servicio'),
  ('EQ008','FX-HVAC-003','Carrier 30XA-162',    'Carrier',       'chiller',              'HVAC',          'CL001','operational','2022-06-01','2024-12-01','2025-12-01','12m','Azotea Sector B',    '')
) as e(code, serial, model, brand, type, category, client_code, status,
        install_date, last_m, next_m, interval, location, notes)
join public.clientes c on c.code = e.client_code;

-- ─── MANTENIMIENTOS ──────────────────────────────────────────────────────────
-- Disable refresh trigger so seeded equipo statuses aren't recomputed.
alter table public.mantenimientos disable trigger trg_refresh_equipo_after_mant;

insert into public.mantenimientos
  (code, equipo_id, cliente_id, tipo, scheduled_date, status,
   technician_id, kit_id, notes, duration_min)
select m.code, e.id, c.id,
       m.tipo::maintenance_type_code, m.sched::date, m.status::maintenance_status,
       case m.tech
         when 'U002' then '00000000-0000-0000-0000-000000000002'::uuid
         when 'U003' then '00000000-0000-0000-0000-000000000003'::uuid
         when 'U004' then '00000000-0000-0000-0000-000000000004'::uuid
         else null end,
       k.id,
       nullif(m.notes,''),
       m.duration
from (values
  ('MN001','EQ001','CL001','preventive-6m', '2025-04-15','scheduled',  'U002','KT001', 'Preventivo semestral programado',                                  null::int),
  ('MN002','EQ001','CL001','preventive-6m', '2024-10-15','completed',  'U002','KT001', 'Sin novedades. Equipo en buen estado.',                            180),
  ('MN003','EQ001','CL001','preventive-6m', '2024-04-15','completed',  'U003','KT001', 'Reemplazo adicional filtro separador.',                            200),
  ('MN004','EQ001','CL001','corrective',    '2023-12-05','completed',  'U004', null,   'Reparación urgente válvula de descarga. Ruido anormal detectado.', 240),
  ('MN005','EQ002','CL001','preventive-6m', '2025-02-20','overdue',     null,  'KT002', '',                                                                null),
  ('MN006','EQ004','CL002','preventive-6m', '2025-01-15','overdue',     null,  'KT003', '',                                                                null),
  ('MN007','EQ005','CL003','corrective',    '2025-01-10','in_progress','U002', null,   'Falla en bobinado. Extracción y reparación en taller.',            null),
  ('MN008','EQ003','CL002','preventive-6m', '2025-02-01','completed',  'U003','KT003', 'Limpieza profunda aletas. Presión correcta.',                      150),
  ('MN009','EQ008','CL001','preventive-12m','2024-12-01','completed',  'U002','KT004', 'Anual completado. Carga refrigerante correcta.',                   360)
) as m(code, equip_code, client_code, tipo, sched, status, tech, kit_code, notes, duration)
join public.equipos      e on e.code = m.equip_code
join public.clientes     c on c.code = m.client_code
left join public.kits    k on k.code = m.kit_code;

alter table public.mantenimientos enable trigger trg_refresh_equipo_after_mant;

-- ─── REPUESTOS USADOS ────────────────────────────────────────────────────────
insert into public.repuestos_usados (mantenimiento_id, repuesto_id, qty)
select m.id, r.id, x.qty
from (values
  ('MN001','FLT-AIRE-001', 2), ('MN001','SEP-ACEIT-001', 1),
  ('MN002','FLT-AIRE-001', 2), ('MN002','SEP-ACEIT-001', 1),
  ('MN003','FLT-AIRE-001', 2), ('MN003','SEP-ACEIT-001', 1), ('MN003','FLT-SEP-002', 1),
  ('MN004','VAL-DESC-001', 1),
  ('MN007','BOB-WEG-001',  1),
  ('MN008','FLT-HEPA-001', 4),
  ('MN009','FLT-AIRE-001', 4), ('MN009','GAS-R410-001',  2)
) as x(mant_code, part_code, qty)
join public.mantenimientos m on m.code = x.mant_code
join public.repuestos      r on r.code = x.part_code;

-- ─── ALERTAS ─────────────────────────────────────────────────────────────────
insert into public.alertas (type, severity, message, entity_type, entity_id, cliente_id, metadata)
select a.type::alert_type, a.severity::alert_severity, a.message, a.entity_type,
       case a.entity_type
         when 'equipment' then (select id from public.equipos   where code = a.ref_code)
         else                  (select id from public.repuestos where code = a.ref_code)
       end,
       case when a.client_code is not null
            then (select id from public.clientes where code = a.client_code) end,
       a.metadata::jsonb
from (values
  ('overdue',  'critical', 'Mantenimiento vencido — Condensadora Tecumseh (FS-COND-002)',     'equipment','EQ004','CL002','{"daysOverdue":97}'),
  ('overdue',  'critical', 'Mantenimiento vencido — Bomba Grundfos CR32 (FX-BOMB-002)',       'equipment','EQ002','CL001','{"daysOverdue":62}'),
  ('upcoming', 'warning',  'Mantenimiento próximo — Compresor Atlas Copco (FX-COMP-001)',     'equipment','EQ001','CL001','{"daysAhead":23}'),
  ('upcoming', 'info',     'Mantenimiento próximo — Compresor Ingersoll Rand (CA-COMP-002)',  'equipment','EQ006','CL003','{"daysAhead":5}'),
  ('low_stock','warning',  'Stock crítico — Filtro de aceite (FLT-ACEIT-002)',                'part',     'FLT-ACEIT-002', null, '{"currentStock":2,"minStock":4}'),
  ('low_stock','critical', 'Stock crítico — Válvula de descarga (VAL-DESC-001)',              'part',     'VAL-DESC-001',  null, '{"currentStock":1,"minStock":2}'),
  ('low_stock','critical', 'Sin stock — Bobinado motor WEG (BOB-WEG-001)',                    'part',     'BOB-WEG-001',   null, '{"currentStock":0,"minStock":1}')
) as a(type, severity, message, entity_type, ref_code, client_code, metadata);
