-- ============================================================================
-- MaintenancePro CMMS — Phase B: Auth linking
-- 1. Re-create FKs to public.users(id) with ON UPDATE CASCADE so re-linking
--    placeholder UUIDs to real auth.users IDs propagates automatically.
-- 2. Trigger on auth.users insert to create / re-link public.users by email.
-- 3. RPC to add the strict FK to auth.users(id) once seeding is done.
-- ============================================================================

-- ─── (1) Re-create FKs to public.users(id) with ON UPDATE CASCADE ────────────
do $$
declare v record;
begin
  for v in
    select conname, conrelid::regclass::text as tbl
      from pg_constraint
     where confrelid = 'public.users'::regclass and contype = 'f'
  loop
    execute format('alter table %s drop constraint %I', v.tbl, v.conname);
  end loop;
end $$;

alter table public.mantenimientos    add constraint mantenimientos_technician_id_fkey foreign key (technician_id) references public.users(id) on delete set null on update cascade;
alter table public.archivos          add constraint archivos_uploaded_by_fkey         foreign key (uploaded_by)   references public.users(id) on delete set null on update cascade;
alter table public.alertas           add constraint alertas_resolved_by_fkey          foreign key (resolved_by)   references public.users(id) on delete set null on update cascade;
alter table public.movimientos_stock add constraint movimientos_stock_user_id_fkey    foreign key (user_id)       references public.users(id) on delete set null on update cascade;
alter table public.scan_logs         add constraint scan_logs_user_id_fkey            foreign key (user_id)       references public.users(id) on delete set null on update cascade;

-- ─── (2) Auth signup trigger ─────────────────────────────────────────────────
-- INSERTs a public.users row when a new auth user appears. If a placeholder
-- row exists with the same email, just re-points its id to the new auth UUID.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_initials  text;
begin
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_initials  := upper(left(regexp_replace(v_full_name, '[^a-zA-Z]', '', 'g'), 2));

  insert into public.users (id, email, full_name, role, avatar)
  values (new.id, new.email, v_full_name, 'technician', v_initials)
  on conflict (email) do update
    set id = excluded.id;       -- only re-link the id; keep role/full_name/etc.
  return new;
end$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ─── (3) Finalize: add FK to auth.users(id) ──────────────────────────────────
-- Idempotent. Call after seed-auth-users completes.
create or replace function public.finalize_users_fk()
returns void language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'users_id_auth_fkey' and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_id_auth_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end$$;

revoke all on function public.finalize_users_fk() from public;
