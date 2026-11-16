import { redirect } from "next/navigation";

import { AccessStatus } from "@/components/auth/access-status";
import { AppShell } from "@/components/layout/app-shell";
import { SecureModeGate } from "@/components/layout/secure-mode-gate";
import { AuthenticatedAccessProvider } from "@/lib/access/authenticated-access-provider";
import { DemoAccessProvider } from "@/lib/access/demo-access-provider";
import { loadSnapshotForIdentity } from "@/server/admin/queries";
import { getAuthState } from "@/server/auth/identity";
import { getAppMode } from "@/server/config/app-mode";

/**
 * Läget avgörs på servern:
 *   - demo: fiktiv data, ingen inloggning.
 *   - säkert läge utan aktiverad inloggning: allt låst (SecureModeGate).
 *   - säkert läge med inloggning: verifierad identitet krävs. Inloggade utan
 *     roll eller med inaktivt konto ser bara ett meddelande.
 */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  if (getAppMode().mode === "demo") {
    return (
      <DemoAccessProvider>
        <AppShell>{children}</AppShell>
      </DemoAccessProvider>
    );
  }

  const state = await getAuthState();
  if (state.kind === "disabled" || state.kind === "unconfigured") return <SecureModeGate />;
  if (state.kind === "anonymous") redirect("/logga-in");
  if (state.kind === "no_access") return <AccessStatus kind="no_access" email={state.email} />;

  const { identity } = state;
  if (identity.permissions.size === 0) return <AccessStatus kind="no_roles" name={identity.displayName} />;

  const snapshot = await loadSnapshotForIdentity(identity);

  return (
    <AuthenticatedAccessProvider snapshot={snapshot} userId={identity.profileId} permissions={[...identity.permissions]}>
      <AppShell>{children}</AppShell>
    </AuthenticatedAccessProvider>
  );
}
