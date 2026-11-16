import "server-only";

import { headers } from "next/headers";

/**
 * Den publika adressen för aktuell förfrågan (t.ex. https://plattform.example).
 * Används för Supabase redirectTo. Supabase Auth godkänner bara adresser som
 * finns i projektets lista över redirect-URL:er, så en manipulerad Host-header
 * kan inte leda inloggningen till en annan domän.
 */
export async function getRequestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
