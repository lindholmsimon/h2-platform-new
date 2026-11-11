"use client";

import * as React from "react";
import { FolderKanban, Plus, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEMO_PROJECTS, PROJECT_STATUS, type ProjectStatus } from "@/data/demo/projects";
import { DEMO_USERS } from "@/data/demo/users";
import { useSession } from "@/lib/auth/session-provider";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./project-card";

type StatusFilter = ProjectStatus | "alla";

export function ProjectList() {
  const { can } = useSession();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("alla");
  const [manager, setManager] = React.useState("alla");

  const managers = DEMO_USERS.filter((u) => DEMO_PROJECTS.some((p) => p.managerId === u.id));

  const filtered = DEMO_PROJECTS.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || [p.name, p.number, p.client, p.location, p.category].some((v) => v.toLowerCase().includes(q));
    return matchesQuery && (status === "alla" || p.status === status) && (manager === "alla" || p.managerId === manager);
  });

  const statusTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: "alla", label: "Alla", count: DEMO_PROJECTS.length },
    ...(Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => ({
      value: s,
      label: PROJECT_STATUS[s].label,
      count: DEMO_PROJECTS.filter((p) => p.status === s).length,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Projekt"
        description="Översikt över företagets projekt. Visar fiktiva exempelprojekt."
        actions={
          can("projects.edit") && (
            <Button size="sm" disabled title="Kommer när databasen kopplas in">
              <Plus /> Nytt projekt
            </Button>
          )
        }
      />

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök på namn, nummer, beställare eller ort…"
              className="bg-card pl-9"
              aria-label="Sök projekt"
            />
          </div>
          <Select value={manager} onValueChange={setManager}>
            <SelectTrigger className="bg-card w-full sm:w-56" aria-label="Filtrera på ansvarig">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla ansvariga</SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filtrera på status">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                status === tab.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-accent text-muted-foreground",
              )}
            >
              {tab.label}
              <span className={cn("text-xs tabular-nums", status === tab.value ? "opacity-80" : "opacity-60")}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Inga projekt matchar" description="Prova en annan sökning eller ändra filtren." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </>
  );
}
