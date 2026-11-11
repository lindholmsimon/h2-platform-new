-- =============================================================================
-- H2 Plattform – användare, roller, behörigheter och aktivitetslogg
-- Migration 1/4: tabeller, relationer och index
-- =============================================================================

-- Schema för interna hjälpfunktioner. Exponeras INTE via Supabase API
-- (endast "public" och "graphql_public" exponeras som standard).
create schema if not exists private;
revoke all on schema private from public;

-- Funktioner får som standard EXECUTE för PUBLIC i Postgres – stäng det för
-- allt som skapas i private-schemat. Rättigheter delas sedan ut explicit.
alter default privileges in schema private revoke execute on functions from public;

-- -----------------------------------------------------------------------------
-- Användarprofiler
-- -----------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key default gen_random_uuid(),
  -- Koppling till Supabase Auth. Sätts först när användaren loggat in.
  auth_user_id     uuid unique references auth.users (id) on delete set null,
  -- Framtida koppling till Microsoft Entra ID (tid- och oid-claims).
  entra_tenant_id  uuid,
  entra_object_id  uuid,
  email            text not null,
  display_name     text not null,
  job_title        text,
  department       text,
  phone            text,
  status           text not null default 'invited',
  last_sign_in_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint profiles_status_check check (status in ('invited', 'active', 'inactive')),
  constraint profiles_email_check check (position('@' in email) > 1),
  constraint profiles_display_name_check check (length(btrim(display_name)) > 0),
  -- Tenant-ID och object-ID anges alltid tillsammans.
  constraint profiles_entra_identity_check check ((entra_tenant_id is null) = (entra_object_id is null))
);

comment on table public.profiles is 'Plattformens användare. Ändras endast via admin-funktioner.';
comment on column public.profiles.entra_tenant_id is 'Microsoft Entra ID tenant (tid-claim).';
comment on column public.profiles.entra_object_id is 'Microsoft Entra ID object-ID (oid-claim). Stabil identitet per tenant.';

create unique index profiles_email_key on public.profiles (lower(email));
create unique index profiles_entra_identity_key
  on public.profiles (entra_tenant_id, entra_object_id)
  where entra_object_id is not null;
create index profiles_status_idx on public.profiles (status);

-- -----------------------------------------------------------------------------
-- Behörigheter (systemdefinierade – ändras endast via migrationer)
-- -----------------------------------------------------------------------------
create table public.permissions (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  category     text not null,
  label        text not null,
  description  text not null default '',
  created_at   timestamptz not null default now(),
  constraint permissions_key_check check (key ~ '^[a-z]+(\.[a-z_]+)+$')
);

-- -----------------------------------------------------------------------------
-- Roller (standardroller + egna roller skapade av administratör)
-- -----------------------------------------------------------------------------
create table public.roles (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  name         text not null,
  description  text not null default '',
  -- Standardroll: kan inte tas bort.
  is_system    boolean not null default false,
  -- Låst roll: behörigheterna kan inte ändras (Systemadministratör).
  is_locked    boolean not null default false,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint roles_key_check check (key ~ '^[a-z][a-z0-9_]{1,49}$'),
  constraint roles_name_check check (length(btrim(name)) between 1 and 80),
  constraint roles_description_check check (length(description) <= 500)
);

create unique index roles_name_key on public.roles (lower(name));

-- -----------------------------------------------------------------------------
-- Roll ↔ behörighet
-- -----------------------------------------------------------------------------
create table public.role_permissions (
  role_id        uuid not null references public.roles (id) on delete cascade,
  permission_id  uuid not null references public.permissions (id) on delete restrict,
  granted_by     uuid references public.profiles (id) on delete set null,
  granted_at     timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create index role_permissions_permission_idx on public.role_permissions (permission_id);

-- -----------------------------------------------------------------------------
-- Användare ↔ roll (en användare kan ha flera roller)
-- -----------------------------------------------------------------------------
create table public.user_roles (
  -- RESTRICT: profiler inaktiveras i stället för att raderas, så att skyddet
  -- för sista systemadministratören inte kan kringgås.
  profile_id   uuid not null references public.profiles (id) on delete restrict,
  -- RESTRICT: en roll som är tilldelad kan inte tas bort.
  role_id      uuid not null references public.roles (id) on delete restrict,
  assigned_by  uuid references public.profiles (id) on delete set null,
  assigned_at  timestamptz not null default now(),
  primary key (profile_id, role_id)
);

create index user_roles_role_idx on public.user_roles (role_id);

-- -----------------------------------------------------------------------------
-- Aktivitetslogg för administrativa ändringar (endast tillägg)
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id                uuid primary key default gen_random_uuid(),
  occurred_at       timestamptz not null default now(),
  -- NULL = systemet (t.ex. första administratören via SQL).
  actor_profile_id  uuid references public.profiles (id) on delete restrict,
  action            text not null,
  target_type       text not null,
  target_id         uuid,
  summary           text not null,
  details           jsonb not null default '{}'::jsonb,
  constraint audit_log_target_type_check check (target_type in ('profile', 'role', 'system'))
);

create index audit_log_occurred_at_idx on public.audit_log (occurred_at desc);
create index audit_log_actor_idx on public.audit_log (actor_profile_id);
create index audit_log_target_idx on public.audit_log (target_type, target_id);
create index audit_log_action_idx on public.audit_log (action);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger roles_set_updated_at before update on public.roles
  for each row execute function private.set_updated_at();

-- Aktivitetsloggen kan aldrig ändras eller raderas.
create function private.prevent_audit_log_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Aktivitetsloggen kan inte ändras eller raderas'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function private.prevent_audit_log_mutation();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.prevent_audit_log_mutation();
