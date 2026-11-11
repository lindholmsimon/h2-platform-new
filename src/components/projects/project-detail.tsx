"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, MapPin } from "lucide-react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project } from "@/data/demo/projects";
import { formatDate } from "@/lib/utils";
import { ProjectAiTab } from "./tabs/project-ai-tab";
import { ProjectFilesTab } from "./tabs/project-files-tab";
import { ProjectOverviewTab } from "./tabs/project-overview-tab";
import { ProjectTasksTab } from "./tabs/project-tasks-tab";
import { ProjectStatusBadge } from "./project-status-badge";
import { getUser } from "@/data/demo/users";

export function ProjectDetail({ project }: { project: Project }) {
  const manager = getUser(project.managerId);
  const openTasks = project.tasks.filter((t) => t.status !== "klar").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/projekt"
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" /> Alla projekt
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-xs">{project.number}</span>
              <ProjectStatusBadge status={project.status} />
              <Badge variant="outline">{project.category}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">{project.name}</h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5">
                <Building2 className="size-4" /> {project.client}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {project.location}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {formatDate(project.startDate)} – {formatDate(project.endDate)}
              </span>
            </div>
          </div>
          {manager && (
            <div className="bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
              <UserAvatar name={manager.name} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{manager.name}</span>
                <span className="text-muted-foreground text-xs">Projektansvarig</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="oversikt">
        <TabsList>
          <TabsTrigger value="oversikt">Översikt</TabsTrigger>
          <TabsTrigger value="filer">
            Filer <span className="text-muted-foreground text-xs">{project.files.length}</span>
          </TabsTrigger>
          <TabsTrigger value="uppgifter">
            Uppgifter <span className="text-muted-foreground text-xs">{openTasks}</span>
          </TabsTrigger>
          <TabsTrigger value="ai">AI-analys</TabsTrigger>
        </TabsList>
        <TabsContent value="oversikt">
          <ProjectOverviewTab project={project} />
        </TabsContent>
        <TabsContent value="filer">
          <ProjectFilesTab project={project} />
        </TabsContent>
        <TabsContent value="uppgifter">
          <ProjectTasksTab project={project} />
        </TabsContent>
        <TabsContent value="ai">
          <ProjectAiTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
