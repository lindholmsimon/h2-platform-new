-- =============================================================================
-- Migration 5: begränsa service_role
--
-- Supabase ger som standard rollen service_role ALLA rättigheter till nya
-- tabeller och funktioner i schemat public, och service_role går förbi RLS.
-- Med service_role-nyckeln skulle man därför kunna skriva direkt i
-- user_roles/role_permissions (t.ex. göra någon till systemadministratör)
-- utan att skyddsreglerna eller aktivitetsloggen träder in, och lägga in
-- falska poster i aktivitetsloggen.
--
-- Applikationen använder inte service_role-nyckeln (servern anropar Supabase
-- med den inloggade användarens session), så rättigheterna tas bort helt:
--
--   - Tabellerna: inga rättigheter alls för service_role.
--   - Admin-funktionerna och my_access(): ingen EXECUTE för service_role.
--     De kräver ändå en inloggad användare (auth.uid()), som service_role
--     saknar, så de kunde aldrig användas meningsfullt med den nyckeln.
--   - Schemat private: redan stängt för service_role i migration 2.
--
-- Påverkas INTE:
--   - Supabase Dashboard (Table Editor och SQL-editorn kör som postgres).
--   - Supabase Auth (körs som supabase_auth_admin; auth-schemat är orört).
--   - Främmande nyckeln profiles.auth_user_id → auth.users (referentiella
--     åtgärder körs med tabellägarens rättigheter).
--   - private.bootstrap_system_admin, som körs i SQL-editorn som postgres.
--
-- Behöver en framtida serverfunktion verkligen service_role ska det ske med
-- en avgränsad GRANT i en ny migration, aldrig genom att återställa allt.
-- =============================================================================

revoke all on table
  public.profiles, public.permissions, public.roles,
  public.role_permissions, public.user_roles, public.audit_log
from service_role;

revoke all on function public.my_access() from service_role;
revoke all on function public.admin_assign_role(uuid, uuid) from service_role;
revoke all on function public.admin_revoke_role(uuid, uuid) from service_role;
revoke all on function public.admin_set_profile_status(uuid, text) from service_role;
revoke all on function public.admin_create_role(text, text, text, text[]) from service_role;
revoke all on function public.admin_update_role(uuid, text, text, text[]) from service_role;
revoke all on function public.admin_delete_role(uuid) from service_role;
