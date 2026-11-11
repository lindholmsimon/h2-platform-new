import { PERMISSION_KEYS, SYSTEM_ADMIN_ROLE_KEY, type Permission } from "./permissions";
import type { AccessRole, AccessSnapshot, AccessUser, RoleInput, UserStatus } from "./types";

/**
 * Behörighetsregler i TypeScript.
 *
 * Speglar databasfunktionerna i
 * supabase/migrations/20261111120100_access_control_functions.sql.
 * I demoläget är detta den enda kontrollen. I riktigt läge är DATABASEN
 * auktoritativ – dessa funktioner används då bara för att ge tidig återkoppling
 * i gränssnittet. Ändras en regel ska den ändras på båda ställena.
 *
 * Valideringsfunktionerna returnerar ett felmeddelande, eller null om
 * operationen är tillåten.
 */

type Snapshot = Pick<AccessSnapshot, "users" | "roles">;

export function findUser(s: Snapshot, id: string) {
  return s.users.find((u) => u.id === id);
}

export function findRole(s: Snapshot, id: string) {
  return s.roles.find((r) => r.id === id);
}

export function rolesOf(s: Snapshot, user: AccessUser) {
  return s.roles.filter((r) => user.roleIds.includes(r.id));
}

/** Effektiva behörigheter = union av alla roller. Inaktiva användare har inga. */
export function effectivePermissions(s: Snapshot, userId: string): Set<Permission> {
  const user = findUser(s, userId);
  if (!user || user.status !== "active") return new Set();
  return new Set(rolesOf(s, user).flatMap((r) => r.permissions));
}

/** Vilka roller som ger respektive behörighet (för att visa ursprung i UI). */
export function permissionSources(s: Snapshot, userId: string) {
  const user = findUser(s, userId);
  const sources = new Map<Permission, AccessRole[]>();
  if (!user) return sources;
  for (const role of rolesOf(s, user)) {
    for (const p of role.permissions) sources.set(p, [...(sources.get(p) ?? []), role]);
  }
  return sources;
}

export function hasRoleKey(s: Snapshot, userId: string, key: string) {
  const user = findUser(s, userId);
  return !!user && rolesOf(s, user).some((r) => r.key === key);
}

export function activeSystemAdminCount(s: Snapshot) {
  return s.users.filter((u) => u.status === "active" && hasRoleKey(s, u.id, SYSTEM_ADMIN_ROLE_KEY)).length;
}

function notHeld(s: Snapshot, actorId: string, keys: Iterable<Permission>) {
  const held = effectivePermissions(s, actorId);
  return [...new Set(keys)].filter((k) => !held.has(k)).sort();
}

function requirePermission(s: Snapshot, actorId: string, permission: Permission) {
  const actor = findUser(s, actorId);
  if (!actor || actor.status !== "active") return "Du måste vara inloggad med ett aktivt konto";
  if (!effectivePermissions(s, actorId).has(permission)) return `Behörighet saknas: ${permission}`;
  return null;
}

export function checkCanManageUser(s: Snapshot, actorId: string, targetId: string) {
  if (actorId === targetId) return "Du kan inte ändra dina egna roller eller din egen status";
  if (hasRoleKey(s, targetId, SYSTEM_ADMIN_ROLE_KEY) && !hasRoleKey(s, actorId, SYSTEM_ADMIN_ROLE_KEY)) {
    return "Endast en systemadministratör kan ändra en annan systemadministratör";
  }
  const missing = notHeld(s, actorId, effectivePermissions(s, targetId));
  if (missing.length) return `Användaren har behörigheter som du själv saknar: ${missing.join(", ")}`;
  return null;
}

export function checkCanGrantRole(s: Snapshot, actorId: string, role: AccessRole) {
  if (role.key === SYSTEM_ADMIN_ROLE_KEY && !hasRoleKey(s, actorId, SYSTEM_ADMIN_ROLE_KEY)) {
    return "Endast en systemadministratör kan hantera rollen Systemadministratör";
  }
  const missing = notHeld(s, actorId, role.permissions);
  if (missing.length) return `Rollen innehåller behörigheter som du själv saknar: ${missing.join(", ")}`;
  return null;
}

function withUser(s: Snapshot, user: AccessUser): Snapshot {
  return { ...s, users: s.users.map((u) => (u.id === user.id ? user : u)) };
}

export function validateAssignRole(s: Snapshot, actorId: string, targetId: string, roleId: string) {
  const target = findUser(s, targetId);
  const role = findRole(s, roleId);
  return (
    requirePermission(s, actorId, "users.manage") ??
    (!target ? "Användaren finns inte" : null) ??
    (!role ? "Rollen finns inte" : null) ??
    checkCanManageUser(s, actorId, targetId) ??
    checkCanGrantRole(s, actorId, role!)
  );
}

export function validateRevokeRole(s: Snapshot, actorId: string, targetId: string, roleId: string) {
  const error = validateAssignRole(s, actorId, targetId, roleId);
  if (error) return error;
  const target = findUser(s, targetId)!;
  const after = withUser(s, { ...target, roleIds: target.roleIds.filter((id) => id !== roleId) });
  if (activeSystemAdminCount(after) < 1) return "Det måste finnas minst en aktiv systemadministratör";
  return null;
}

export function validateSetStatus(s: Snapshot, actorId: string, targetId: string, status: UserStatus) {
  const target = findUser(s, targetId);
  const error =
    requirePermission(s, actorId, "users.manage") ??
    (!target ? "Användaren finns inte" : null) ??
    checkCanManageUser(s, actorId, targetId);
  if (error) return error;
  if (activeSystemAdminCount(withUser(s, { ...target!, status })) < 1) {
    return "Det måste finnas minst en aktiv systemadministratör";
  }
  return null;
}

function validateRoleInput(s: Snapshot, input: RoleInput, ignoreRoleId?: string) {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 80) return "Namnet måste vara 1–80 tecken";
  if (input.description.length > 500) return "Beskrivningen får vara högst 500 tecken";
  if (s.roles.some((r) => r.id !== ignoreRoleId && r.name.toLowerCase() === name.toLowerCase())) {
    return "Det finns redan en roll med det namnet";
  }
  const unknown = input.permissions.filter((p) => !(PERMISSION_KEYS as readonly string[]).includes(p));
  if (unknown.length) return `Okända behörigheter: ${unknown.join(", ")}`;
  return null;
}

export function validateCreateRole(s: Snapshot, actorId: string, input: RoleInput) {
  const error = requirePermission(s, actorId, "roles.manage") ?? validateRoleInput(s, input);
  if (error) return error;
  const missing = notHeld(s, actorId, input.permissions);
  if (missing.length) return `Du kan inte ge en roll behörigheter som du själv saknar: ${missing.join(", ")}`;
  return null;
}

export function diffPermissions(before: Permission[], after: Permission[]) {
  return {
    added: after.filter((p) => !before.includes(p)).sort(),
    removed: before.filter((p) => !after.includes(p)).sort(),
  };
}

export function validateUpdateRole(s: Snapshot, actorId: string, roleId: string, input: RoleInput) {
  const role = findRole(s, roleId);
  const error =
    requirePermission(s, actorId, "roles.manage") ??
    (!role ? "Rollen finns inte" : null) ??
    validateRoleInput(s, input, roleId);
  if (error) return error;
  const { added, removed } = diffPermissions(role!.permissions, input.permissions);
  if (role!.isLocked && (added.length || removed.length)) {
    return `Rollen ${role!.name} är låst och dess behörigheter kan inte ändras`;
  }
  const missing = notHeld(s, actorId, [...role!.permissions, ...input.permissions]);
  if (missing.length) return `Rollen innehåller behörigheter som du själv saknar: ${missing.join(", ")}`;
  if (added.length && findUser(s, actorId)?.roleIds.includes(roleId)) {
    return "Du kan inte utöka behörigheterna för en roll som du själv har";
  }
  return null;
}

export function validateDeleteRole(s: Snapshot, actorId: string, roleId: string) {
  const role = findRole(s, roleId);
  const error = requirePermission(s, actorId, "roles.manage") ?? (!role ? "Rollen finns inte" : null);
  if (error) return error;
  if (role!.isSystem) return `Standardrollen ${role!.name} kan inte tas bort`;
  const assigned = s.users.filter((u) => u.roleIds.includes(roleId)).length;
  if (assigned) return `Rollen är tilldelad ${assigned} användare och kan inte tas bort`;
  const missing = notHeld(s, actorId, role!.permissions);
  if (missing.length) return `Rollen innehåller behörigheter som du själv saknar: ${missing.join(", ")}`;
  return null;
}

/** Skapar en teknisk nyckel (roles.key) från ett rollnamn, t.ex. "Platschef Norr" → "platschef_norr". */
export function roleKeyFromName(name: string, existingKeys: string[]) {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/^[^a-z]+/, "")
      .slice(0, 40) || "roll";
  const key = base.length < 2 ? `${base}_roll` : base;
  let candidate = key;
  for (let i = 2; existingKeys.includes(candidate); i++) candidate = `${key}_${i}`;
  return candidate;
}
