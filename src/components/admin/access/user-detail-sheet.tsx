"use client";

import * as React from "react";
import { Lock } from "lucide-react";

import { InlineAlert } from "@/components/shared/inline-alert";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAccess } from "@/lib/access/access-context";
import { findUser } from "@/lib/auth/policy";
import { useSession } from "@/lib/auth/session";
import { USER_STATUS, type UserStatus } from "@/lib/auth/types";
import { EffectivePermissions } from "./effective-permissions";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function UserDetailSheet({ userId, onOpenChange }: { userId: string | null; onOpenChange: (open: boolean) => void }) {
  const { snapshot, actions } = useAccess();
  const { user: actor, can } = useSession();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => setError(null), [userId]);

  const user = userId ? findUser(snapshot, userId) : undefined;
  const isSelf = user?.id === actor.id;
  const canManage = can("users.manage") && !isSelf;

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setPending(true);
    setError(null);
    const result = await fn();
    if (!result.ok) setError(result.error ?? "Åtgärden misslyckades");
    setPending(false);
  };

  return (
    <Sheet open={!!user} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {user && (
          <>
            <SheetHeader className="border-b p-5">
              <div className="flex items-center gap-3 pr-6">
                <UserAvatar name={user.name} className="size-11 text-sm" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <SheetTitle className="truncate">{user.name}</SheetTitle>
                  <SheetDescription className="truncate">{user.email}</SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge variant={USER_STATUS[user.status].variant}>{USER_STATUS[user.status].label}</Badge>
                <span className="text-muted-foreground text-xs">
                  {user.title} · {user.department}
                </span>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-7 p-5">
              {isSelf && (
                <InlineAlert variant="info">
                  Du kan inte ändra dina egna roller eller din egen status. En annan administratör måste göra det.
                </InlineAlert>
              )}
              {!can("users.manage") && (
                <InlineAlert variant="info">Du har läsbehörighet. Ändringar kräver behörigheten users.manage.</InlineAlert>
              )}
              {error && <InlineAlert variant="error">{error}</InlineAlert>}

              <Section title="Roller">
                <ul className="flex flex-col divide-y rounded-xl border">
                  {snapshot.roles.map((role) => {
                    const checked = user.roleIds.includes(role.id);
                    return (
                      <li key={role.id} className="flex items-center gap-3 p-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            {role.name}
                            {role.isLocked && <Lock className="text-muted-foreground size-3" aria-label="Låst roll" />}
                          </span>
                          <span className="text-muted-foreground line-clamp-1 text-xs">{role.description}</span>
                        </div>
                        <Switch
                          checked={checked}
                          disabled={!canManage || pending}
                          onCheckedChange={(next) =>
                            run(() => (next ? actions.assignRole(user.id, role.id) : actions.revokeRole(user.id, role.id)))
                          }
                          aria-label={`${checked ? "Ta bort" : "Tilldela"} rollen ${role.name}`}
                        />
                      </li>
                    );
                  })}
                </ul>
              </Section>

              <Section title="Status">
                <Select
                  value={user.status}
                  disabled={!canManage || pending}
                  onValueChange={(status) => run(() => actions.setUserStatus(user.id, status as UserStatus))}
                >
                  <SelectTrigger className="w-full sm:w-56" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(USER_STATUS) as UserStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {USER_STATUS[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Section>

              <Section title="Microsoft-identitet">
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">Tenant-ID</dt>
                  <dd className="truncate font-mono text-xs leading-5">{user.entraTenantId ?? "Ej kopplad"}</dd>
                  <dt className="text-muted-foreground">Object-ID</dt>
                  <dd className="truncate font-mono text-xs leading-5">{user.entraObjectId ?? "Ej kopplad"}</dd>
                </dl>
                <p className="text-muted-foreground text-xs">Kopplas automatiskt vid första inloggningen med Microsoft-konto.</p>
              </Section>

              <Section title="Effektiva behörigheter">
                <EffectivePermissions userId={user.id} />
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
