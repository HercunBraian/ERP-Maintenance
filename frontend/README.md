# MaintenancePro Frontend (Phase C — slice 1)

Vite + React 18 + TypeScript (strict, bundler resolution) + Tailwind v3 +
Supabase JS v2 + TanStack Query v5 + React Router v6 + lucide-react.

Slice 1 ships:
- Auth flow against Supabase Auth (login + persistent session + auto-refresh)
- Sidebar + Topbar matching the original prototype's design
- Dashboard with **6 KPIs**, mantenimientos próximos, alertas críticas,
  actividad reciente, breakdown de estado de equipos — all reading from the
  backend API and **live-updating via Supabase Realtime**
- Dark/Light toggle (the toggle reuses the prototype's CSS variables)

Other routes render `<Placeholder>` for now — they get filled in slice 2
(clientes + equipos), slice 3 (mantenimientos + inventario + kits), slice 4
(trazabilidad + alertas + reportes), slice 5 (QR + mobile views).

## Setup

```bash
cd frontend
npm install
cp .env.example .env
# adjust VITE_API_URL if your backend isn't on http://localhost:4000
```

## Run

```bash
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve dist/ locally
npm run typecheck
```

The backend (Phase B) must be running on `VITE_API_URL` — by default
`http://localhost:4000`. Login with the seeded demo accounts:

| Email             | Role       | Password        |
|-------------------|------------|-----------------|
| admin@cmms.com    | admin      | (your DEMO_USER_PASSWORD) |
| lucas@cmms.com    | technician | …               |
| maria@cmms.com    | technician | …               |
| diego@cmms.com    | technician | …               |

## Architecture

```
src/
├── env.ts                     # typed wrapper for import.meta.env
├── main.tsx                   # mounts <App /> in StrictMode
├── App.tsx                    # providers + router + route table
├── index.css                  # Tailwind + CSS vars (light/dark)
├── lib/
│   ├── supabase.ts            # shared supabase-js client (persistSession + autoRefresh)
│   ├── api.ts                 # typed fetch wrapper for the backend, auto-attaches JWT
│   └── types.ts               # API response types
├── contexts/
│   └── AuthContext.tsx        # session, profile (with role), signIn, signOut
├── hooks/
│   └── useRealtime.ts         # subscribe to a Supabase table, run a callback
├── components/
│   ├── Layout.tsx             # Sidebar + Topbar + Outlet
│   └── badges.tsx             # StatusBadge, SeverityBadge, MantTipoBadge, Avatar
└── pages/
    ├── AuthScreen.tsx         # login (registro + forgot-password en próximas slices)
    └── Dashboard.tsx          # KPIs + listas + estado de equipos, con Realtime
```

## How the data flow works

1. **Auth.** `AuthContext` listens to `supabase.auth.onAuthStateChange`. On
   sign-in, it loads the user's `public.users` row to get `role` and `avatar`.
2. **API.** `lib/api.ts` is a typed fetch wrapper. Before every request it
   pulls the current access token from the supabase client and attaches it as
   `Authorization: Bearer <token>`. Backend's `requireAuth` middleware
   verifies the token and applies RLS via the per-request supabase client.
3. **TanStack Query** caches list/detail responses. Default `staleTime` is
   30 s; `refetchOnWindowFocus` is off.
4. **Realtime.** `useRealtime(channel, table, onChange)` subscribes via
   `supabase.channel(...).on('postgres_changes', ...)`. The dashboard
   subscribes to `mantenimientos`, `equipos`, `alertas`, and
   `stock_por_deposito`, invalidating the matching query keys on any change.
   Open the app in two tabs and create/update something via curl — the
   dashboard refreshes automatically.

## Theme

- Dark/light is controlled by `data-theme="light|dark"` on `<html>`.
- All colors are CSS variables defined in `src/index.css` and consumed via
  Tailwind utilities (`bg-card`, `text-fg`, `border-border`, etc.) declared
  in `tailwind.config.ts`.
- The toggle is in the sidebar bottom panel (sun/moon icon).

## Next slice

- **slice 2** — Clientes + Equipos (list + detalle + create/edit), búsqueda
  global del topbar funcional.
- **slice 3** — Mantenimientos (CRUD + start/complete + carga de repuestos),
  Inventario (con ajuste de stock), Kits.
- **slice 4** — Trazabilidad (por equipo y por cliente con timeline),
  Alertas (panel de resolución), Reportes (descarga PDF/Excel).
- **slice 5** — QR generator + scan público (`/scan/:token`) + vistas móviles
  optimizadas para técnicos en campo.
