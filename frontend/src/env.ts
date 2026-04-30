// Vite exposes env vars prefixed with VITE_ via import.meta.env (typed below).
const required = (key: string): string => {
  const v = import.meta.env[key as keyof ImportMetaEnv];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v as string;
};

export const env = {
  SUPABASE_URL:      required('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('VITE_SUPABASE_ANON_KEY'),
  API_URL:           required('VITE_API_URL'),
} as const;
