"use client";

import * as React from "react";

import { DEMO_AUDIT, DEMO_ROLES } from "@/data/demo/access";
import { DEMO_USERS } from "@/data/demo/users";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  diffPermissions,
  effectivePermissions,
  findRole,
  findUser,
  roleKeyFromName,
  rolesOf,
  validateAssignRole,
  validateCreateRole,
  validateDeleteRole,
  validateRevokeRole,
  validateSetStatus,
  validateUpdateRole,
} from "@/lib/auth/policy";
import { SessionContext, type SessionContextValue } from "@/lib/auth/session";
import { USER_STATUS, type AccessSnapshot, type AuditEntry } from "@/lib/auth/types";
import { AccessContext, type AccessActions, type AccessContextValue } from "./access-context";

/**
 * DEMOLÄGE – fiktiva användare, roller och aktivitetslogg.
 *
 * - All data finns enbart i webbläsarens localStorage.
 * - Inga anrop till Supabase eller servern görs härifrån.
 * - Reglerna i src/lib/auth/policy.ts tillämpas så att adminpanelen beter
 *   sig som den riktiga (som kontrolleras i databasen).
 */

const DATA_KEY = "h2.demo.access.v1";
const USER_KEY = "h2.demo.userId";

const initialSnapshot = (): AccessSnapshot => ({
  users: structuredClone(DEMO_USERS),
  roles: structuredClone(DEMO_ROLES),
  audit: structuredClone(DEMO_AUDIT),
});

function loadSnapshot(): AccessSnapshot | null {
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccessSnapshot;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.roles) || !Array.isArray(parsed.audit)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function save(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // localStorage kan vara blockerat – ändringen gäller då bara sessionen.
  }
}

export function DemoAccessProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = React.useState<AccessSnapshot>(initialSnapshot);
  const [userId, setUserId] = React.useState<string>(DEMO_USERS[0].id);
  const ref = React.useRef(snapshot);

  React.useEffect(() => {
    const stored = loadSnapshot();
    if (stored) {
      ref.current = stored;
      setSnapshot(stored);
    }
    try {
      const storedUser = window.localStorage.getItem(USER_KEY);
      if (storedUser && (stored ?? ref.current).users.some((u) => u.id === storedUser)) setUserId(storedUser);
    } catch {
      // ignorera
    }
  }, []);

  const actorRef = React.useRef(userId);
  actorRef.current = userId;

  const actions = React.useMemo<AccessActions>(() => {
    const commit = (next: AccessSnapshot) => {
      ref.current = next;
      setSnapshot(next);
      save(DATA_KEY, JSON.stringify(next));
    };

    const audit = (entry: Omit<AuditEntry, "id" | "occurredAt" | "actorId">): AuditEntry => ({
      ...entry,
      id: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      actorId: actorRef.current,
    });

    async function run<T>(fn: (s: AccessSnapshot, actor: string) => ActionResult<T>): Promise<ActionResult<T>> {
      return fn(ref.current, actorRef.current);
    }

    return {
      assignRole: (targetId, roleId) =>
        run((s, actor) => {
          const error = validateAssignRole(s, actor, targetId, roleId);
          if (error) return fail(error);
          const target = findUser(s, targetId)!;
          const role = findRole(s, roleId)!;
          if (target.roleIds.includes(roleId)) return ok(undefined);
          commit({
            ...s,
            users: s.users.map((u) => (u.id === targetId ? { ...u, roleIds: [...u.roleIds, roleId] } : u)),
            audit: [
              audit({
                action: "user.role_assigned",
                targetType: "profile",
                targetId,
                summary: `Rollen ${role.name} tilldelades ${target.name}`,
              }),
              ...s.audit,
            ],
          });
          return ok(undefined);
        }),

      revokeRole: (targetId, roleId) =>
        run((s, actor) => {
          const error = validateRevokeRole(s, actor, targetId, roleId);
          if (error) return fail(error);
          const target = findUser(s, targetId)!;
          const role = findRole(s, roleId)!;
          if (!target.roleIds.includes(roleId)) return ok(undefined);
          commit({
            ...s,
            users: s.users.map((u) => (u.id === targetId ? { ...u, roleIds: u.roleIds.filter((r) => r !== roleId) } : u)),
            audit: [
              audit({
                action: "user.role_revoked",
                targetType: "profile",
                targetId,
                summary: `Rollen ${role.name} togs bort från ${target.name}`,
              }),
              ...s.audit,
            ],
          });
          return ok(undefined);
        }),

      setUserStatus: (targetId, status) =>
        run((s, actor) => {
          const target = findUser(s, targetId);
          if (target && target.status === status) return ok(undefined);
          const error = validateSetStatus(s, actor, targetId, status);
          if (error) return fail(error);
          commit({
            ...s,
            users: s.users.map((u) => (u.id === targetId ? { ...u, status } : u)),
            audit: [
              audit({
                action: "user.status_changed",
                targetType: "profile",
                targetId,
                summary: `Status för ${target!.name} ändrades från ${USER_STATUS[target!.status].label.toLowerCase()} till ${USER_STATUS[status].label.toLowerCase()}`,
              }),
              ...s.audit,
            ],
          });
          return ok(undefined);
        }),

      createRole: (input) =>
        run((s, actor) => {
          const error = validateCreateRole(s, actor, input);
          if (error) return fail(error);
          const id = crypto.randomUUID();
          const permissions = [...new Set(input.permissions)].sort();
          commit({
            ...s,
            roles: [
              ...s.roles,
              {
                id,
                key: roleKeyFromName(input.name, s.roles.map((r) => r.key)),
                name: input.name.trim(),
                description: input.description.trim(),
                isSystem: false,
                isLocked: false,
                permissions,
              },
            ],
            audit: [
              audit({
                action: "role.created",
                targetType: "role",
                targetId: id,
                summary: `Rollen ${input.name.trim()} skapades`,
                details: { added: permissions },
              }),
              ...s.audit,
            ],
          });
          return ok({ id });
        }),

      updateRole: (roleId, input) =>
        run((s, actor) => {
          const error = validateUpdateRole(s, actor, roleId, input);
          if (error) return fail(error);
          const role = findRole(s, roleId)!;
          const permissions = [...new Set(input.permissions)].sort();
          const diff = diffPermissions(role.permissions, permissions);
          commit({
            ...s,
            roles: s.roles.map((r) =>
              r.id === roleId ? { ...r, name: input.name.trim(), description: input.description.trim(), permissions } : r,
            ),
            audit: [
              audit({
                action: "role.updated",
                targetType: "role",
                targetId: roleId,
                summary: `Rollen ${input.name.trim()} uppdaterades`,
                details: diff,
              }),
              ...s.audit,
            ],
          });
          return ok(undefined);
        }),

      deleteRole: (roleId) =>
        run((s, actor) => {
          const error = validateDeleteRole(s, actor, roleId);
          if (error) return fail(error);
          const role = findRole(s, roleId)!;
          commit({
            ...s,
            roles: s.roles.filter((r) => r.id !== roleId),
            audit: [
              audit({ action: "role.deleted", targetType: "role", targetId: roleId, summary: `Rollen ${role.name} togs bort` }),
              ...s.audit,
            ],
          });
          return ok(undefined);
        }),
    };
  }, []);

  const access = React.useMemo<AccessContextValue>(
    () => ({
      snapshot,
      actions,
      resetDemoData: () => {
        const fresh = initialSnapshot();
        ref.current = fresh;
        setSnapshot(fresh);
        save(DATA_KEY, null);
      },
    }),
    [snapshot, actions],
  );

  const session = React.useMemo<SessionContextValue>(() => {
    const user = findUser(snapshot, userId) ?? snapshot.users[0];
    const permissions = effectivePermissions(snapshot, user.id);
    return {
      mode: "demo",
      user,
      roles: rolesOf(snapshot, user),
      permissions,
      can: (p) => (typeof p === "string" ? [p] : p).some((key) => permissions.has(key)),
      switchUser: (id) => {
        setUserId(id);
        save(USER_KEY, id);
      },
    };
  }, [snapshot, userId]);

  return (
    <AccessContext.Provider value={access}>
      <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
    </AccessContext.Provider>
  );
}
