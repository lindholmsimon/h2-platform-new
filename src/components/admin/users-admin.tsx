"use client";

import { Check, Minus, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_USERS } from "@/data/demo/users";
import { PERMISSION_LABELS, ROLES } from "@/lib/auth/roles";
import { useSession } from "@/lib/auth/session-provider";
import { PERMISSIONS } from "@/lib/auth/types";

export function UsersAdmin() {
  const { can } = useSession();
  const roles = Object.values(ROLES);

  return (
    <>
      <PageHeader
        title="Användare & roller"
        description="Hantera vem som har åtkomst till plattformen och vad de får göra."
        actions={
          <Button size="sm" disabled={!can("admin.users")} title="Inbjudan kommer med Microsoft Entra ID">
            <UserPlus /> Bjud in användare
          </Button>
        }
      />
      <Tabs defaultValue="anvandare">
        <TabsList>
          <TabsTrigger value="anvandare">Användare</TabsTrigger>
          <TabsTrigger value="roller">Roller</TabsTrigger>
          <TabsTrigger value="behorigheter">Behörigheter</TabsTrigger>
        </TabsList>

        <TabsContent value="anvandare">
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead className="hidden md:table-cell">Avdelning</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_USERS.map((u) => (
                  <TableRow key={u.id}>
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
                    <TableCell>
                      <Badge variant={u.roleId === "admin" ? "default" : "secondary"}>{ROLES[u.roleId].name}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">Demo</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="roller">
          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((role) => {
              const members = DEMO_USERS.filter((u) => u.roleId === role.id);
              return (
                <Card key={role.id} className="gap-4">
                  <CardHeader>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map((p) => (
                        <Badge key={p} variant="secondary">
                          {PERMISSION_LABELS[p].label}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <div className="flex -space-x-2">
                        {members.map((m) => (
                          <UserAvatar key={m.id} name={m.name} className="ring-card size-6 text-[10px] ring-2" />
                        ))}
                      </div>
                      {members.length} {members.length === 1 ? "användare" : "användare"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="behorigheter">
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Behörighet</TableHead>
                  {roles.map((r) => (
                    <TableHead key={r.id} className="text-center">
                      {r.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSIONS.map((p) => (
                  <TableRow key={p}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{PERMISSION_LABELS[p].label}</span>
                        <span className="text-muted-foreground text-xs">{PERMISSION_LABELS[p].description}</span>
                      </div>
                    </TableCell>
                    {roles.map((r) => (
                      <TableCell key={r.id} className="text-center">
                        {r.permissions.includes(p) ? (
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
            Rollerna kopplas senare till grupper i Microsoft Entra ID. Ändringar av behörigheter görs då här.
          </p>
        </TabsContent>
      </Tabs>
    </>
  );
}
