import "server-only";

/**
 * Supabase-konfiguration. Endast URL och den publika (publishable/anon)
 * nyckeln används – den är avsedd att vara publik och skyddas av RLS.
 *
 * service_role/secret-nyckeln används INTE av applikationen och ska inte
 * läggas in i Vercel. Bygget stoppas om en hemlig nyckel hamnar i en
 * NEXT_PUBLIC_-variabel (se next.config.ts).
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}
