import { LockKeyhole } from "lucide-react";

import { Brand } from "./brand";

/**
 * Visas när plattformen körs i säkert läge (ej demo). Tills Microsoft
 * Entra ID-inloggning finns visas inget innehåll alls.
 */
export function SecureModeGate() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <Brand size="lg" priority />
      <div className="bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center shadow-xs">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          <LockKeyhole className="size-5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-semibold">Inloggning krävs</h1>
          <p className="text-muted-foreground text-sm">
            Plattformen körs i säkert läge. Inloggning med Microsoft-konto är inte aktiverad ännu, så inget innehåll
            visas.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="bg-primary text-primary-foreground h-9 w-full cursor-not-allowed rounded-md text-sm font-medium opacity-50"
        >
          Logga in med Microsoft (kommer snart)
        </button>
      </div>
    </main>
  );
}
