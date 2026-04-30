import { createApp } from './app.js';
import { env } from './env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}  (${env.NODE_ENV})`);
});

const shutdown = (signal: string) => () => {
  console.log(`[api] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
