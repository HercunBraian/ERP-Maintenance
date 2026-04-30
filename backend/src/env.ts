import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  PUBLIC_APP_URL: z.string().url().default('http://localhost:5173'),
  DEMO_USER_PASSWORD: z.string().min(6).default('demo1234'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('[env] Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}


export const env = parsed.data;
