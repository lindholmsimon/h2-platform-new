import Link from "next/link";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Progress } from "@/components/ui/progress";
import { DEMO_NOW } from "@/data/demo";
import { DEMO_PROJECTS } from "@/data/demo/projects";
import { formatRelative } from "@/lib/utils";

export function RecentProjectsWidget() {
  const projects = [...DEMO_PROJECTS]
    .sort((a, b) => b.lastActivity.at.localeCompare(a.lastActivity.at))
    .slice(0, 4);
  return (
    <ul className="-mx-2 flex flex-col">
      {projects.map((p) => (
        <li key={p.id}>
          <Link href={`/projekt/${p.id}`} className="hover:bg-muted/60 flex flex-col gap-2 rounded-lg px-2 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{p.name}</span>
              <ProjectStatusBadge status={p.status} />
            </div>
            <div className="flex items-center gap-3">
              <Progress value={p.progress} className="flex-1" />
              <span className="text-muted-foreground shrink-0 text-right text-xs whitespace-nowrap">{formatRelative(p.lastActivity.at, DEMO_NOW)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
