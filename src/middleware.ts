import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAppMode } from "@/server/config/app-mode";
import { getSupabaseConfig, SUPABASE_COOKIE_OPTIONS } from "@/server/config/env";
import { AUTHENTICATION_IMPLEMENTED } from "@/server/config/security-flags";

/**
 * Sessionshantering för Supabase Auth.
 *
 * - Förnyar sessionen (cookies) vid varje förfrågan.
 * - Skickar icke inloggade till /logga-in.
 *
 * OBS: middleware är INTE det enda skyddet. Varje sida och serveråtgärd
 * kontrollerar inloggning och behörighet igen på servern (getAuthState /
 * requirePermission) och databasen med RLS, så att en förbigången middleware
 * inte ger åtkomst.
 */
export async function middleware(request: NextRequest) {
  if (getAppMode().mode === "demo" || !AUTHENTICATION_IMPLEMENTED) return NextResponse.next();

  const config = getSupabaseConfig();
  if (!config) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Viktigt: getUser() verifierar och förnyar sessionen. Inget annat får
  // köras mellan createServerClient och getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = path === "/logga-in" || path.startsWith("/auth/");

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/logga-in";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${path}${request.nextUrl.search}`);
    const redirect = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
