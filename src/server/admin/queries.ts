import "server-only";

import { isPermission, type Permission } from "@/lib/auth/permissions";
import type { AccessRole, AccessSnapshot, AccessUser, AuditEntry, UserStatus } from "@/lib/auth/types";
import { requirePermission } from "@/server/auth/guards";
import { createSupabaseServerClient } from "@/server/supabase/server-client";

/**
 * Läsfrågor för administrationen (riktigt läge). Kräver verifierad identitet
 * med rätt behörighet; RLS i databasen begränsar dessutom vad som returneras.
 */

interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  job_title: string | null;
  department: string | null;
  phone: string | null;
  status: UserStatus;
  entra_tenant_id: string | null;
  entra_object_id: string | null;
  user_roles: { role_id: string }[];
}

interface RoleRow {
  id: string;
  key: string;
  name: string;
  description: string;
  is_system: boolean;
  is_locked: boolean;
  role_permissions: { permissions: { key: string } | null }[];
}

interface AuditRow {
  id: string;
  occurred_at: string;
  actor_profile_id: string | null;
  action: AuditEntry["action"];
  target_type: AuditEntry["targetType"];
  target_id: string | null;
  summary: string;
  details: { added?: string[]; removed?: string[] } | null;
}

const toPermissions = (keys: (string | undefined)[] = []): Permission[] =>
  keys.filter((k): k is Permission => !!k && isPermission(k));

export async function loadAccessSnapshot(): Promise<AccessSnapshot> {
  const identity = await requirePermission(["users.view", "roles.view"]);
  const supabase = await createSupabaseServerClient();

  const [profiles, roles] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, display_name, job_title, department, phone, status, entra_tenant_id, entra_object_id, user_roles!user_roles_profile_id_fkey(role_id)",
      )
      .order("display_name"),
    supabase
      .from("roles")
      .select("id, key, name, description, is_system, is_locked, role_permissions(permissions(key))")
      .order("name"),
  ]);
  if (profiles.error) throw profiles.error;
  if (roles.error) throw roles.error;

  const users: AccessUser[] = (profiles.data as unknown as ProfileRow[]).map((p) => ({
    id: p.id,
    name: p.display_name,
    email: p.email,
    title: p.job_title ?? "",
    department: p.department ?? "",
    phone: p.phone ?? "",
    status: p.status,
    roleIds: p.user_roles.map((r) => r.role_id),
    entraTenantId: p.entra_tenant_id ?? undefined,
    entraObjectId: p.entra_object_id ?? undefined,
  }));

  const accessRoles: AccessRole[] = (roles.data as unknown as RoleRow[]).map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    isSystem: r.is_system,
    isLocked: r.is_locked,
    permissions: toPermissions(r.role_permissions.map((rp) => rp.permissions?.key)),
  }));

  const audit = identity.permissions.has("audit.view") ? await loadAuditLog() : [];
  return { users, roles: accessRoles, audit };
}

export async function loadAuditLog(limit = 200): Promise<AuditEntry[]> {
  await requirePermission("audit.view");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, occurred_at, actor_profile_id, action, target_type, target_id, summary, details")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as AuditRow[]).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    actorId: row.actor_profile_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    summary: row.summary,
    details: row.details
      ? { added: toPermissions(row.details.added), removed: toPermissions(row.details.removed) }
      : undefined,
  }));
}
