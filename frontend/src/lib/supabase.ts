import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

// Single shared client for the whole app. persistSession + autoRefreshToken
// keep the user logged in across reloads and silently refresh JWTs.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
