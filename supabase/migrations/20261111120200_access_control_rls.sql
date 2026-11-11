-- =============================================================================
-- Migration 3/4: Row Level Security och tabellrättigheter
--
-- - RLS är aktiverat på samtliga tabeller.
-- - anon (ej inloggad) har INGA rättigheter och INGA policies.
-- - authenticated får endast LÄSA, filtrerat via policies. Alla ändringar
--   sker via SECURITY DEFINER-funktionerna i migration 2.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_log enable row level security;

-- Supabase ger som standard anon/authenticated fulla tabellrättigheter i
-- public. Ta bort dem och dela ut endast läsrätt till inloggade.
revoke all on table
  public.profiles, public.permissions, public.roles,
  public.role_permissions, public.user_roles, public.audit_log
from public, anon, authenticated;

grant select on table
  public.profiles, public.permissions, public.roles,
  public.role_permissions, public.user_roles, public.audit_log
to authenticated;

-- Profiler: den egna profilen, eller alla med users.view.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    auth_user_id = (select auth.uid())
    or (select private.has_permission('users.view'))
  );

-- Behörighetskatalog, roller och kopplingar: users.view eller roles.view.
-- (Den egna behörighetslistan hämtas via public.my_access().)
create policy permissions_select on public.permissions
  for select to authenticated
  using ((select private.has_permission('roles.view')) or (select private.has_permission('users.view')));

create policy roles_select on public.roles
  for select to authenticated
  using ((select private.has_permission('roles.view')) or (select private.has_permission('users.view')));

create policy role_permissions_select on public.role_permissions
  for select to authenticated
  using ((select private.has_permission('roles.view')) or (select private.has_permission('users.view')));

-- Rolltilldelningar: de egna, eller alla med users.view.
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (
    profile_id = (select private.current_profile_id())
    or (select private.has_permission('users.view'))
  );

-- Aktivitetslogg: endast audit.view.
create policy audit_log_select on public.audit_log
  for select to authenticated
  using ((select private.has_permission('audit.view')));
