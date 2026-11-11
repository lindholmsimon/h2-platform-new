import { AppShell } from "@/components/layout/app-shell";
import { SecureModeGate } from "@/components/layout/secure-mode-gate";
import { DemoAccessProvider } from "@/lib/access/demo-access-provider";
import { getAppMode } from "@/server/config/app-mode";

/**
 * Läget avgörs på servern. I säkert läge renderas inget av plattformens
 * innehåll förrän verifierad inloggning finns (implementeras med Entra ID).
 */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { mode } = getAppMode();

  if (mode !== "demo") {
    return <SecureModeGate />;
  }

  return (
    <DemoAccessProvider>
      <AppShell>{children}</AppShell>
    </DemoAccessProvider>
  );
}
