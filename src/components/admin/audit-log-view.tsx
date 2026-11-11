"use client";

import * as React from "react";
import { History, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { InlineAlert } from "@/components/shared/inline-alert";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccess } from "@/lib/access/access-context";
import { findUser } from "@/lib/auth/policy";
import { useSession } from "@/lib/auth/session";
import type { AuditAction, AuditEntry } from "@/lib/auth/types";
import { formatDate } from "@/lib/utils";

const ACTIONS: Record<AuditAction, { label: string; group: Filter }> = {
  "system.bootstrap_admin": { label: "Första administratör", group: "system" },
  "user.role_assigned": { label: "Roll tilldelad", group: "users" },
  "user.role_revoked": { label: "Roll borttagen", group: "users" },
  "user.status_changed": { label: "Status ändrad", group: "users" },
  "role.created": { label: "Roll skapad", group: "roles" },
  "role.updated": { label: "Roll ändrad", group: "roles" },
  "role.deleted": { label: "Roll borttagen", group: "roles" },
};

type Filter = "all" | "users" | "roles" | "system";

function PermissionDiff({ entry }: { entry: AuditEntry }) {
  const { added = [], removed = [] } = entry.details ?? {};
  if (!added.length && !removed.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {added.map((p) => (
        <Badge key={`+${p}`} variant="success" className="font-mono text-[10px]">
          +{p}
        </Badge>
      ))}
      {removed.map((p) => (
        <Badge key={`-${p}`} variant="destructive" className="font-mono text-[10px]">
          −{p}
        </Badge>
      ))}
    </div>
  );
}

export function AuditLogView() {
  const { snapshot } = useAccess();
  const { mode } = useSession();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

  const entries = snapshot.audit
    .filter((e) => filter === "all" || ACTIONS[e.action]?.group === filter)
    .filter((e) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const actor = e.actorId ? findUser(snapshot, e.actorId)?.name ?? "" : "System";
      return [e.summary, actor, ACTIONS[e.action]?.label ?? e.action].some((v) => v.toLowerCase().includes(q));
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return (
    <>
      <PageHeader title="Aktivitetslogg" description="Historik över administrativa ändringar av användare, roller och behörigheter." />

      {mode === "demo" && (
        <InlineAlert variant="warning" className="mb-6">
          Demoläge: loggen innehåller fiktiva händelser och dina ändringar i demot. I riktigt läge skrivs loggen av
          databasen och kan inte ändras eller raderas.
        </InlineAlert>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök på händelse eller person…"
            className="bg-card pl-9"
            aria-label="Sök i aktivitetsloggen"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="bg-card w-full sm:w-48" aria-label="Filtrera händelser">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla händelser</SelectItem>
            <SelectItem value="users">Användare</SelectItem>
            <SelectItem value="roles">Roller</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={History} title="Inga händelser" description="Inga händelser matchar filtret." />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Tidpunkt</TableHead>
                <TableHead>Händelse</TableHead>
                <TableHead className="hidden md:table-cell">Utförd av</TableHead>
                <TableHead className="hidden lg:table-cell">Typ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => {
                const actor = e.actorId ? findUser(snapshot, e.actorId) : null;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground align-top text-xs tabular-nums">
                      {formatDate(e.occurredAt, { day: "numeric", month: "short", year: "numeric" })}
                      <br />
                      {formatDate(e.occurredAt, { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <span className="text-sm">{e.summary}</span>
                      <PermissionDiff entry={e} />
                      <span className="text-muted-foreground mt-0.5 block text-xs md:hidden">
                        {actor?.name ?? "System"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden align-top md:table-cell">
                      {actor ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar name={actor.name} className="size-6 text-[10px]" />
                          <span className="text-sm">{actor.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">System</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden align-top lg:table-cell">
                      <Badge variant="outline">{ACTIONS[e.action]?.label ?? e.action}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
