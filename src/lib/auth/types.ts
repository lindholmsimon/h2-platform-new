import type { Permission } from "./permissions";

/**
 * Domäntyper för användare, roller och aktivitetslogg.
 * Speglar tabellerna i supabase/migrations (camelCase i stället för snake_case).
 * Alla ID:n är UUID.
 */

export type { Permission } from "./permissions";

export type UserStatus = "invited" | "active" | "inactive";

export const USER_STATUS: Record<UserStatus, { label: string; variant: "success" | "info" | "secondary" }> = {
  active: { label: "Aktiv", variant: "success" },
  invited: { label: "Inbjuden", variant: "info" },
  inactive: { label: "Inaktiv", variant: "secondary" },
};

export interface AccessRole {
  id: string;
  key: string;
  name: string;
  description: string;
  /** Standardroll – kan inte tas bort. */
  isSystem: boolean;
  /** Låst – behörigheterna kan inte ändras (Systemadministratör). */
  isLocked: boolean;
  permissions: Permission[];
}

export interface AccessUser {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  phone: string;
  status: UserStatus;
  roleIds: string[];
  /** Microsoft Entra ID (tid / oid). Sätts när riktig inloggning finns. */
  entraTenantId?: string;
  entraObjectId?: string;
}

export type AuditAction =
  | "system.bootstrap_admin"
  | "user.role_assigned"
  | "user.role_revoked"
  | "user.status_changed"
  | "role.created"
  | "role.updated"
  | "role.deleted";

export interface AuditEntry {
  id: string;
  occurredAt: string;
  /** null = systemet */
  actorId: string | null;
  action: AuditAction;
  targetType: "profile" | "role" | "system";
  targetId: string | null;
  summary: string;
  details?: { added?: Permission[]; removed?: Permission[] };
}

export interface AccessSnapshot {
  users: AccessUser[];
  roles: AccessRole[];
  audit: AuditEntry[];
}

export interface RoleInput {
  name: string;
  description: string;
  permissions: Permission[];
}
