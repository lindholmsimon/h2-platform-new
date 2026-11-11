"use client";

import { Lock } from "lucide-react";

import { useSession } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";
import { EmptyState } from "./empty-state";

/**
 * Döljer innehåll som den aktuella användaren saknar behörighet till.
 * OBS: detta styr bara vad som visas. Skyddade operationer kontrolleras
 * alltid på servern (src/server/auth/guards.ts) och i databasen (RLS och
 * databasfunktioner).
 */
export function RequirePermission({
  permission,
  children,
  fallback,
}: {
  /** Minst en av behörigheterna krävs. */
  permission: Permission | readonly Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can, roles } = useSession();
  if (can(permission)) return <>{children}</>;
  return (
    fallback ?? (
      <EmptyState
        icon={Lock}
        title="Du saknar behörighet"
        description={`${roles.length ? `Dina roller (${roles.map((r) => r.name).join(", ")}) ger` : "Du har ingen roll som ger"} inte tillgång till den här delen. Byt demoanvändare via profilmenyn för att testa.`}
      />
    )
  );
}
