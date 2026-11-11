import type { Permission, Role, RoleId } from "./types";

export const PERMISSION_LABELS: Record<Permission, { label: string; description: string }> = {
  "dashboard.view": { label: "Visa dashboard", description: "Tillgång till den personliga startsidan" },
  "projects.view": { label: "Visa projekt", description: "Se projekt, filer och uppgifter" },
  "projects.edit": { label: "Redigera projekt", description: "Skapa och ändra projekt och uppgifter" },
  "projects.ai": { label: "AI-analys", description: "Köra AI-analys på projektunderlag" },
  "admin.view": { label: "Administration", description: "Öppna administrationsdelen" },
  "admin.users": { label: "Hantera användare", description: "Bjuda in användare och tilldela roller" },
  "admin.integrations": { label: "Hantera integrationer", description: "Ansluta Microsoft 365, Dropbox och Claude" },
  "admin.settings": { label: "Plattformsinställningar", description: "Ändra globala inställningar" },
};

export const ROLES: Record<RoleId, Role> = {
  admin: {
    id: "admin",
    name: "Administratör",
    description: "Full åtkomst till plattformen inklusive administration.",
    permissions: [
      "dashboard.view",
      "projects.view",
      "projects.edit",
      "projects.ai",
      "admin.view",
      "admin.users",
      "admin.integrations",
      "admin.settings",
    ],
  },
  projektledare: {
    id: "projektledare",
    name: "Projektledare",
    description: "Leder projekt och kan använda AI-analys.",
    permissions: ["dashboard.view", "projects.view", "projects.edit", "projects.ai", "admin.view"],
  },
  arbetsledare: {
    id: "arbetsledare",
    name: "Arbetsledare",
    description: "Arbetar i projekt och uppdaterar uppgifter.",
    permissions: ["dashboard.view", "projects.view", "projects.edit"],
  },
  medarbetare: {
    id: "medarbetare",
    name: "Medarbetare",
    description: "Läsbehörighet till projekt och egen dashboard.",
    permissions: ["dashboard.view", "projects.view"],
  },
};

export function hasPermission(roleId: RoleId, permission: Permission) {
  return ROLES[roleId].permissions.includes(permission);
}
