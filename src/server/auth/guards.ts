import "server-only";

import type { Permission } from "@/lib/auth/permissions";
import { getVerifiedIdentity, type VerifiedIdentity } from "./identity";

export type AuthErrorCode = "unauthenticated" | "forbidden" | "disabled";

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** Kräver verifierad inloggning. Används i Server Actions, Route Handlers och Server Components. */
export async function requireIdentity(): Promise<VerifiedIdentity> {
  const identity = await getVerifiedIdentity();
  if (!identity) throw new AuthError("unauthenticated", "Du måste vara inloggad.");
  return identity;
}

/** Kräver verifierad inloggning och minst en av behörigheterna. */
export async function requirePermission(permission: Permission | readonly Permission[]): Promise<VerifiedIdentity> {
  const identity = await requireIdentity();
  const required = typeof permission === "string" ? [permission] : permission;
  if (!required.some((p) => identity.permissions.has(p))) {
    throw new AuthError("forbidden", `Behörighet saknas: ${required.join(" eller ")}`);
  }
  return identity;
}

export async function hasPermission(permission: Permission) {
  const identity = await getVerifiedIdentity();
  return !!identity?.permissions.has(permission);
}
