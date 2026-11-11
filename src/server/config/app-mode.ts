import "server-only";

/**
 * Bestämmer plattformens läge – ENDAST på servern.
 *
 *   demo   – fiktiva data i webbläsaren, ingen inloggning, ingen Supabase.
 *   secure – riktigt läge. Kräver verifierad inloggning (ej implementerad
 *            ännu), så allt innehåll är låst.
 *
 * Regler:
 *   - Lokalt (`next dev`) är demoläget på om inte H2_DEMO_MODE=false.
 *   - Annars krävs H2_DEMO_MODE=true (t.ex. för Vercel Preview).
 *   - I Vercels produktionsmiljö (VERCEL_ENV=production) krävs dessutom
 *     H2_ALLOW_DEMO_IN_PRODUCTION=true. Annars ignoreras H2_DEMO_MODE.
 *
 * Demoläget kan inte användas för att kringgå inloggning: i demoläget skapas
 * aldrig någon Supabase-klient och servern litar aldrig på demoidentiteter
 * (se src/server/auth/identity.ts och src/server/supabase/server-client.ts).
 *
 * Variablerna läses vid build/render på servern och har inget NEXT_PUBLIC_-
 * prefix, så de kan inte påverkas från webbläsaren.
 */

export type AppMode = "demo" | "secure";

export interface AppModeInfo {
  mode: AppMode;
  reason: string;
}

export function getAppMode(): AppModeInfo {
  const flag = process.env.H2_DEMO_MODE?.trim().toLowerCase();
  const isDevServer = process.env.NODE_ENV === "development";
  const isVercelProduction = process.env.VERCEL_ENV === "production";

  const demoRequested = flag === "true" || (isDevServer && flag !== "false");
  if (!demoRequested) {
    return { mode: "secure", reason: "Demoläget är inte aktiverat (H2_DEMO_MODE)." };
  }

  if (isVercelProduction && process.env.H2_ALLOW_DEMO_IN_PRODUCTION?.trim().toLowerCase() !== "true") {
    return {
      mode: "secure",
      reason: "Demoläget är avstängt i produktionsmiljön (H2_ALLOW_DEMO_IN_PRODUCTION saknas).",
    };
  }

  return { mode: "demo", reason: isDevServer ? "Lokal utvecklingsserver." : "H2_DEMO_MODE=true." };
}

export function isDemoMode() {
  return getAppMode().mode === "demo";
}
