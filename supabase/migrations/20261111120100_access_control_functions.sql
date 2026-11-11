-- =============================================================================
-- Migration 2/4: behörighetsfunktioner och administrativa operationer
--
-- Princip: ALLA ändringar av användare, roller och behörigheter görs via
-- funktionerna nedan. De körs som SECURITY DEFINER, kontrollerar den
-- inloggade användarens behörighet, tillämpar skyddsreglerna och skriver
-- aktivitetsloggen i samma transaktion. Tabellerna saknar skrivrättigheter
-- för klientroller (se migration 3).
--
-- Skyddsregler:
--   1. Ingen kan ändra sina egna roller eller sin egen status.
--   2. Man kan bara hantera roller/användare vars behörigheter man själv har
--      (förhindrar att behörighet delas ut "uppåt").
--   3. Endast en systemadministratör kan tilldela/ta bort systemadministratör.
--   4. Den sista aktiva systemadministratören kan inte tas bort/inaktiveras.
--   5. Man kan inte utöka behörigheterna för en roll man själv har.
--   6. Systemadministratörsrollen är låst och har alltid alla behörigheter.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Interna hjälpfunktioner (schema private – ej exponerat via API)
-- -----------------------------------------------------------------------------

-- Profil-ID för den inloggade, aktiva användaren (NULL om ej inloggad/inaktiv).
create function private.current_profile_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.status = 'active';
$$;

-- Effektiva behörigheter för en profil (union av alla roller). Inaktiva
-- profiler har inga behörigheter.
create function private.profile_permission_keys(p_profile_id uuid) returns setof text
language sql stable security definer set search_path = '' as $$
  select distinct perm.key
  from public.user_roles ur
  join public.profiles p on p.id = ur.profile_id and p.status = 'active'
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions perm on perm.id = rp.permission_id
  where ur.profile_id = p_profile_id;
$$;

create function private.has_permission(p_permission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from private.profile_permission_keys(private.current_profile_id()) k
    where k = p_permission
  );
$$;

create function private.profile_has_role(p_profile_id uuid, p_role_key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.profile_id = p_profile_id and r.key = p_role_key
  );
$$;

create function private.active_system_admin_count() returns integer
language sql stable security definer set search_path = '' as $$
  select count(distinct p.id)::integer
  from public.profiles p
  join public.user_roles ur on ur.profile_id = p.id
  join public.roles r on r.id = ur.role_id
  where r.key = 'system_admin' and p.status = 'active';
$$;

-- Behörigheter i p_keys som aktören INTE har.
create function private.permissions_not_held(p_actor uuid, p_keys text[]) returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(k order by k), '{}')
  from (
    select distinct unnest(p_keys) as k
    except
    select private.profile_permission_keys(p_actor)
  ) missing;
$$;

create function private.role_permission_keys(p_role_id uuid) returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(perm.key order by perm.key), '{}')
  from public.role_permissions rp
  join public.permissions perm on perm.id = rp.permission_id
  where rp.role_id = p_role_id;
$$;

-- Kräver inloggad, aktiv användare med angiven behörighet. Returnerar profil-ID.
create function private.require_permission(p_permission text) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_actor uuid := private.current_profile_id();
begin
  if v_actor is null then
    raise exception 'Du måste vara inloggad med ett aktivt konto'
      using errcode = 'invalid_authorization_specification';
  end if;
  if not exists (select 1 from private.profile_permission_keys(v_actor) k where k = p_permission) then
    raise exception 'Behörighet saknas: %', p_permission
      using errcode = 'insufficient_privilege';
  end if;
  return v_actor;
end;
$$;

create function private.write_audit(
  p_actor uuid, p_action text, p_target_type text, p_target_id uuid, p_summary text, p_details jsonb
) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_profile_id, action, target_type, target_id, summary, details)
  values (p_actor, p_action, p_target_type, p_target_id, p_summary, coalesce(p_details, '{}'::jsonb));
$$;

-- Serialiserar administrativa ändringar så att kontrollen av sista
-- systemadministratören inte kan kringgås med samtidiga anrop.
create function private.lock_access_control() returns void
language sql security definer set search_path = '' as $$
  select pg_advisory_xact_lock(hashtext('h2.access_control'));
$$;

-- Kontrollerar att aktören får hantera en användare (regel 1–3).
create function private.assert_can_manage_profile(p_actor uuid, p_target uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
declare
  v_missing text[];
begin
  if p_actor = p_target then
    raise exception 'Du kan inte ändra dina egna roller eller din egen status'
      using errcode = 'insufficient_privilege';
  end if;
  if private.profile_has_role(p_target, 'system_admin')
     and not private.profile_has_role(p_actor, 'system_admin') then
    raise exception 'Endast en systemadministratör kan ändra en annan systemadministratör'
      using errcode = 'insufficient_privilege';
  end if;
  v_missing := private.permissions_not_held(
    p_actor, array(select private.profile_permission_keys(p_target)));
  if cardinality(v_missing) > 0 then
    raise exception 'Användaren har behörigheter som du själv saknar: %', array_to_string(v_missing, ', ')
      using errcode = 'insufficient_privilege';
  end if;
end;
$$;

-- Kontrollerar att aktören får dela ut/ta bort en roll (regel 2–3).
create function private.assert_can_grant_role(p_actor uuid, p_role public.roles) returns void
language plpgsql stable security definer set search_path = '' as $$
declare
  v_missing text[];
begin
  if p_role.key = 'system_admin' and not private.profile_has_role(p_actor, 'system_admin') then
    raise exception 'Endast en systemadministratör kan hantera rollen Systemadministratör'
      using errcode = 'insufficient_privilege';
  end if;
  v_missing := private.permissions_not_held(p_actor, private.role_permission_keys(p_role.id));
  if cardinality(v_missing) > 0 then
    raise exception 'Rollen innehåller behörigheter som du själv saknar: %', array_to_string(v_missing, ', ')
      using errcode = 'insufficient_privilege';
  end if;
end;
$$;

create function private.assert_system_admin_remains() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if private.active_system_admin_count() < 1 then
    raise exception 'Det måste finnas minst en aktiv systemadministratör'
      using errcode = 'check_violation';
  end if;
end;
$$;

-- Validerar att alla behörighetsnycklar finns.
create function private.assert_permission_keys_exist(p_keys text[]) returns void
language plpgsql stable security definer set search_path = '' as $$
declare
  v_unknown text[];
begin
  select coalesce(array_agg(k), '{}') into v_unknown
  from unnest(coalesce(p_keys, '{}')) k
  where not exists (select 1 from public.permissions perm where perm.key = k);
  if cardinality(v_unknown) > 0 then
    raise exception 'Okända behörigheter: %', array_to_string(v_unknown, ', ')
      using errcode = 'invalid_parameter_value';
  end if;
end;
$$;

-- Systemadministratörsrollen får automatiskt nya behörigheter (regel 6).
create function private.grant_new_permission_to_locked_roles() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.role_permissions (role_id, permission_id)
  select r.id, new.id from public.roles r where r.is_locked
  on conflict do nothing;
  return new;
end;
$$;

create trigger permissions_grant_to_locked_roles after insert on public.permissions
  for each row execute function private.grant_new_permission_to_locked_roles();

-- -----------------------------------------------------------------------------
-- Första systemadministratören (bootstrap)
--
-- Körs MANUELLT i Supabase SQL-editor av projektägaren. Ligger i schemat
-- private och saknar EXECUTE för anon/authenticated/service_role, så den kan
-- inte anropas via API. Fungerar endast när ingen aktiv systemadministratör
-- finns.
-- -----------------------------------------------------------------------------
create function private.bootstrap_system_admin(
  p_email text,
  p_display_name text,
  p_entra_tenant_id uuid default null,
  p_entra_object_id uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_profile_id uuid;
  v_role_id uuid;
begin
  perform private.lock_access_control();
  if private.active_system_admin_count() > 0 then
    raise exception 'Det finns redan en aktiv systemadministratör. Använd adminpanelen.'
      using errcode = 'check_violation';
  end if;

  select id into v_role_id from public.roles where key = 'system_admin';

  insert into public.profiles (email, display_name, entra_tenant_id, entra_object_id, status)
  values (lower(btrim(p_email)), btrim(p_display_name), p_entra_tenant_id, p_entra_object_id, 'active')
  on conflict ((lower(email))) do update set status = 'active'
  returning id into v_profile_id;

  insert into public.user_roles (profile_id, role_id) values (v_profile_id, v_role_id)
  on conflict do nothing;

  perform private.write_audit(null, 'system.bootstrap_admin', 'profile', v_profile_id,
    format('%s utsågs till första systemadministratör', btrim(p_display_name)),
    jsonb_build_object('email', lower(btrim(p_email))));
  return v_profile_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Publika RPC-funktioner (anropas av servern med användarens session)
-- -----------------------------------------------------------------------------

-- Den inloggade användarens profil, roller och behörigheter.
create function public.my_access() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when p.id is null then null else jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id, 'email', p.email, 'display_name', p.display_name,
      'job_title', p.job_title, 'department', p.department, 'status', p.status),
    'roles', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'key', r.key, 'name', r.name) order by r.name)
      from public.user_roles ur join public.roles r on r.id = ur.role_id
      where ur.profile_id = p.id), '[]'::jsonb),
    'permissions', coalesce((
      select jsonb_agg(k order by k) from private.profile_permission_keys(p.id) k), '[]'::jsonb)
  ) end
  from (select private.current_profile_id() as id) cur
  left join public.profiles p on p.id = cur.id;
$$;

create function public.admin_assign_role(p_profile_id uuid, p_role_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid;
  v_role public.roles;
  v_target public.profiles;
  v_rows integer;
begin
  perform private.lock_access_control();
  v_actor := private.require_permission('users.manage');

  select * into v_target from public.profiles where id = p_profile_id;
  if not found then
    raise exception 'Användaren finns inte' using errcode = 'no_data_found';
  end if;
  select * into v_role from public.roles where id = p_role_id;
  if not found then
    raise exception 'Rollen finns inte' using errcode = 'no_data_found';
  end if;

  perform private.assert_can_manage_profile(v_actor, p_profile_id);
  perform private.assert_can_grant_role(v_actor, v_role);

  insert into public.user_roles (profile_id, role_id, assigned_by)
  values (p_profile_id, p_role_id, v_actor)
  on conflict do nothing;
  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    perform private.write_audit(v_actor, 'user.role_assigned', 'profile', p_profile_id,
      format('Rollen %s tilldelades %s', v_role.name, v_target.display_name),
      jsonb_build_object('role_id', v_role.id, 'role_key', v_role.key));
  end if;
end;
$$;

create function public.admin_revoke_role(p_profile_id uuid, p_role_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid;
  v_role public.roles;
  v_target public.profiles;
  v_rows integer;
begin
  perform private.lock_access_control();
  v_actor := private.require_permission('users.manage');

  select * into v_target from public.profiles where id = p_profile_id;
  if not found then
    raise exception 'Användaren finns inte' using errcode = 'no_data_found';
  end if;
  select * into v_role from public.roles where id = p_role_id;
  if not found then
    raise exception 'Rollen finns inte' using errcode = 'no_data_found';
  end if;

  perform private.assert_can_manage_profile(v_actor, p_profile_id);
  perform private.assert_can_grant_role(v_actor, v_role);

  delete from public.user_roles where profile_id = p_profile_id and role_id = p_role_id;
  get diagnostics v_rows = row_count;

  perform private.assert_system_admin_remains();

  if v_rows > 0 then
    perform private.write_audit(v_actor, 'user.role_revoked', 'profile', p_profile_id,
      format('Rollen %s togs bort från %s', v_role.name, v_target.display_name),
      jsonb_build_object('role_id', v_role.id, 'role_key', v_role.key));
  end if;
end;
$$;

create function public.admin_set_profile_status(p_profile_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid;
  v_target public.profiles;
begin
  perform private.lock_access_control();
  v_actor := private.require_permission('users.manage');

  if p_status not in ('invited', 'active', 'inactive') then
    raise exception 'Ogiltig status: %', p_status using errcode = 'invalid_parameter_value';
  end if;
  select * into v_target from public.profiles where id = p_profile_id;
  if not found then
    raise exception 'Användaren finns inte' using errcode = 'no_data_found';
  end if;
  if v_target.status = p_status then
    return;
  end if;

  perform private.assert_can_manage_profile(v_actor, p_profile_id);

  update public.profiles set status = p_status where id = p_profile_id;
  perform private.assert_system_admin_remains();

  perform private.write_audit(v_actor, 'user.status_changed', 'profile', p_profile_id,
    format('Status för %s ändrades från %s till %s', v_target.display_name, v_target.status, p_status),
    jsonb_build_object('from', v_target.status, 'to', p_status));
end;
$$;

create function public.admin_create_role(
  p_key text, p_name text, p_description text, p_permission_keys text[]
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid;
  v_missing text[];
  v_role_id uuid;
  v_keys text[] := array(select distinct unnest(coalesce(p_permission_keys, '{}')) order by 1);
begin
  perform private.lock_access_control();
  v_actor := private.require_permission('roles.manage');

  perform private.assert_permission_keys_exist(v_keys);
  v_missing := private.permissions_not_held(v_actor, v_keys);
  if cardinality(v_missing) > 0 then
    raise exception 'Du kan inte ge en roll behörigheter som du själv saknar: %', array_to_string(v_missing, ', ')
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.roles (key, name, description, created_by)
  values (p_key, btrim(p_name), coalesce(btrim(p_description), ''), v_actor)
  returning id into v_role_id;

  insert into public.role_permissions (role_id, permission_id, granted_by)
  select v_role_id, perm.id, v_actor from public.permissions perm where perm.key = any (v_keys);

  perform private.write_audit(v_actor, 'role.created', 'role', v_role_id,
    format('Rollen %s skapades', btrim(p_name)),
    jsonb_build_object('key', p_key, 'permissions', to_jsonb(v_keys)));
  return v_role_id;
end;
$$;

create function public.admin_update_role(
  p_role_id uuid, p_name text, p_description text, p_permission_keys text[]
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid;
  v_role public.roles;
  v_old text[];
  v_new text[] := array(select distinct unnest(coalesce(p_permission_keys, '{}')) order by 1);
  v_added text[];
  v_removed text[];
  v_missing text[];
begin
  perform private.lock_access_control();
  v_actor := private.require_permission('roles.manage');

  select * into v_role from public.roles where id = p_role_id;
  if not found then
    raise exception 'Rollen finns inte' using errcode = 'no_data_found';
  end if;

  perform private.assert_permission_keys_exist(v_new);
  v_old := private.role_permission_keys(p_role_id);
  v_added := array(select unnest(v_new) except select unnest(v_old) order by 1);
  v_removed := array(select unnest(v_old) except select unnest(v_new) order by 1);

  if v_role.is_locked and (cardinality(v_added) > 0 or cardinality(v_removed) > 0) then
    raise exception 'Rollen % är låst och dess behörigheter kan inte ändras', v_role.name
      using errcode = 'insufficient_privilege';
  end if;

  -- Man får bara hantera roller inom sina egna behörigheter (före och efter).
  v_missing := private.permissions_not_held(v_actor, v_old || v_new);
  if cardinality(v_missing) > 0 then
    raise exception 'Rollen innehåller behörigheter som du själv saknar: %', array_to_string(v_missing, ', ')
      using errcode = 'insufficient_privilege';
  end if;

  if cardinality(v_added) > 0 and private.profile_has_role(v_actor, v_role.key) then
    raise exception 'Du kan inte utöka behörigheterna för en roll som du själv har'
      using errcode = 'insufficient_privilege';
  end if;

  update public.roles
  set name = btrim(p_name), description = coalesce(btrim(p_description), '')
  where id = p_role_id;

  delete from public.role_permissions rp
  using public.permissions perm
  where rp.role_id = p_role_id and perm.id = rp.permission_id and perm.key = any (v_removed);

  insert into public.role_permissions (role_id, permission_id, granted_by)
  select p_role_id, perm.id, v_actor from public.permissions perm where perm.key = any (v_added);

  perform private.write_audit(v_actor, 'role.updated', 'role', p_role_id,
    format('Rollen %s uppdaterades', btrim(p_name)),
    jsonb_build_object(
      'added', to_jsonb(v_added), 'removed', to_jsonb(v_removed),
      'name', jsonb_build_object('from', v_role.name, 'to', btrim(p_name))));
end;
$$;

create function public.admin_delete_role(p_role_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid;
  v_role public.roles;
  v_assigned integer;
  v_missing text[];
begin
  perform private.lock_access_control();
  v_actor := private.require_permission('roles.manage');

  select * into v_role from public.roles where id = p_role_id;
  if not found then
    raise exception 'Rollen finns inte' using errcode = 'no_data_found';
  end if;
  if v_role.is_system then
    raise exception 'Standardrollen % kan inte tas bort', v_role.name
      using errcode = 'insufficient_privilege';
  end if;
  select count(*) into v_assigned from public.user_roles where role_id = p_role_id;
  if v_assigned > 0 then
    raise exception 'Rollen är tilldelad % användare och kan inte tas bort', v_assigned
      using errcode = 'check_violation';
  end if;
  v_missing := private.permissions_not_held(v_actor, private.role_permission_keys(p_role_id));
  if cardinality(v_missing) > 0 then
    raise exception 'Rollen innehåller behörigheter som du själv saknar: %', array_to_string(v_missing, ', ')
      using errcode = 'insufficient_privilege';
  end if;

  delete from public.roles where id = p_role_id;

  perform private.write_audit(v_actor, 'role.deleted', 'role', p_role_id,
    format('Rollen %s togs bort', v_role.name),
    jsonb_build_object('key', v_role.key));
end;
$$;

-- -----------------------------------------------------------------------------
-- Rättigheter för funktioner
-- -----------------------------------------------------------------------------

-- Ta bort standardrättigheter från samtliga funktioner ovan.
revoke all on all functions in schema private from public, anon, authenticated, service_role;
revoke all on function public.my_access() from public, anon;
revoke all on function public.admin_assign_role(uuid, uuid) from public, anon;
revoke all on function public.admin_revoke_role(uuid, uuid) from public, anon;
revoke all on function public.admin_set_profile_status(uuid, text) from public, anon;
revoke all on function public.admin_create_role(text, text, text, text[]) from public, anon;
revoke all on function public.admin_update_role(uuid, text, text, text[]) from public, anon;
revoke all on function public.admin_delete_role(uuid) from public, anon;

-- Inloggade användare: endast RPC-funktionerna (som själva kontrollerar
-- behörighet) samt de hjälpfunktioner som RLS-policies använder.
grant usage on schema private to authenticated;
grant execute on function private.current_profile_id() to authenticated;
grant execute on function private.has_permission(text) to authenticated;
grant execute on function public.my_access() to authenticated;
grant execute on function public.admin_assign_role(uuid, uuid) to authenticated;
grant execute on function public.admin_revoke_role(uuid, uuid) to authenticated;
grant execute on function public.admin_set_profile_status(uuid, text) to authenticated;
grant execute on function public.admin_create_role(text, text, text, text[]) to authenticated;
grant execute on function public.admin_update_role(uuid, text, text, text[]) to authenticated;
grant execute on function public.admin_delete_role(uuid) to authenticated;
