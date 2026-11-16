"use server";

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/safe-redirect";
import { isDemoMode } from "@/server/config/app-mode";
import { AUTHENTICATION_IMPLEMENTED } from "@/server/config/security-flags";
import { createSupabaseServerClient } from "@/server/supabase/server-client";
import { getRequestOrigin } from "./request-origin";

/**
 * Startar inloggning med Microsoft (Supabase Auth, provider "azure", PKCE).
 * Endast tillgänglig i säkert läge när inloggningen är aktiverad.
 */
export async function signInWithMicrosoft(formData: FormData) {
  if (isDemoMode() || !AUTHENTICATION_IMPLEMENTED) redirect("/logga-in");

  const next = safeNextPath(formData.get("next"));
  const origin = await getRequestOrigin();

  let url: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        // Supabase kräver e-post från Microsoft. Inga Graph-behörigheter utöver grunden.
        scopes: "email",
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (!error) url = data.url;
  } catch {
    url = null;
  }

  redirect(url ?? "/logga-in?fel=start");
}

export async function signOut() {
  if (!isDemoMode() && AUTHENTICATION_IMPLEMENTED) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Ingen session att avsluta.
    }
  }
  redirect("/logga-in?utloggad=1");
}
