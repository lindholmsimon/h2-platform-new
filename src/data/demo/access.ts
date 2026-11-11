import { PERMISSION_KEYS } from "@/lib/auth/permissions";
import type { AccessRole, AuditEntry } from "@/lib/auth/types";
import { daysFromNow } from ".";

/**
 * FIKTIVA roller och aktivitetslogg för demoläget.
 * Standardrollerna motsvarar supabase/migrations/*_access_control_seed.sql.
 */

export const DEMO_ROLE_IDS = {
  systemAdmin: "10000000-0000-4000-8000-000000000001",
  projectManager: "10000000-0000-4000-8000-000000000002",
  employee: "10000000-0000-4000-8000-000000000003",
  readOnly: "10000000-0000-4000-8000-000000000004",
} as const;

export const DEMO_ROLES: AccessRole[] = [
  {
    id: DEMO_ROLE_IDS.systemAdmin,
    key: "system_admin",
    name: "Systemadministratör",
    description: "Hanterar plattformens användare, roller och behörigheter. Ger inga rättigheter i Microsoft 365.",
    isSystem: true,
    isLocked: true,
    permissions: [...PERMISSION_KEYS],
  },
  {
    id: DEMO_ROLE_IDS.projectManager,
    key: "project_manager",
    name: "Projektledare",
    description: "Leder projekt och kan skapa och redigera projekt.",
    isSystem: true,
    isLocked: false,
    permissions: [
      "dashboard.view",
      "projects.view",
      "projects.create",
      "projects.edit",
      "projects.ai",
      "users.view",
      "integrations.view",
    ],
  },
  {
    id: DEMO_ROLE_IDS.employee,
    key: "employee",
    name: "Medarbetare",
    description: "Arbetar i projekt och uppdaterar innehåll.",
    isSystem: true,
    isLocked: false,
    permissions: ["dashboard.view", "projects.view", "projects.edit"],
  },
  {
    id: DEMO_ROLE_IDS.readOnly,
    key: "read_only",
    name: "Läsbehörig",
    description: "Kan läsa dashboard och projekt men inte ändra något.",
    isSystem: true,
    isLocked: false,
    permissions: ["dashboard.view", "projects.view"],
  },
];

const ANNA = "00000000-0000-4000-8000-000000000001";

export const DEMO_AUDIT: AuditEntry[] = [
  {
    id: "20000000-0000-4000-8000-000000000003",
    occurredAt: daysFromNow(-2, -3),
    actorId: ANNA,
    action: "user.status_changed",
    targetType: "profile",
    targetId: "00000000-0000-4000-8000-000000000006",
    summary: "Maja Ström bjöds in till plattformen",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    occurredAt: daysFromNow(-6, 2),
    actorId: ANNA,
    action: "user.role_assigned",
    targetType: "profile",
    targetId: "00000000-0000-4000-8000-000000000002",
    summary: "Rollen Projektledare tilldelades Johan Ekdahl",
  },
  {
    id: "20000000-0000-4000-8000-000000000001",
    occurredAt: daysFromNow(-14),
    actorId: null,
    action: "system.bootstrap_admin",
    targetType: "profile",
    targetId: ANNA,
    summary: "Anna Bergström utsågs till första systemadministratör",
  },
];
