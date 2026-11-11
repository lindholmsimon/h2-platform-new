"use client";

import { Check, Unplug } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { INTEGRATIONS, type IntegrationDefinition } from "@/integrations";
import { useSession } from "@/lib/auth/session-provider";
import { cn } from "@/lib/utils";

const LOGO: Record<IntegrationDefinition["id"], { label: string; className: string }> = {
  microsoft365: { label: "M365", className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  dropbox: { label: "Db", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  claude: { label: "AI", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
};

export function IntegrationsAdmin() {
  const { can } = useSession();
  return (
    <>
      <PageHeader
        title="Integrationer"
        description="Koppla plattformen till företagets verktyg. Inga integrationer är anslutna i denna fas."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((integration) => {
          const logo = LOGO[integration.id];
          return (
            <Card key={integration.id} className="gap-5">
              <CardHeader className="flex flex-row items-start gap-3">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                    logo.className,
                  )}
                >
                  {logo.label}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <CardTitle>{integration.name}</CardTitle>
                  <span className="text-muted-foreground text-xs">{integration.vendor}</span>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  <Unplug /> Ej ansluten
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <CardDescription>{integration.description}</CardDescription>
                <ul className="flex flex-col gap-1.5">
                  {integration.capabilities.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm">
                      <Check className="text-muted-foreground size-3.5" /> {c}
                    </li>
                  ))}
                </ul>
                <div className="text-muted-foreground mt-auto text-xs">
                  Planerade behörigheter: <span className="font-mono">{integration.plannedScopes.join(", ")}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" disabled title="Ansluts i en senare fas">
                  {can("admin.integrations") ? "Anslut (kommer snart)" : "Kräver administratör"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
