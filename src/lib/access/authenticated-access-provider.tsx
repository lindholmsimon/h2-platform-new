"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/lib/action-result";
import type { Permission } from "@/lib/auth/permissions";
import { findUser, rolesOf } from "@/lib/auth/policy";
import { SessionContext, type SessionContextValue } from "@/lib/auth/session";
import type { AccessSnapshot } from "@/lib/auth/types";
import {
  assignRoleAction,
  createRoleAction,
  deleteRoleAction,
  revokeRoleAction,
  setUserStatusAction,
  updateRoleAction,
} from "@/server/admin/actions";
import { AccessContext, type AccessActions, type AccessContextValue } from "./access-context";

/**
 * Riktig inloggning. Identitet, behörigheter och data kommer från servern
 * (verifierade där). Ändringar går via serveråtgärder, som kontrolleras på
 * servern och i databasen. Klienten kan alltså inte ge sig själv behörighet:
 * `can()` här styr bara vad som visas.
 */
export function AuthenticatedAccessProvider({
  snapshot,
  userId,
  permissions,
  children,
}: {
  snapshot: AccessSnapshot;
  userId: string;
  permissions: Permission[];
  children: React.ReactNode;
}) {
  const router = useRouter();

  const actions = React.useMemo<AccessActions>(() => {
    const refreshOnSuccess = async <T,>(promise: Promise<ActionResult<T>>) => {
      const result = await promise;
      if (result.ok) router.refresh();
      return result;
    };
    return {
      assignRole: (u, r) => refreshOnSuccess(assignRoleAction(u, r)),
      revokeRole: (u, r) => refreshOnSuccess(revokeRoleAction(u, r)),
      setUserStatus: (u, s) => refreshOnSuccess(setUserStatusAction(u, s)),
      createRole: (input) => refreshOnSuccess(createRoleAction(input)),
      updateRole: (id, input) => refreshOnSuccess(updateRoleAction(id, input)),
      deleteRole: (id) => refreshOnSuccess(deleteRoleAction(id)),
    };
  }, [router]);

  const access = React.useMemo<AccessContextValue>(() => ({ snapshot, actions }), [snapshot, actions]);

  const session = React.useMemo<SessionContextValue>(() => {
    const user = findUser(snapshot, userId)!;
    const set = new Set(permissions);
    return {
      mode: "authenticated",
      user,
      roles: rolesOf(snapshot, user),
      permissions: set,
      can: (p) => (typeof p === "string" ? [p] : p).some((key) => set.has(key)),
    };
  }, [snapshot, userId, permissions]);

  return (
    <AccessContext.Provider value={access}>
      <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
    </AccessContext.Provider>
  );
}
