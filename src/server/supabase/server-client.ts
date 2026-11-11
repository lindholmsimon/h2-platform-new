import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { isDemoMode } from "@/server/config/app-mode";
import { getSupabaseConfig } from "@/server/config/env";

export class SupabaseUnavailableError extends Error {}

/**
 * Supabase-klient för servern med den inloggade användarens session
 * (cookies). Alla frågor körs som rollen `authenticated` (eller `anon`) och
 * begränsas av RLS. Ingen privilegierad nyckel används.
 *
 * Kastar fel i demoläget – demoläget får aldrig nå databasen.
 */
export async function createSupabaseServerClient() {
  if (isDemoMode()) {
    throw new SupabaseUnavailableError("Supabase används inte i demoläget.");
  }
  const config = getSupabaseConfig();
  if (!config) {
    throw new SupabaseUnavailableError("Supabase är inte konfigurerat (NEXT_PUBLIC_SUPABASE_URL / nyckel saknas).");
  }

  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Anropat från en Server Component – sessionen förnyas i stället av
          // middleware när inloggning implementeras.
        }
      },
    },
  });
}
