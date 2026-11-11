/**
 * Behörighetsmodell för plattformen.
 *
 * Fas 1: används av demoanvändare i webbläsaren.
 * Senare: roller mappas från Microsoft Entra ID (app roles / grupper) och
 * lagras i Supabase. Gränssnittet ska bara fråga `can(permission)` och aldrig
 * kontrollera roller direkt – då kan rollerna ändras utan att UI:t påverkas.
 */

export const PERMISSIONS = [
  "dashboard.view",
  "projects.view",
  "projects.edit",
  "projects.ai",
  "admin.view",
  "admin.users",
  "admin.integrations",
  "admin.settings",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type RoleId = "admin" | "projektledare" | "arbetsledare" | "medarbetare";

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  phone: string;
  roleId: RoleId;
  /** Framtida koppling till Entra ID (objectId). Tom i demoläget. */
  externalId?: string;
}
