"use client";

import * as React from "react";

import type { Permission } from "./permissions";
import type { AccessRole, AccessUser } from "./types";

/**
 * Sessionskontrakt för klienten.
 *
 * Komponenter använder ENDAST `useSession()` för att veta vem som är
 * inloggad och vad hen får göra. I demoläget levereras värdet av
 * DemoAccessProvider; när Microsoft-inloggning införs levereras det av en
 * provider som får verifierad identitet och behörigheter från servern.
 *
 * OBS: `can()` styr bara vad som VISAS. Varje skyddad operation kontrolleras
 * även på servern och i databasen.
 */
export interface SessionContextValue {
  mode: "demo";
  user: AccessUser;
  roles: AccessRole[];
  permissions: ReadonlySet<Permission>;
  /** Sant om användaren har minst en av behörigheterna. */
  can: (permission: Permission | readonly Permission[]) => boolean;
  /** Endast i demoläget. */
  switchUser: (userId: string) => void;
}

export const SessionContext = React.createContext<SessionContextValue | null>(null);

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession måste användas inom en sessionsprovider");
  return ctx;
}
