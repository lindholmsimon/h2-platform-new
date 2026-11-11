"use client";

import { CircleAlert, Sparkles, TrendingUp } from "lucide-react";

import { RequirePermission } from "@/components/shared/require-permission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/data/demo/projects";

/**
 * Platshållare för AI-analys. Insikterna nedan är statiska exempel som
 * räknas fram lokalt från demodata – ingen AI anropas i fas 1.
 */
export function ProjectAiTab({ project }: { project: Project }) {
  const open = project.tasks.filter((t) => t.status !== "klar");
  const highPrio = open.filter((t) => t.priority === "hog");

  const insights = [
    {
      icon: TrendingUp,
      title: "Framdrift",
      text: `Projektet är ${project.progress}% färdigställt med ${open.length} öppna uppgifter.`,
    },
    {
      icon: CircleAlert,
      title: "Att bevaka",
      text:
        highPrio.length > 0
          ? `${highPrio.length} uppgift(er) med hög prioritet: ${highPrio.map((t) => t.title).join(", ")}.`
          : "Inga uppgifter med hög prioritet just nu.",
    },
  ];

  return (
    <RequirePermission permission="projects.ai">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary size-4" /> AI-analys
              <Badge variant="outline" className="ml-1">
                Exempel
              </Badge>
            </CardTitle>
            <CardDescription>
              Sammanställningen nedan är ett exempel baserat på demodata – den är inte genererad av AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {insights.map((i) => (
              <div key={i.title} className="flex gap-3 rounded-lg border p-3">
                <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
                  <i.icon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{i.title}</span>
                  <span className="text-muted-foreground text-sm">{i.text}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kör analys</CardTitle>
            <CardDescription>
              Låt Claude analysera ritningar, tidplan och protokoll för att hitta risker och avvikelser.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button disabled className="w-full">
              <Sparkles /> Starta AI-analys
            </Button>
            <p className="text-muted-foreground text-xs">Kräver att Claude-integrationen ansluts under Administration.</p>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}
