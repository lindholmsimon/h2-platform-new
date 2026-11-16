import { Clock, UserX } from "lucide-react";

import { AuthCard } from "./auth-card";
import { SignOutButton } from "./sign-out-button";

/** Visas för inloggade som saknar roll eller vars konto inte är aktivt. */
export function AccessStatus({ kind, name, email }: { kind: "no_roles" | "no_access"; name?: string; email?: string | null }) {
  if (kind === "no_roles") {
    return (
      <AuthCard icon={Clock} title="Väntar på behörighet">
        <p className="text-muted-foreground text-sm">
          Du är inloggad{name ? ` som ${name}` : ""}, men har ännu ingen roll i plattformen. Be en systemadministratör
          att tilldela dig en roll. Logga sedan in igen.
        </p>
        <SignOutButton />
      </AuthCard>
    );
  }
  return (
    <AuthCard icon={UserX} title="Kontot har ingen åtkomst">
      <p className="text-muted-foreground text-sm">
        {email ? `${email} ` : "Ditt konto "}är inte aktivt i plattformen. Kontakta en systemadministratör om du
        behöver åtkomst.
      </p>
      <SignOutButton />
    </AuthCard>
  );
}
