-- =============================================================================
-- Migration 4/4: behörighetskatalog och standardroller
-- (Grunddata som behövs i alla miljöer – innehåller inga personuppgifter.)
-- Håll i synk med src/lib/auth/permissions.ts (kontrolleras av npm run test:db).
-- =============================================================================

-- Standardroller skapas först så att triggern ger Systemadministratör
-- alla behörigheter automatiskt när katalogen fylls på.
insert into public.roles (key, name, description, is_system, is_locked) values
  ('system_admin', 'Systemadministratör',
   'Hanterar plattformens användare, roller och behörigheter. Ger inga rättigheter i Microsoft 365.', true, true),
  ('project_manager', 'Projektledare', 'Leder projekt och kan skapa och redigera projekt.', true, false),
  ('employee', 'Medarbetare', 'Arbetar i projekt och uppdaterar innehåll.', true, false),
  ('read_only', 'Läsbehörig', 'Kan läsa dashboard och projekt men inte ändra något.', true, false);

insert into public.permissions (key, category, label, description) values
  ('dashboard.view',      'Dashboard',     'Visa dashboard',           'Tillgång till den personliga startsidan'),
  ('projects.view',       'Projekt',       'Visa projekt',             'Se projekt, filer och uppgifter'),
  ('projects.create',     'Projekt',       'Skapa projekt',            'Skapa nya projekt'),
  ('projects.edit',       'Projekt',       'Redigera projekt',         'Ändra projekt, filer och uppgifter'),
  ('projects.delete',     'Projekt',       'Ta bort projekt',          'Ta bort eller arkivera projekt'),
  ('projects.ai',         'Projekt',       'AI-analys',                'Köra AI-analys på projektunderlag'),
  ('users.view',          'Användare',     'Visa användare',           'Se användare och deras roller'),
  ('users.manage',        'Användare',     'Hantera användare',        'Tilldela roller och ändra status på användare'),
  ('roles.view',          'Roller',        'Visa roller',              'Se roller och deras behörigheter'),
  ('roles.manage',        'Roller',        'Hantera roller',           'Skapa, ändra och ta bort roller'),
  ('integrations.view',   'Integrationer', 'Visa integrationer',       'Se status för integrationer'),
  ('integrations.manage', 'Integrationer', 'Hantera integrationer',    'Ansluta och koppla från integrationer'),
  ('settings.view',       'Inställningar', 'Visa inställningar',       'Se plattformens inställningar'),
  ('settings.manage',     'Inställningar', 'Ändra inställningar',      'Ändra plattformens inställningar'),
  ('audit.view',          'Aktivitetslogg','Visa aktivitetslogg',      'Se historik över administrativa ändringar');

insert into public.role_permissions (role_id, permission_id)
select r.id, perm.id
from public.roles r
join public.permissions perm on perm.key = any (case r.key
  when 'project_manager' then array[
    'dashboard.view', 'projects.view', 'projects.create', 'projects.edit', 'projects.ai',
    'users.view', 'integrations.view']
  when 'employee' then array['dashboard.view', 'projects.view', 'projects.edit']
  when 'read_only' then array['dashboard.view', 'projects.view']
  else array[]::text[]
end)
on conflict do nothing;
