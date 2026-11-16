import "server-only";

import { cache } from "react";

import { isPermission, type Permission } from "@/lib/auth/permissions";
import type { UserStatus } from "@/lib/auth/types";
import { isDemoMode } from "@/server/config/app-mode";
import { AUTHENTICATION_IMPLEMENTED } from "@/server/config/security-flags";
import { createSupabaseServerClient } from "@/server/supabase/server-client";

export interface VerifiedProfile {
  id: string;
  email: string;
  displayName: string;
  jobTitle: string;
  department: string;
  status: UserStatus;
}

export interface VerifiedIdentity {
  authUserId: string;
  profileId: string;
  email: string;
  displayName: string;
  profile: VerifiedProfile;
  roles: { id: string; key: string; name: string }[];
  permissions: ReadonlySet<Permission>;
}

export type AuthState =
  /** Demoläge eller inloggning ej aktiverad: ingen riktig identitet finns. */
  | { kind: "disabled" }
  /** Supabase saknar konfiguration. */
  | { kind: "unconfigured" }
  | { kind: "anonymous" }
  /** Inloggad i Microsoft men profilen är inaktiv eller inte kopplad. */
  | { kind: "no_access"; email: string | null }
  | { kind: "active"; identity: VerifiedIdentity };

interface MyAccessRow {
  profile: {
    id: string;
    email: string;
    display_name: string;
    job_title: string | null;
    department: string | null;
    status: UserStatus;
  };
  roles: { id: string; key: string; name: string }[];
  permissions: string[];
}

/**
 * Inloggningsläget för aktuell förfrågan.
 *
 * - Demoläge och avstängd inloggning ger alltid "disabled". Demoidentiteter
 *   är aldrig betrodda på servern.
 * - supabase.auth.getUser() verifierar sessionen mot Supabase Auth, till
 *   skillnad från getSession(), som bara läser cookien.
 * - Profil och behörigheter hämtas från databasen (public.my_access) vid varje
 *   förfrågan, aldrig från klienten eller en cookie.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  if (isDemoMode() || !AUTHENTICATION_IMPLEMENTED) return { kind: "disabled" };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { kind: "unconfigured" };
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return { kind: "anonymous" };

  const { data, error } = await supabase.rpc("my_access");
  if (error || !data) return { kind: "no_access", email: auth.user.email ?? null };

  const access = data as MyAccessRow;
  if (access.profile.status !== "active") return { kind: "no_access", email: access.profile.email };

  const profile: VerifiedProfile = {
    id: access.profile.id,
    email: access.profile.email,
    displayName: access.profile.display_name,
    jobTitle: access.profile.job_title ?? "",
    department: access.profile.department ?? "",
    status: access.profile.status,
  };

  return {
    kind: "active",
    identity: {
      authUserId: auth.user.id,
      profileId: profile.id,
      email: profile.email,
      displayName: profile.displayName,
      profile,
      roles: access.roles,
      permissions: new Set(access.permissions.filter(isPermission)),
    },
  };
});

/** Den verifierade identiteten, eller null om ingen aktiv inloggning finns. */
export async function getVerifiedIdentity(): Promise<VerifiedIdentity | null> {
  const state = await getAuthState();
  return state.kind === "active" ? state.identity : null;
}
