-- ============================================================================
-- Restore baseline grants on the public schema.
--
-- Symptom this fixes: queries fail with `42501: permission denied for schema
-- public` even when run with the service_role key. That happens when:
--   - The service_role key in your backend's .env is stale (Supabase rotated
--     the project's JWT secret, e.g. via "Reset" in Settings → API), so
--     PostgREST can't verify the JWT and falls through to a role with no
--     USAGE on `public`.
--   - Or, a previous migration / ALTER explicitly REVOKEd grants.
--
-- This script re-grants everything Supabase normally provisions by default,
-- so RLS (not GRANTs) is the only access control above this layer.
-- It is idempotent and safe to re-run.
-- ============================================================================

-- USAGE on the schema itself
grant usage on schema public to anon, authenticated, service_role;

-- service_role: full access, bypasses RLS automatically
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- authenticated + anon: full DML access — RLS policies decide which rows
grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage, select                  on all sequences in schema public to authenticated;
grant execute                        on all functions in schema public to authenticated;

grant select, insert, update, delete on all tables    in schema public to anon;
grant usage, select                  on all sequences in schema public to anon;
grant execute                        on all functions in schema public to anon;

-- Default privileges for any future objects created by 'postgres'
alter default privileges in schema public
  grant all on tables    to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on functions to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables    to authenticated;
alter default privileges in schema public
  grant usage, select                  on sequences to authenticated;
alter default privileges in schema public
  grant execute                        on functions to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables    to anon;
alter default privileges in schema public
  grant usage, select                  on sequences to anon;
alter default privileges in schema public
  grant execute                        on functions to anon;

-- ─── Quick diagnostic: run after applying ────────────────────────────────────
-- This SHOULD print rows for anon, authenticated, service_role with USAGE.
-- If it prints zero rows the GRANTs above didn't take — check ownership.
-- (Comment out before running via `supabase db push`.)
--
-- select grantee, privilege_type
--   from information_schema.usage_privileges
--  where object_schema = 'public'
--    and grantee in ('anon','authenticated','service_role');
