"use client";

import { Check, Minus } from "lucide-react";

import { useAccess } from "@/lib/access/access-context";
import { findUser, permissionSources } from "@/lib/auth/policy";
import { cn } from "@/lib/utils";
import { PERMISSION_GROUPS } from "./permission-groups";

/** Visar en användares effektiva behörigheter och vilken roll som ger dem. */
export function EffectivePermissions({ userId, showMissing = true }: { userId: string; showMissing?: boolean }) {
  const { snapshot } = useAccess();
  const user = findUser(snapshot, userId);
  const sources = permissionSources(snapshot, userId);
  const inactive = user?.status !== "active";

  return (
    <div className="flex flex-col gap-4">
      {inactive && (
        <p className="text-muted-foreground text-sm">
          Användaren är inte aktiv och har därför inga behörigheter, oavsett roller.
        </p>
      )}
      {PERMISSION_GROUPS.map((group) => {
        const items = group.permissions.filter((p) => showMissing || sources.has(p.key));
        if (items.length === 0) return null;
        return (
          <div key={group.category} className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">{group.category}</span>
            <ul className="flex flex-col gap-1">
              {items.map((p) => {
                const from = sources.get(p.key);
                const granted = !!from && !inactive;
                return (
                  <li key={p.key} className="flex items-start gap-2.5 text-sm">
                    {granted ? (
                      <Check className="text-success mt-0.5 size-4 shrink-0" aria-label="Har behörighet" />
                    ) : (
                      <Minus className="text-muted-foreground/50 mt-0.5 size-4 shrink-0" aria-label="Saknar behörighet" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className={cn(!granted && "text-muted-foreground")}>{p.label}</span>
                      {from && (
                        <span className="text-muted-foreground text-xs">via {from.map((r) => r.name).join(", ")}</span>
                      )}
                    </div>
                    <code className="text-muted-foreground hidden font-mono text-[11px] sm:inline">{p.key}</code>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
