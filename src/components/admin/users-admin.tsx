"use client";

import * as React from "react";
import { Check, ChevronRight, Lock, Minus, Plus, RotateCcw, UserPlus } from "lucide-react";

import { InlineAlert } from "@/components/shared/inline-alert";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccess } from "@/lib/access/access-context";
import { PERMISSION_CATALOG } from "@/lib/auth/permissions";
import { rolesOf } from "@/lib/auth/policy";
import { useSession } from "@/lib/auth/session";
import { USER_STATUS, type AccessRole } from "@/lib/auth/types";
import { RoleBadges } from "./access/role-badges";
import { RoleEditorDialog } from "./access/role-editor-dialog";
import { UserDetailSheet } from "./access/user-detail-sheet";

export function UsersAdmin() {
  const { can, mode } = useSession();
  const { snapshot, resetDemoData } = useAccess();
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [editingRole, setEditingRole] = React.useState<AccessRole | "new" | null>(null);

  const showUsers = can("users.view");
  const showRoles = can(["users.view", "roles.view"]);

  return (
    <>
      <PageHeader
        title="Användare & roller"
        description="Hantera vem som har åtkomst till plattformen och vad de får göra."
        actions={
          <>
            {mode === "demo" && resetDemoData && (
              <Button variant="ghost" size="sm" onClick={resetDemoData}>
                <RotateCcw /> Återställ demodata
              </Button>
            )}
            <Button size="sm" disabled title="Inbjudningar kommer med Microsoft Entra ID">
              <UserPlus /> Bjud in användare
            </Button>
          </>
        }
      />

      {mode === "demo" && (
        <InlineAlert variant="warning" className="mb-6">
          <strong className="font-semibold">Demoläge:</strong> fiktiva användare. Ändringar sparas bara i din webbläsare
          och når ingen databas. Byt demoanvändare via profilmenyn för att testa olika behörigheter.
        </InlineAlert>
      )}

      <Tabs defaultValue={showUsers ? "anvandare" : "roller"}>
        <TabsList>
          {showUsers && <TabsTrigger value="anvandare">Användare</TabsTrigger>}
          {showRoles && <TabsTrigger value="roller">Roller</TabsTrigger>}
          {showRoles && <TabsTrigger value="behorigheter">Behörigheter</TabsTrigger>}
        </TabsList>

        {showUsers && (
          <TabsContent value="anvandare">
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead className="hidden md:table-cell">Avdelning</TableHead>
                    <TableHead>Roller</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.users.map((u) => (
                    <TableRow
                      key={u.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedUser(u.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedUser(u.id)}
                      tabIndex={0}
                      aria-label={`Visa ${u.name}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} />
                          <div className="flex min-w-0 flex-col">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-muted-foreground truncate text-xs">{u.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{u.department}</TableCell>
                      <TableCell className="whitespace-normal">
                        <RoleBadges roles={rolesOf(snapshot, u)} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={USER_STATUS[u.status].variant}>{USER_STATUS[u.status].label}</Badge>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="text-muted-foreground size-4" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}

        {showRoles && (
          <TabsContent value="roller" className="flex flex-col gap-4">
            {can("roles.manage") && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setEditingRole("new")}>
                  <Plus /> Ny roll
                </Button>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {snapshot.roles.map((role) => {
                const members = snapshot.users.filter((u) => u.roleIds.includes(role.id));
                return (
                  <Card key={role.id} className="gap-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {role.name}
                        {role.isLocked && <Lock className="text-muted-foreground size-3.5" aria-label="Låst roll" />}
                      </CardTitle>
                      <CardDescription>{role.description || "Ingen beskrivning"}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={role.isSystem ? "outline" : "info"}>{role.isSystem ? "Standardroll" : "Egen roll"}</Badge>
                        <Badge variant="secondary">{role.permissions.length} behörigheter</Badge>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <div className="flex -space-x-2">
                          {members.slice(0, 5).map((m) => (
                            <UserAvatar key={m.id} name={m.name} className="ring-card size-6 text-[10px] ring-2" />
                          ))}
                        </div>
                        {members.length} användare
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingRole(role)}>
                        {can("roles.manage") && !role.isLocked ? "Redigera" : "Visa behörigheter"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}

        {showRoles && (
          <TabsContent value="behorigheter">
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Behörighet</TableHead>
                    {snapshot.roles.map((r) => (
                      <TableHead key={r.id} className="text-center">
                        {r.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_CATALOG.map((p) => (
                    <TableRow key={p.key}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.label}</span>
                          <span className="text-muted-foreground font-mono text-[11px]">{p.key}</span>
                        </div>
                      </TableCell>
                      {snapshot.roles.map((r) => (
                        <TableCell key={r.id} className="text-center">
                          {r.permissions.includes(p.key) ? (
                            <Check className="text-success mx-auto size-4" aria-label="Ja" />
                          ) : (
                            <Minus className="text-muted-foreground/50 mx-auto size-4" aria-label="Nej" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <p className="text-muted-foreground mt-3 text-xs">
              Rollen Systemadministratör gäller endast denna plattform och ger inga rättigheter i Microsoft 365.
            </p>
          </TabsContent>
        )}
      </Tabs>

      <UserDetailSheet userId={selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)} />
      <RoleEditorDialog role={editingRole} onOpenChange={(open) => !open && setEditingRole(null)} />
    </>
  );
}
