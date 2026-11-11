"use client";

import * as React from "react";

import { DEMO_USERS } from "@/data/demo/users";
import { hasPermission, ROLES } from "./roles";
import type { Permission, PlatformUser, Role } from "./types";

/**
 * Sessionslager för klienten.
 *
 * I fas 1 hämtas användaren från demoanvändarna och valet sparas i
 * localStorage. När Microsoft Entra ID kopplas in byts implementationen här
 * (t.ex. Auth.js / MSAL + Supabase) – komponenter använder bara `useSession()`.
 */

interface SessionContextValue {
  user: PlatformUser;
  role: Role;
  isDemo: boolean;
  can: (permission: Permission) => boolean;
  /** Endast i demoläget. */
  switchUser: (userId: string) => void;
}

const STORAGE_KEY = "h2.demo.userId";
const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = React.useState(DEMO_USERS[0].id);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && DEMO_USERS.some((u) => u.id === stored)) setUserId(stored);
    } catch {
      // localStorage kan vara blockerat – använd standardanvändaren.
    }
  }, []);

  const value = React.useMemo<SessionContextValue>(() => {
    const user = DEMO_USERS.find((u) => u.id === userId) ?? DEMO_USERS[0];
    return {
      user,
      role: ROLES[user.roleId],
      isDemo: true,
      can: (permission) => hasPermission(user.roleId, permission),
      switchUser: (id) => {
        setUserId(id);
        try {
          window.localStorage.setItem(STORAGE_KEY, id);
        } catch {
          // ignorera
        }
      },
    };
  }, [userId]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession måste användas inom <SessionProvider>");
  return ctx;
}
