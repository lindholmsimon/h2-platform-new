import { Badge } from "@/components/ui/badge";
import { SYSTEM_ADMIN_ROLE_KEY } from "@/lib/auth/permissions";
import type { AccessRole } from "@/lib/auth/types";

export function RoleBadges({ roles, empty = "Ingen roll" }: { roles: AccessRole[]; empty?: string }) {
  if (roles.length === 0) return <span className="text-muted-foreground text-xs">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <Badge key={r.id} variant={r.key === SYSTEM_ADMIN_ROLE_KEY ? "default" : "secondary"}>
          {r.name}
        </Badge>
      ))}
    </div>
  );
}
