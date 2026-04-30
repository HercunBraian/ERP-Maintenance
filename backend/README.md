# MaintenancePro Backend (Phase B — slices 1–3)

Node 20+ · TypeScript (strict, NodeNext) · Express 4 · Supabase JS v2 · Zod.

Slices 1–3 ship: project skeleton, auth (Supabase JWT + RBAC), CRUD for
**clientes, equipos, mantenimientos, repuestos, stock, kits, alertas**, plus
**QR generation (PNG/SVG)**, **public scan endpoint**, **full equipo detail**,
and **trazabilidad endpoints** (per equipo and per cliente with metrics).
Slice 4 adds reportes PDF/Excel server-side, archivos en Storage, and a
scheduled job to recalculate alerts.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# fill SUPABASE_SERVICE_ROLE_KEY in .env
```

## Apply the Phase B migrations

In the Supabase SQL Editor, run **in order**:

```
supabase/migrations/20260423130000_phase_b_auth_link.sql
supabase/migrations/20260424100000_phase_b_stock_rpcs.sql
```

The second migration adds two RPCs:
- `consume_part(mant_id, repuesto_id, qty, deposito_id)` — atomic part consumption (insert `repuestos_usados` + `movimientos_stock` + decrement `stock_por_deposito`, all with `FOR UPDATE` lock).
- `adjust_stock(repuesto_id, deposito_id, delta, notes)` — admin-only manual stock adjustment with audit trail.

It does three things:

1. Re-creates every FK that points at `public.users(id)` with `ON UPDATE CASCADE`.
2. Installs `handle_new_auth_user()` trigger on `auth.users` — when a real
   account is created, it inserts (or, on conflict by `email`, re-links) the
   matching row in `public.users`.
3. Defines `finalize_users_fk()` RPC, which adds the strict FK
   `public.users(id) → auth.users(id)` once seeding is done.

## Seed the demo auth users

```bash
npm run seed:auth-users
```

This script creates the 4 demo accounts (admin + 3 technicians) using the
service role key. The trigger swaps each placeholder UUID in `public.users`
for the real `auth.users` UUID, the cascade updates `mantenimientos`,
`archivos`, `alertas`, `movimientos_stock`, `scan_logs` automatically, and
the script finally calls `finalize_users_fk()`.

Default password (override via `DEMO_USER_PASSWORD` env): **`demo1234`**

| Email             | Role       |
|-------------------|------------|
| admin@cmms.com    | admin      |
| lucas@cmms.com    | technician |
| maria@cmms.com    | technician |
| diego@cmms.com    | technician |

## Run

```bash
npm run dev        # tsx watch — hot reload
npm run build      # tsc → dist/
npm start          # node dist/index.js
npm run typecheck  # tsc --noEmit
```

Health: `GET http://localhost:4000/health`

## Auth flow

1. Frontend signs in via Supabase JS SDK → receives an `access_token` (JWT).
2. Frontend sends it to the backend as `Authorization: Bearer <token>`.
3. `requireAuth` middleware:
   - Verifies the token by calling `supabaseAdmin.auth.getUser(token)`.
   - Loads the matching `public.users` row to get `role` and `full_name`.
   - Attaches `req.user` and `req.accessToken`.
4. `requireRole('admin')` enforces RBAC where needed.
5. Repositories build a per-request Supabase client via `supabaseAsUser(token)`.
   That client carries the user's JWT, so **every query runs under their RLS
   context** — defense in depth even if a controller forgets to check role.

## Architecture

```
src/
├── env.ts                  # zod-validated env
├── index.ts                # listen + graceful shutdown
├── app.ts                  # express app + middleware + route mounting
├── lib/
│   ├── errors.ts           # AppError, asyncHandler, errorMiddleware
│   └── supabase.ts         # supabaseAdmin + supabaseAsUser(token)
├── middleware/
│   ├── auth.ts             # requireAuth, requireRole
│   └── validate.ts         # generic zod request validator
└── modules/
    └── clientes/
        ├── clientes.schemas.ts      # zod schemas + inferred TS types
        ├── clientes.repository.ts   # supabase queries; maps PG errors → AppError
        ├── clientes.service.ts      # business logic
        ├── clientes.controller.ts   # thin HTTP handlers
        └── clientes.routes.ts       # router + middleware
```

Adding a new module = copy the `clientes/` folder, rename, re-write the
schema and repository for the new table. The service / controller / routes
shapes barely change.

## Endpoints

### Health

| Method | Path      | Auth   |
|--------|-----------|--------|
| GET    | `/health` | public |

### Clientes

| Method | Path                  | Auth          |
|--------|-----------------------|---------------|
| GET    | `/api/clientes`       | authenticated |
| GET    | `/api/clientes/:id`   | authenticated |
| POST   | `/api/clientes`       | admin         |
| PATCH  | `/api/clientes/:id`   | admin         |
| DELETE | `/api/clientes/:id`   | admin         |

Query params on list: `search`, `status`, `limit`, `offset`.

### Equipos

| Method | Path                       | Auth          | Notes |
|--------|----------------------------|---------------|-------|
| GET    | `/api/equipos`             | authenticated | Filters: cliente_id, status, search |
| GET    | `/api/equipos/:id`         | authenticated | + nested cliente |
| GET    | `/api/equipos/:id/full`    | authenticated | + cliente, last 50 mantenimientos, active alerts, last 10 scans (admin), aggregated parts, computed metrics |
| GET    | `/api/equipos/:id/qr`      | authenticated | Returns QR image. Query: `format=png\|svg`, `size`, `margin` |
| POST   | `/api/equipos`             | admin         | |
| PATCH  | `/api/equipos/:id`         | admin         | |
| DELETE | `/api/equipos/:id`         | admin         | |

**QR contents:** `${PUBLIC_APP_URL}/scan/${qr_token}` where `qr_token` is the per-equipo random token (16 hex chars by default). The frontend route `/scan/:token` calls `GET /api/scan/:token` for the public lookup.

### Mantenimientos

| Method | Path                                       | Auth          | Notes |
|--------|--------------------------------------------|---------------|-------|
| GET    | `/api/mantenimientos`                      | authenticated | Filters: equipo_id, cliente_id, technician_id, status, from, to |
| GET    | `/api/mantenimientos/:id`                  | authenticated | Detail joins equipo, cliente, kit, repuestos_usados |
| POST   | `/api/mantenimientos`                      | authenticated | RLS scopes technicians to `technician_id = auth.uid()` |
| PATCH  | `/api/mantenimientos/:id`                  | authenticated | RLS as above |
| DELETE | `/api/mantenimientos/:id`                  | admin (RLS)   | |
| POST   | `/api/mantenimientos/:id/start`            | authenticated | scheduled\|overdue → in_progress, sets started_at |
| POST   | `/api/mantenimientos/:id/complete`         | authenticated | in_progress → completed, sets completed_at + duration_min |
| POST   | `/api/mantenimientos/:id/cancel`           | authenticated | * → cancelled (except completed) |
| POST   | `/api/mantenimientos/:id/parts`            | authenticated | `{ repuesto_id, qty, deposito_id }` — atomic consume_part RPC |
| DELETE | `/api/mantenimientos/:id/parts/:partId`    | authenticated | Removes the parts-used row; **does not** auto-replenish stock |

### Repuestos

| Method | Path                  | Auth          |
|--------|-----------------------|---------------|
| GET    | `/api/repuestos`      | authenticated | Query: `with_stock=true` to include nested stock_por_deposito |
| GET    | `/api/repuestos/:id`  | authenticated | Always includes nested stock |
| POST   | `/api/repuestos`      | admin         |
| PATCH  | `/api/repuestos/:id`  | admin         |
| DELETE | `/api/repuestos/:id`  | admin         |

### Stock

| Method | Path                                | Auth          |
|--------|-------------------------------------|---------------|
| GET    | `/api/stock`                        | authenticated | Filters: deposito_id, repuesto_id, low_stock=true |
| POST   | `/api/stock/adjust`                 | admin (RPC)   | `{ repuesto_id, deposito_id, delta, notes? }` |
| GET    | `/api/stock/movements/:repuestoId`  | authenticated | Last 50 movements for a repuesto |

### Kits

| Method | Path                                  | Auth  |
|--------|---------------------------------------|-------|
| GET    | `/api/kits`                           | authenticated | Filters: equipment_type, brand, frequency |
| GET    | `/api/kits/:id`                       | authenticated | Includes nested parts |
| POST   | `/api/kits`                           | admin |
| PATCH  | `/api/kits/:id`                       | admin |
| DELETE | `/api/kits/:id`                       | admin |
| POST   | `/api/kits/:id/parts`                 | admin | Upsert `{ repuesto_id, qty }` |
| DELETE | `/api/kits/:id/parts/:repuestoId`     | admin |

### Alertas

| Method | Path                          | Auth  |
|--------|-------------------------------|-------|
| GET    | `/api/alertas`                | authenticated | Filters: type, severity, resolved (true/false/all), cliente_id, entity_type |
| POST   | `/api/alertas/:id/resolve`    | admin | Sets resolved_at + resolved_by |

### Trazabilidad

| Method | Path                                | Auth          | Returns |
|--------|-------------------------------------|---------------|---------|
| GET    | `/api/trazabilidad/equipo/:id`      | authenticated | `{ equipo, timeline, alertas, parts_aggregated, metrics }` — full timeline + computed totals |
| GET    | `/api/trazabilidad/cliente/:id`     | authenticated | `{ cliente, equipos, mantenimientos_recent, parts_aggregated, metrics }` — fleet-wide view |

`metrics` includes: `equipos_by_status`, `mantenimientos_total/completed/overdue/pending`, `total_parts_qty`, `total_parts_cost`, `total_duration_min` (per-equipo only), etc.

### QR / Public scan

| Method | Path                  | Auth   | Notes |
|--------|-----------------------|--------|-------|
| GET    | `/api/scan/:token`    | **public** | Calls `get_equipo_by_qr` SECURITY DEFINER RPC. Records the scan (ip + UA), increments `scan_count`, returns `{ equipo_id, serial, model, brand, cliente_name, status, next_maintenance_date, scan_count }` |

The endpoint trusts whatever client IP it sees in `X-Forwarded-For` first, falling back to the socket remote address. Both must parse as a valid IPv4/IPv6 (`node:net.isIP`); otherwise IP is recorded as null. Set `app.set('trust proxy', ...)` once the API is behind a known proxy in production.

### Quick test

```bash
# Login via the Supabase REST API to grab a token
TOKEN=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmms.com","password":"Braianhercun1!"}' | jq -r .access_token)

# List clientes
curl -s http://localhost:4000/api/clientes \
  -H "Authorization: Bearer $TOKEN" | jq .

# Create (admin only)
curl -s -X POST http://localhost:4000/api/clientes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"CL999","name":"Test S.A."}' | jq .
```

## Error handling

All thrown `AppError`s — and `ZodError`s from `validate()` — pass through
`errorMiddleware`, which serializes them to consistent JSON:

```json
{ "error": "DuplicateKey", "message": "Duplicate value", "details": "..." }
```

Repository functions translate Postgres SQLSTATE codes into the right HTTP
shapes (e.g. `23505` → 409 `DuplicateKey`, `42501` → 403 `RLSDenied`).

## Next slice

- **slice 4** — Reportes con datos reales (PDF/Excel server-side), archivos en Supabase Storage, scheduled job para recalcular alertas.
