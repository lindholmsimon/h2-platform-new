import Link from "next/link";
import { Activity, MapPin } from "lucide-react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DEMO_NOW } from "@/data/demo";
import type { Project } from "@/data/demo/projects";
import { getUser } from "@/data/demo/users";
import { formatRelative } from "@/lib/utils";
import { ProjectStatusBadge } from "./project-status-badge";

export function ProjectCard({ project }: { project: Project }) {
  const manager = getUser(project.managerId);
  const actor = getUser(project.lastActivity.userId);
  return (
    <Link
      href={`/projekt/${project.id}`}
      className="group rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Card className="group-hover:border-primary/40 h-full gap-4 py-5 transition-all group-hover:shadow-md">
        <div className="flex flex-col gap-3 px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-muted-foreground font-mono text-xs">{project.number}</span>
              <h3 className="group-hover:text-primary leading-snug font-semibold transition-colors">{project.name}</h3>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <MapPin className="size-3.5" /> {project.location} · {project.category}
          </div>
          <div className="flex items-center gap-3">
            <Progress value={project.progress} className="flex-1" />
            <span className="text-muted-foreground text-xs tabular-nums">{project.progress}%</span>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-3 border-t px-5 pt-4">
          {manager && (
            <div className="flex items-center gap-2 text-sm">
              <UserAvatar name={manager.name} className="size-6 text-[10px]" />
              <span className="truncate">{manager.name}</span>
              <span className="text-muted-foreground text-xs">Ansvarig</span>
            </div>
          )}
          <div className="text-muted-foreground flex items-start gap-2 text-xs">
            <Activity className="mt-px size-3.5 shrink-0" />
            <span className="line-clamp-2">
              {project.lastActivity.text}
              {actor && ` · ${actor.name.split(" ")[0]}`} · {formatRelative(project.lastActivity.at, DEMO_NOW)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
