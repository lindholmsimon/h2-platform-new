"use client";

import { Info } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SettingRow } from "@/components/shared/setting-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/lib/auth/session-provider";

export function PlatformSettings() {
  const { can } = useSession();
  const disabled = !can("admin.settings");

  return (
    <>
      <PageHeader
        title="Inställningar"
        description="Globala inställningar för plattformen."
        actions={
          <Button size="sm" disabled>
            Spara ändringar
          </Button>
        }
      />
      <div className="bg-info/10 text-foreground border-info/20 mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm">
        <Info className="text-info mt-0.5 size-4 shrink-0" />
        <p>
          Endast gränssnitt i denna fas – ändringar sparas inte.
          {disabled && " Din roll har dessutom bara läsbehörighet här."}
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Allmänt</CardTitle>
            <CardDescription>Grundläggande uppgifter om organisationen.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <SettingRow label="Plattformens namn" htmlFor="platform-name">
              <Input id="platform-name" defaultValue="H2 Plattform" className="w-full sm:w-64" disabled={disabled} />
            </SettingRow>
            <SettingRow label="Standardspråk" description="Språk för nya användare.">
              <Select defaultValue="sv" disabled={disabled}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sv">Svenska</SelectItem>
                  <SelectItem value="en">Engelska (kommer senare)</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Tidszon">
              <Select defaultValue="europe-stockholm" disabled={disabled}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="europe-stockholm">Europe/Stockholm</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moduler</CardTitle>
            <CardDescription>Aktivera eller inaktivera delar av plattformen.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <SettingRow label="Projekt" description="Projektöversikt, filer och uppgifter.">
              <Switch defaultChecked disabled={disabled} aria-label="Projekt" />
            </SettingRow>
            <SettingRow label="AI-assistent" description="Visa AI-funktioner för användare med behörighet.">
              <Switch defaultChecked disabled={disabled} aria-label="AI-assistent" />
            </SettingRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Säkerhet</CardTitle>
            <CardDescription>Inloggning och åtkomst.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <SettingRow label="Inloggning via Microsoft Entra ID" description="Single sign-on med företagskonton.">
              <Switch disabled aria-label="Entra ID" />
            </SettingRow>
            <SettingRow label="Kräv tvåstegsverifiering" description="Hanteras via Entra ID:s villkorsstyrd åtkomst.">
              <Switch disabled aria-label="Tvåstegsverifiering" />
            </SettingRow>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
