/**
 * One-off: create the 4 demo users in Supabase Auth and re-link the
 * placeholder rows in public.users via the trg_on_auth_user_created trigger
 * (which UPDATEs id ON CONFLICT (email)). After all are linked, calls
 * finalize_users_fk() to add the strict FK to auth.users(id).
 *
 * Idempotent: skips users that already exist; the FK creation is also no-op
 * if the constraint is already present.
 *
 * Run:  npm run seed:auth-users
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.DEMO_USER_PASSWORD ?? 'demo1234';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface DemoUser {
  email: string;
  full_name: string;
  role: 'admin' | 'technician';
}

const USERS: DemoUser[] = [
  { email: 'admin@cmms.com', full_name: 'Admin Sistema',   role: 'admin' },
  { email: 'lucas@cmms.com', full_name: 'Lucas Fernández', role: 'technician' },
  { email: 'maria@cmms.com', full_name: 'María González',  role: 'technician' },
  { email: 'diego@cmms.com', full_name: 'Diego Ramírez',   role: 'technician' },
];

async function ensureAuthUser(u: DemoUser): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.full_name },
  });

  if (!error && data.user) {
    console.log(`  [created] ${u.email} → ${data.user.id}`);
    return data.user.id;
  }

  // Already exists? Look up via paginated listUsers.
  const isDuplicate =
    error?.message?.toLowerCase().includes('already') ||
    error?.message?.toLowerCase().includes('exists');
  if (!isDuplicate) throw error;

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;
  const existing = list.users.find((x) => x.email === u.email);
  if (!existing) throw new Error(`User ${u.email} reported as duplicate but not found in listUsers`);
  console.log(`  [exists]  ${u.email} → ${existing.id}`);
  return existing.id;
}

async function setRole(email: string, role: 'admin' | 'technician') {
  const { error } = await admin.from('users').update({ role }).eq('email', email);
  if (error) throw new Error(`Failed to set role for ${email}: ${error.message}`);
}

async function main() {
  console.log(`Seeding ${USERS.length} demo auth users (password: "${PASSWORD}")…\n`);

  for (const u of USERS) {
    await ensureAuthUser(u);
    await setRole(u.email, u.role);
  }

  console.log('\nFinalizing FK constraint to auth.users…');
  const { error } = await admin.rpc('finalize_users_fk');
  if (error) throw error;

  console.log('\n✓ Done.\n');
  console.log('Login credentials:');
  for (const u of USERS) console.log(`  ${u.email.padEnd(20)} / ${PASSWORD}   (${u.role})`);
}

main().catch((err) => {
  console.error('\n✗ Seeding failed:', err);
  process.exit(1);
});
