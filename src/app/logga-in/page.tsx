import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { AccessStatus } from "@/components/auth/access-status";
import { AuthCard } from "@/components/auth/auth-card";
import { SecureModeGate } from "@/components/layout/secure-mode-gate";
import { InlineAlert } from "@/components/shared/inline-alert";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { signInWithMicrosoft } from "@/server/auth/actions";
import { getAuthState } from "@/server/auth/identity";
import { isDemoMode } from "@/server/config/app-mode";

export const metadata: Metadata = { title: "Logga in" };

const ERRORS: Record<string, string> = {
  tenant: "Kontot tillhör inte H2:s organisation. Logga in med ditt H2-konto.",
  konfiguration: "Inloggningen är inte färdigkonfigurerad. Kontakta en systemadministratör.",
  leverantor: "Logga in med ditt Microsoft-konto.",
  microsoft: "Inloggningen avbröts eller nekades hos Microsoft. Försök igen.",
  kod: "Inloggningen kunde inte slutföras. Försök igen.",
  session: "Inloggningen kunde inte slutföras. Försök igen.",
  start: "Inloggningen kunde inte startas. Försök igen om en stund.",
  koppling: "Kontot kunde inte kopplas till plattformen. Kontakta en systemadministratör.",
  avstangd: "Inloggning är inte aktiverad ännu.",
};

type SearchParams = Promise<{ fel?: string; next?: string; utloggad?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  if (isDemoMode()) redirect("/");

  const params = await searchParams;
  const next = safeNextPath(params.next);
  const state = await getAuthState();

  if (state.kind === "disabled" || state.kind === "unconfigured") return <SecureModeGate />;
  if (state.kind === "active") redirect(next);
  if (state.kind === "no_access") return <AccessStatus kind="no_access" email={state.email} />;

  const error = params.fel ? ERRORS[params.fel] ?? ERRORS.koppling : null;

  return (
    <AuthCard icon={LockKeyhole} title="Logga in">
      <p className="text-muted-foreground text-sm">Logga in med ditt Microsoft-konto från H2 Entreprenad.</p>
      {error && <InlineAlert variant="error" className="w-full text-left">{error}</InlineAlert>}
      {params.utloggad && !error && (
        <InlineAlert variant="success" className="w-full text-left">
          Du är utloggad.
        </InlineAlert>
      )}
      <form action={signInWithMicrosoft} className="w-full">
        <input type="hidden" name="next" value={next} />
        <Button type="submit" className="w-full">
          Logga in med Microsoft
        </Button>
      </form>
    </AuthCard>
  );
}
