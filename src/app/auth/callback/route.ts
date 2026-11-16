import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/safe-redirect";
import { isDemoMode } from "@/server/config/app-mode";
import { AUTHENTICATION_IMPLEMENTED } from "@/server/config/security-flags";
import { createSupabaseServerClient } from "@/server/supabase/server-client";

/**
 * Mottagning efter inloggning hos Microsoft.
 *
 * 1. Byter engångskoden mot en session (PKCE). Sessionen sparas i httpOnly-cookies
 *    (SUPABASE_COOKIE_OPTIONS).
 * 2. Kopplar inloggningen till en profil i databasen (public.link_my_profile),
 *    som kontrollerar tenant och skapar profilen utan roller vid behov.
 * 3. Misslyckas kopplingen loggas användaren ut direkt.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const toLogin = (fel: string) => NextResponse.redirect(new URL(`/logga-in?fel=${fel}`, url.origin));

  if (isDemoMode() || !AUTHENTICATION_IMPLEMENTED) return toLogin("avstangd");
  if (url.searchParams.get("error")) return toLogin("microsoft");

  const code = url.searchParams.get("code");
  if (!code) return toLogin("kod");

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return toLogin("konfiguration");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return toLogin("session");

  const { error: linkError } = await supabase.rpc("link_my_profile");
  if (linkError) {
    await supabase.auth.signOut();
    const message = linkError.message ?? "";
    if (message.includes("tillhör inte H2")) return toLogin("tenant");
    if (message.includes("inte konfigurerad")) return toLogin("konfiguration");
    if (message.includes("Endast inloggning")) return toLogin("leverantor");
    console.error("[auth] Profilkoppling misslyckades", linkError.code);
    return toLogin("koppling");
  }

  return NextResponse.redirect(new URL(safeNextPath(url.searchParams.get("next")), url.origin));
}
