# MaintenancePro CMMS — Supabase (Phase A)

Schema, RLS policies y seed data para el proyecto Supabase.

## Estructura

```
supabase/
├── migrations/
│   ├── 20260423120000_phase_a_schema.sql      # tablas, enums, índices, realtime
│   ├── 20260423120100_phase_a_functions.sql   # triggers, lógica de negocio, scan QR
│   └── 20260423120200_phase_a_rls.sql         # políticas RLS por tabla y por rol
└── seed.sql                                    # datos iniciales (matchea MOCK_* del prototipo)
```

## Cómo aplicarlo

### Opción A — SQL Editor del dashboard (la más rápida para empezar)

Abrí https://supabase.com/dashboard/project/bbgrdgepkmpptjaxadhn/sql y ejecutá **en este orden**:

1. `migrations/20260423120000_phase_a_schema.sql`
2. `migrations/20260423120100_phase_a_functions.sql`
3. `migrations/20260423120200_phase_a_rls.sql`
4. `seed.sql`

Cada archivo es idempotente dentro de su propósito pero **no** está pensado para re-ejecución encima de un schema existente. Si necesitás reiniciar, borrá las tablas o resetá la base.

### Opción B — Supabase CLI (recomendado a partir de Fase B)

```bash
npm install -g supabase
supabase login
supabase link --project-ref bbgrdgepkmpptjaxadhn
supabase db push        # aplica las migraciones
psql "$DATABASE_URL" -f supabase/seed.sql   # seed por separado
```

## Modelo de datos

### Tablas (14)

| Tabla | Resumen |
|---|---|
| `users` | Perfil + rol (admin/technician). Phase B agrega FK a `auth.users`. |
| `clientes` | Empresas. `code` es identificador legible (CL001…). |
| `depositos` | Depósitos físicos donde se guarda stock. |
| `repuestos` | Catálogo de partes; `compatible_models` es array de strings. |
| `stock_por_deposito` | Stock por par (repuesto, depósito) con umbrales `min_stock` y `critical_stock`. |
| `movimientos_stock` | Audit trail de altas/bajas/ajustes. |
| `kits` | Plantillas por tipo de equipo + frecuencia. |
| `kit_repuestos` | Detalle de qué repuestos lleva cada kit. |
| `equipos` | Activos del cliente. Incluye `qr_token`, `last_scanned_at`, `scan_count`. |
| `mantenimientos` | OTs preventivas/correctivas. Triggea recálculo de equipo. |
| `repuestos_usados` | Consumo real por mantenimiento. |
| `alertas` | Vencidos / próximos / stock bajo. `entity_id` polimórfico (FK depende de `entity_type`). |
| `archivos` | Referencia a archivos en Supabase Storage (planillas, fotos). |
| `scan_logs` | Audit de cada escaneo QR (público o autenticado). |

### Relaciones críticas

```
clientes ──< equipos ──< mantenimientos ──< repuestos_usados >── repuestos
                                ├──< archivos                          │
                                └─── kits ──< kit_repuestos ───────────┤
                                                                       │
depositos ──< stock_por_deposito >─────────────────────────────────────┘
            └─< movimientos_stock >── mantenimientos (opcional)

equipos ──< scan_logs
users ──< (technician_id en mantenimientos, uploaded_by en archivos, etc.)
```

### Lógica automática

- **Trigger `trg_refresh_equipo_after_mant`** (sobre `mantenimientos`): cuando se inserta/actualiza/borra una OT, recalcula `last_maintenance_date`, `next_maintenance_date` y `status` del equipo afectado.
- **`calculate_next_maintenance(equipo_id)`** (función): toma el último mantenimiento preventivo completado (o `install_date` si no hay) y le suma el `maintenance_interval`. Soporta `'1m'`, `'3m'`, `'6m'`, `'12m'`.
- **`compute_equipment_status(equipo_id)`** (función): si hay un mantenimiento en `in_progress` → `maintenance`. Sino: vencido → `overdue`, dentro de 30 días → `alert`, resto → `operational`.
- **`get_equipo_by_qr(token, user_agent, ip)`** (RPC, `SECURITY DEFINER`): endpoint público de scan. Devuelve datos mínimos del equipo, incrementa `scan_count`, registra en `scan_logs`. Concedida a `anon` y `authenticated`.

## Roles y RLS

| Rol | Permisos |
|---|---|
| `anon` | Solo puede ejecutar `get_equipo_by_qr()`. No accede a tablas. |
| `authenticated` (technician) | Lee todo. Crea/actualiza solo sus propios mantenimientos (`technician_id = auth.uid()`). Carga repuestos usados y archivos propios. |
| `authenticated` (admin) | Acceso completo. Definido por `public.users.role = 'admin'`. |

Helpers para RLS:
- `public.is_admin()` — `boolean`
- `public.current_user_role()` — `role_name`

> ⚠️ Self-promote bloqueado: la policy `users_self_update` rechaza cambios donde `role` difiera del actual; solo un admin puede modificar roles.

## Realtime

Habilitado en `equipos`, `mantenimientos`, `alertas`, `stock_por_deposito` (publicación `supabase_realtime`).

## Demo accounts

Las 4 filas en `users` están con UUIDs placeholder. En **Fase B** vamos a:
1. Crear los usuarios reales en Supabase Auth (vía Admin API, con `service_role`).
2. `UPDATE public.users SET id = <auth_uid> WHERE email = ...`.
3. Agregar `FK users.id REFERENCES auth.users(id)` y el trigger de auto-creación de perfil al sign-up.

Mientras tanto los `mantenimientos.technician_id` apuntan a los placeholders, y la UI puede mostrar los nombres correctamente.

## Verificación post-aplicación

```sql
-- Conteos esperados
select 'depositos' as t, count(*) from public.depositos union all
select 'users',     count(*) from public.users          union all
select 'clientes',  count(*) from public.clientes       union all
select 'repuestos', count(*) from public.repuestos      union all
select 'stock',     count(*) from public.stock_por_deposito union all
select 'kits',      count(*) from public.kits           union all
select 'equipos',   count(*) from public.equipos        union all
select 'mant.',     count(*) from public.mantenimientos union all
select 'rep_used',  count(*) from public.repuestos_usados union all
select 'alertas',   count(*) from public.alertas;
-- Esperado: 4, 4, 6, 10, 10, 5, 8, 9, 12, 7

-- Test de la función pública
select * from public.get_equipo_by_qr(
  (select qr_token from public.equipos where code='EQ001')
);

-- Verificar que el scan se registró
select * from public.scan_logs order by scanned_at desc limit 5;
```

## Próximas fases

- **Fase B (backend Node + TS)**: API con controllers/services/repositories, auth middleware, CRUD completo, endpoints de QR (`GET /api/equipos/:id/qr` para PNG/SVG), `GET /api/scan/equipo/:token`, integración con Supabase Auth y Storage.
- **Fase C (frontend Vite + TS + Tailwind)**: migrar el prototipo, reemplazar mocks por Supabase client + Realtime, app móvil con scanner QR funcional.
- **Fase D**: reportes con datos reales, alertas calculadas server-side por job programado, storage de adjuntos.
