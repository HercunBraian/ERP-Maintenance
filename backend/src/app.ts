import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from './lib/errors.js';
import { env } from './env.js';
import clientesRoutes from './modules/clientes/clientes.routes.js';
import equiposRoutes from './modules/equipos/equipos.routes.js';
import mantenimientosRoutes from './modules/mantenimientos/mantenimientos.routes.js';
import repuestosRoutes from './modules/repuestos/repuestos.routes.js';
import stockRoutes from './modules/stock/stock.routes.js';
import kitsRoutes from './modules/kits/kits.routes.js';
import alertasRoutes from './modules/alertas/alertas.routes.js';
import trazabilidadRoutes from './modules/trazabilidad/trazabilidad.routes.js';
import qrScanRoutes from './modules/qr/qr.scan.routes.js';
import usersRoutes from './modules/users/users.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      // Dev: accept anything. In production, restrict via PUBLIC_APP_URL.
      origin: env.NODE_ENV === 'production' ? env.PUBLIC_APP_URL : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, env: env.NODE_ENV, ts: new Date().toISOString() });
  });

  app.use('/api/users',          usersRoutes);
  app.use('/api/clientes',       clientesRoutes);
  app.use('/api/equipos',        equiposRoutes);
  app.use('/api/mantenimientos', mantenimientosRoutes);
  app.use('/api/repuestos',      repuestosRoutes);
  app.use('/api/stock',          stockRoutes);
  app.use('/api/kits',           kitsRoutes);
  app.use('/api/alertas',        alertasRoutes);
  app.use('/api/trazabilidad',   trazabilidadRoutes);
  // PUBLIC — no requireAuth. SECURITY DEFINER RPC handles access.
  app.use('/api/scan',           qrScanRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'NotFound', message: `No route for ${req.method} ${req.path}` });
  });

  app.use(errorMiddleware);

  return app;
}
