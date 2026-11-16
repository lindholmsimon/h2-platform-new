-- =============================================================================
-- Migration 6: koppla Microsoft-inloggning (Supabase Auth, Azure) till profiler
--
-- Flöde: användaren loggar in med Microsoft → Supabase Auth skapar/uppdaterar
-- auth.users + auth.identities (provider 'azure') → appens callback anropar
-- public.link_my_profile() med användarens session.
--
-- Säkerhet:
--   - Tenant-ID läses från den VERIFIERADE identiteten som Supabase Auth
--     sparat i auth.identities, aldrig från user_metadata (som användaren
--     själv kan ändra) eller från klienten.
--   - Endast den tenant som uttryckligen satts med
--     private.set_allowed_entra_tenant() släpps in. Ej satt = ingen kan
--     koppla en profil (stängt som standard).
--   - Nya profiler skapas aktiva men UTAN roller, dvs. utan behörigheter.
--   - Koppling till en befintlig profil via e-post kräver att Supabase Auth
--     har bekräftat e-postadressen och att profilen inte redan tillhör en
--     annan inloggning eller Microsoft-identitet.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Inställningar för inloggning (en rad). Schemat private exponeras inte via API.
-- -----------------------------------------------------------------------------
create table private.auth_settings (
  id                       boolean primary key default true,
  allowed_entra_tenant_id  uuid,
  updated_at               timestamptz not null default now(),
  constraint auth_settings_single_row check (id)
);

insert into private.auth_settings (id) values (true);

revoke all on table private.auth_settings from public, anon, authenticated, service_role;

-- Sätter H2:s Microsoft-tenant. Körs MANUELLT i SQL-editorn (ingen API-rätt).
create function private.set_allowed_entra_tenant(p_tenant_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_previous uuid;
begin
  select allowed_entra_tenant_id into v_previous from private.auth_settings;
  update private.auth_settings set allowed_entra_tenant_id = p_tenant_id, updated_at = now();
  perform private.write_audit(null, 'system.allowed_tenant_set', 'system', null,
    format('Tillåten Microsoft-tenant ändrades till %s', coalesce(p_tenant_id::text, 'ingen')),
    jsonb_build_object('from', v_previous, 'to', p_tenant_id));
end;
$$;

-- -----------------------------------------------------------------------------
-- Läser tid/oid ur identitetsdata från Supabase Auth.
-- Microsofts v2-token har alltid tenant-ID i utfärdaren (iss):
-- https://login.microsoftonline.com/<tid>/v2.0
-- -----------------------------------------------------------------------------
create function private.uuid_or_null(p_value text) returns uuid
language sql immutable set search_path = '' as $$
  select case
    when p_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then p_value::uuid
  end;
$$;

create function private.entra_tenant_from_identity(p_identity jsonb) returns uuid
language sql immutable set search_path = '' as $$
  select private.uuid_or_null(coalesce(
    p_identity -> 'custom_claims' ->> 'tid',
    p_identity ->> 'tid',
    substring(p_identity ->> 'iss' from 'login\.microsoftonline\.com/([0-9A-Fa-f-]{36})/')
  ));
$$;

create function private.entra_object_id_from_identity(p_identity jsonb) returns uuid
language sql immutable set search_path = '' as $$
  select private.uuid_or_null(coalesce(
    p_identity -> 'custom_claims' ->> 'oid',
    p_identity ->> 'oid'
  ));
$$;

-- -----------------------------------------------------------------------------
-- Kopplar den inloggade användaren till en profil (skapar den vid behov).
-- Anropas av servern direkt efter inloggning, med användarens session.
-- -----------------------------------------------------------------------------
create function public.link_my_profile() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid       uuid := auth.uid();
  v_allowed   uuid;
  v_identity  auth.identities;
  v_user      auth.users;
  v_tid       uuid;
  v_oid       uuid;
  v_email     text;
  v_name      text;
  v_profile   public.profiles;
  v_created   boolean := false;
  v_linked    boolean := false;
begin
  if v_uid is null then
    raise exception 'Du måste vara inloggad' using errcode = 'invalid_authorization_specification';
  end if;

  perform private.lock_access_control();

  select allowed_entra_tenant_id into v_allowed from private.auth_settings;
  if v_allowed is null then
    raise exception 'Microsoft-inloggning är inte konfigurerad (tillåten tenant saknas)'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_identity
  from auth.identities i
  where i.user_id = v_uid and i.provider = 'azure'
  order by i.last_sign_in_at desc nulls last
  limit 1;
  if v_identity.id is null then
    raise exception 'Endast inloggning med Microsoft-konto stöds' using errcode = 'insufficient_privilege';
  end if;

  v_tid := private.entra_tenant_from_identity(v_identity.identity_data);
  if v_tid is distinct from v_allowed then
    raise exception 'Kontot tillhör inte H2:s organisation' using errcode = 'insufficient_privilege';
  end if;
  v_oid := private.entra_object_id_from_identity(v_identity.identity_data);

  select * into v_user from auth.users u where u.id = v_uid;
  v_email := lower(btrim(coalesce(v_user.email, v_identity.email, v_identity.identity_data ->> 'email')));
  if v_email is null or position('@' in v_email) < 2 then
    raise exception 'Microsoft-kontot saknar e-postadress' using errcode = 'invalid_parameter_value';
  end if;
  v_name := coalesce(
    nullif(btrim(v_identity.identity_data ->> 'name'), ''),
    nullif(btrim(v_identity.identity_data ->> 'full_name'), ''),
    split_part(v_email, '@', 1));

  -- 1. Redan kopplad.
  select * into v_profile from public.profiles p where p.auth_user_id = v_uid;

  -- 2. Förskapad profil med samma Microsoft-identitet.
  if v_profile.id is null and v_oid is not null then
    select * into v_profile from public.profiles p
    where p.entra_tenant_id = v_tid and p.entra_object_id = v_oid and p.auth_user_id is null;
    v_linked := v_profile.id is not null;
  end if;

  -- 3. Förskapad profil med samma e-post (t.ex. via bootstrap_system_admin).
  if v_profile.id is null then
    select * into v_profile from public.profiles p where lower(p.email) = v_email;
    if v_profile.id is not null then
      if v_profile.auth_user_id is not null then
        raise exception 'E-postadressen är redan kopplad till en annan inloggning'
          using errcode = 'unique_violation';
      end if;
      if v_profile.entra_object_id is not null
         and (v_profile.entra_tenant_id, v_profile.entra_object_id) is distinct from (v_tid, v_oid) then
        raise exception 'Profilen tillhör en annan Microsoft-identitet' using errcode = 'unique_violation';
      end if;
      if v_user.email_confirmed_at is null then
        raise exception 'E-postadressen är inte bekräftad av Microsoft' using errcode = 'insufficient_privilege';
      end if;
      v_linked := true;
    end if;
  end if;

  if v_profile.id is not null then
    update public.profiles p set
      auth_user_id    = v_uid,
      entra_tenant_id = case when p.entra_object_id is null and v_oid is not null then v_tid else p.entra_tenant_id end,
      entra_object_id = coalesce(p.entra_object_id, v_oid),
      status          = case when p.status = 'invited' then 'active' else p.status end,
      last_sign_in_at = now()
    where p.id = v_profile.id
    returning * into v_profile;

    if v_linked then
      perform private.write_audit(v_profile.id, 'user.linked', 'profile', v_profile.id,
        format('%s loggade in första gången och kopplades till sin profil', v_profile.display_name),
        jsonb_build_object('email', v_email));
    end if;
  else
    insert into public.profiles (auth_user_id, entra_tenant_id, entra_object_id, email, display_name, status, last_sign_in_at)
    values (v_uid,
            case when v_oid is not null then v_tid end,
            v_oid,
            v_email, v_name, 'active', now())
    returning * into v_profile;
    v_created := true;

    perform private.write_audit(v_profile.id, 'user.created', 'profile', v_profile.id,
      format('%s loggade in första gången (ingen roll tilldelad)', v_profile.display_name),
      jsonb_build_object('email', v_email));
  end if;

  return jsonb_build_object('profile_id', v_profile.id, 'status', v_profile.status, 'created', v_created);
end;
$$;

-- -----------------------------------------------------------------------------
-- Den inloggades egna roller med behörigheter. Behövs för att visa "Mina
-- behörigheter" för användare som inte får läsa rolltabellerna (RLS).
-- -----------------------------------------------------------------------------
create function public.my_roles() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'key', r.key, 'name', r.name, 'description', r.description,
      'is_system', r.is_system, 'is_locked', r.is_locked,
      'permissions', to_jsonb(private.role_permission_keys(r.id))
    ) order by r.name), '[]'::jsonb)
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.profile_id = private.current_profile_id();
$$;

-- -----------------------------------------------------------------------------
-- Rättigheter
-- -----------------------------------------------------------------------------
revoke all on function private.set_allowed_entra_tenant(uuid) from public, anon, authenticated, service_role;
revoke all on function private.uuid_or_null(text) from public, anon, authenticated, service_role;
revoke all on function private.entra_tenant_from_identity(jsonb) from public, anon, authenticated, service_role;
revoke all on function private.entra_object_id_from_identity(jsonb) from public, anon, authenticated, service_role;

revoke all on function public.link_my_profile() from public, anon, service_role;
revoke all on function public.my_roles() from public, anon, service_role;
grant execute on function public.link_my_profile() to authenticated;
grant execute on function public.my_roles() to authenticated;
