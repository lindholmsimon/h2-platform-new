"use client";

import { Lock } from "lucide-react";

import { useSession } from "@/lib/auth/session-provider";
import type { Permission } from "@/lib/auth/types";
import { EmptyState } from "./empty-state";

/**
 * Döljer innehåll som den aktuella användaren saknar behörighet till.
 * OBS: i fas 1 är detta enbart UI. När riktig inloggning finns måste samma
 * kontroll även göras server-side (middleware / Supabase RLS).
 */
export function RequirePermission({
  permission,
  children,
  fallback,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can, role } = useSession();
  if (can(permission)) return <>{children}</>;
  return (
    fallback ?? (
      <EmptyState
        icon={Lock}
        title="Du saknar behörighet"
        description={`Rollen ${role.name} har inte tillgång till den här delen. Byt demoanvändare via profilmenyn för att testa.`}
      />
    )
  );
}
