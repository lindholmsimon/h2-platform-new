"use client";

import * as React from "react";

import type { ActionResult } from "@/lib/action-result";
import type { AccessSnapshot, RoleInput, UserStatus } from "@/lib/auth/types";

/**
 * Kontrakt för administration av användare och roller.
 *
 * Demoläget: DemoAccessProvider (fiktiv data i webbläsaren).
 * Riktigt läge (senare): en provider som anropar serveråtgärderna i
 * src/server/admin/actions.ts, som i sin tur anropar databasfunktionerna.
 */
export interface AccessActions {
  assignRole(userId: string, roleId: string): Promise<ActionResult>;
  revokeRole(userId: string, roleId: string): Promise<ActionResult>;
  setUserStatus(userId: string, status: UserStatus): Promise<ActionResult>;
  createRole(input: RoleInput): Promise<ActionResult<{ id: string }>>;
  updateRole(roleId: string, input: RoleInput): Promise<ActionResult>;
  deleteRole(roleId: string): Promise<ActionResult>;
}

export interface AccessContextValue {
  snapshot: AccessSnapshot;
  actions: AccessActions;
  /** Endast i demoläget: återställ fiktiv data. */
  resetDemoData?: () => void;
}

export const AccessContext = React.createContext<AccessContextValue | null>(null);

export function useAccess() {
  const ctx = React.useContext(AccessContext);
  if (!ctx) throw new Error("useAccess måste användas inom en åtkomstprovider");
  return ctx;
}
