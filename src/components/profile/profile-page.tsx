"use client";

import { Briefcase, Check, Mail, Phone } from "lucide-react";
import { useTheme } from "next-themes";

import { PageHeader } from "@/components/shared/page-header";
import { SettingRow } from "@/components/shared/setting-row";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DEMO_USERS } from "@/data/demo/users";
import { ROLES } from "@/lib/auth/roles";
import { useMounted } from "@/hooks/use-mounted";
import { useSession } from "@/lib/auth/session-provider";
import { cn } from "@/lib/utils";

export function ProfilePage() {
  const { user, role, switchUser } = useSession();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <>
      <PageHeader title="Min profil" description="Dina uppgifter och personliga inställningar." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <UserAvatar name={user.name} className="size-20 text-xl" />
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <p className="text-muted-foreground text-sm">{user.title}</p>
              </div>
              <div className="flex gap-2">
                <Badge>{role.name}</Badge>
                <Badge variant="warning">Demoanvändare</Badge>
              </div>
              <ul className="text-muted-foreground flex w-full flex-col gap-2 border-t pt-4 text-left text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="size-4" /> {user.email}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-4" /> {user.phone}
                </li>
                <li className="flex items-center gap-2">
                  <Briefcase className="size-4" /> {user.department}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Byt demoanvändare</CardTitle>
              <CardDescription>Testa gränssnittet med olika roller och behörigheter.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {DEMO_USERS.map((u) => {
                const active = u.id === user.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                      active ? "border-primary bg-primary/5" : "hover:bg-accent",
                    )}
                    aria-pressed={active}
                  >
                    <UserAvatar name={u.name} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{u.name}</span>
                      <span className="text-muted-foreground text-xs">{ROLES[u.roleId].name}</span>
                    </div>
                    {active && <Check className="text-primary size-4" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profiluppgifter</CardTitle>
              <CardDescription>Synkas från Microsoft 365 när inloggning via Entra ID är på plats.</CardDescription>
            </CardHeader>
            <CardContent>
              <form key={user.id} className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Namn</Label>
                  <Input id="name" defaultValue={user.name} disabled />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input id="email" defaultValue={user.email} disabled />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title">Titel</Label>
                  <Input id="title" defaultValue={user.title} disabled />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" defaultValue={user.phone} />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferenser</CardTitle>
              <CardDescription>Gäller endast i den här webbläsaren.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <SettingRow label="Färgtema" description="Välj ljust, mörkt eller följ systemet.">
                <Select value={mounted ? theme : undefined} onValueChange={setTheme}>
                  <SelectTrigger className="w-full sm:w-48" aria-label="Färgtema">
                    <SelectValue placeholder="Välj tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Ljust</SelectItem>
                    <SelectItem value="dark">Mörkt</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Språk">
                <Select defaultValue="sv">
                  <SelectTrigger className="w-full sm:w-48" aria-label="Språk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sv">Svenska</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="E-postnotiser" description="Sammanfattning av händelser i dina projekt.">
                <Switch defaultChecked aria-label="E-postnotiser" />
              </SettingRow>
              <SettingRow label="Notiser om nya filer" description="När filer laddas upp i dina projekt.">
                <Switch defaultChecked aria-label="Notiser om nya filer" />
              </SettingRow>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
