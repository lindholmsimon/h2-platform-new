import "server-only";

import { cache } from "react";

import { isPermission, type Permission } from "@/lib/auth/permissions";
import { isDemoMode } from "@/server/config/app-mode";
import { AUTHENTICATION_IMPLEMENTED } from "@/server/config/security-flags";
import { createSupabaseServerClient } from "@/server/supabase/server-client";

export interface VerifiedIdentity {
  authUserId: string;
  profileId: string;
  email: string;
  displayName: string;
  roles: { id: string; key: string; name: string }[];
  permissions: ReadonlySet<Permission>;
}

interface MyAccessRow {
  profile: { id: string; email: string; display_name: string; status: string };
  roles: { id: string; key: string; name: string }[];
  permissions: string[];
}

/**
 * Den verifierade identiteten för aktuell förfrågan, eller null.
 *
 * - Returnerar ALLTID null i demoläget (demoidentiteter är aldrig betrodda).
 * - Returnerar null tills AUTHENTICATION_IMPLEMENTED är true.
 * - Använder supabase.auth.getUser(), som verifierar sessionen mot Supabase
 *   Auth (till skillnad från getSession() som bara läser cookien).
 * - Behörigheter hämtas från databasen (public.my_access) vid varje
 *   förfrågan – aldrig från klienten eller en cookie.
 */
export const getVerifiedIdentity = cache(async (): Promise<VerifiedIdentity | null> => {
  if (isDemoMode() || !AUTHENTICATION_IMPLEMENTED) return null;

  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return null;

  const { data, error } = await supabase.rpc("my_access");
  if (error || !data) return null;
  const access = data as MyAccessRow;
  if (access.profile.status !== "active") return null;

  return {
    authUserId: auth.user.id,
    profileId: access.profile.id,
    email: access.profile.email,
    displayName: access.profile.display_name,
    roles: access.roles,
    permissions: new Set(access.permissions.filter(isPermission)),
  };
});
