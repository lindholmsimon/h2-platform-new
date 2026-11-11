-- =============================================================================
-- FIKTIVA testanvändare för LOKAL utveckling (`supabase db reset`).
-- Körs aldrig mot produktion. Inga riktiga personuppgifter.
-- =============================================================================
insert into public.profiles (id, email, display_name, job_title, department, status) values
  ('00000000-0000-4000-8000-000000000001', 'anna.bergstrom@demo.example', 'Anna Bergström', 'IT- och verksamhetsansvarig', 'Ledning', 'active'),
  ('00000000-0000-4000-8000-000000000002', 'johan.ekdahl@demo.example', 'Johan Ekdahl', 'Projektledare', 'Produktion', 'active'),
  ('00000000-0000-4000-8000-000000000003', 'sara.nyqvist@demo.example', 'Sara Nyqvist', 'Arbetsledare', 'Produktion', 'active'),
  ('00000000-0000-4000-8000-000000000004', 'omar.haddad@demo.example', 'Omar Haddad', 'Kalkylator', 'Kalkyl', 'active');

insert into public.user_roles (profile_id, role_id)
select v.profile_id::uuid, r.id
from (values
  ('00000000-0000-4000-8000-000000000001', 'system_admin'),
  ('00000000-0000-4000-8000-000000000002', 'project_manager'),
  ('00000000-0000-4000-8000-000000000003', 'employee'),
  ('00000000-0000-4000-8000-000000000004', 'read_only')
) as v(profile_id, role_key)
join public.roles r on r.key = v.role_key;
