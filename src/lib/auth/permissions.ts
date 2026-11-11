/**
 * Behörighetskatalog – källan för behörighetsnycklar i applikationen.
 *
 * Måste hållas i synk med supabase/migrations/*_access_control_seed.sql.
 * `npm run test:db` misslyckas om de skiljer sig åt.
 *
 * Filen får inte importera andra moduler (används även av databastesterna).
 */

export const PERMISSION_KEYS = [
  "dashboard.view",
  "projects.view",
  "projects.create",
  "projects.edit",
  "projects.delete",
  "projects.ai",
  "users.view",
  "users.manage",
  "roles.view",
  "roles.manage",
  "integrations.view",
  "integrations.manage",
  "settings.view",
  "settings.manage",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSION_KEYS)[number];

export interface PermissionDefinition {
  key: Permission;
  category: string;
  label: string;
  description: string;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  { key: "dashboard.view", category: "Dashboard", label: "Visa dashboard", description: "Tillgång till den personliga startsidan" },
  { key: "projects.view", category: "Projekt", label: "Visa projekt", description: "Se projekt, filer och uppgifter" },
  { key: "projects.create", category: "Projekt", label: "Skapa projekt", description: "Skapa nya projekt" },
  { key: "projects.edit", category: "Projekt", label: "Redigera projekt", description: "Ändra projekt, filer och uppgifter" },
  { key: "projects.delete", category: "Projekt", label: "Ta bort projekt", description: "Ta bort eller arkivera projekt" },
  { key: "projects.ai", category: "Projekt", label: "AI-analys", description: "Köra AI-analys på projektunderlag" },
  { key: "users.view", category: "Användare", label: "Visa användare", description: "Se användare och deras roller" },
  { key: "users.manage", category: "Användare", label: "Hantera användare", description: "Tilldela roller och ändra status på användare" },
  { key: "roles.view", category: "Roller", label: "Visa roller", description: "Se roller och deras behörigheter" },
  { key: "roles.manage", category: "Roller", label: "Hantera roller", description: "Skapa, ändra och ta bort roller" },
  { key: "integrations.view", category: "Integrationer", label: "Visa integrationer", description: "Se status för integrationer" },
  { key: "integrations.manage", category: "Integrationer", label: "Hantera integrationer", description: "Ansluta och koppla från integrationer" },
  { key: "settings.view", category: "Inställningar", label: "Visa inställningar", description: "Se plattformens inställningar" },
  { key: "settings.manage", category: "Inställningar", label: "Ändra inställningar", description: "Ändra plattformens inställningar" },
  { key: "audit.view", category: "Aktivitetslogg", label: "Visa aktivitetslogg", description: "Se historik över administrativa ändringar" },
];

export function isPermission(value: string): value is Permission {
  return (PERMISSION_KEYS as readonly string[]).includes(value);
}

export const SYSTEM_ADMIN_ROLE_KEY = "system_admin";
