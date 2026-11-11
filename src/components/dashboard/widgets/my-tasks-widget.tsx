"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DEMO_NOW } from "@/data/demo";
import { DEMO_PROJECTS } from "@/data/demo/projects";
import { useSession } from "@/lib/auth/session-provider";
import { cn, formatRelative } from "@/lib/utils";

export function MyTasksWidget() {
  const { user } = useSession();
  const tasks = React.useMemo(
    () =>
      DEMO_PROJECTS.flatMap((p) => p.tasks.map((t) => ({ ...t, project: p })))
        .filter((t) => t.assigneeId === user.id && t.status !== "klar")
        .sort((a, b) => a.due.localeCompare(b.due)),
    [user.id],
  );
  const [done, setDone] = React.useState<Set<string>>(new Set());

  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">Inga öppna uppgifter för {user.name.split(" ")[0]}. 🎉</p>;
  }

  return (
    <ul className="-mx-2 flex flex-col">
      {tasks.slice(0, 5).map((task) => {
        const key = `${task.project.id}-${task.id}`;
        const checked = done.has(key);
        return (
          <li key={key} className="hover:bg-muted/60 flex items-start gap-3 rounded-lg px-2 py-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                setDone((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
              className="accent-primary mt-0.5 size-4 cursor-pointer"
              aria-label={`Markera ${task.title} som klar`}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cn("text-sm font-medium", checked && "text-muted-foreground line-through")}>
                {task.title}
              </span>
              <Link href={`/projekt/${task.project.id}`} className="text-muted-foreground truncate text-xs hover:underline">
                {task.project.name}
              </Link>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {task.priority === "hog" && <Badge variant="destructive">Hög</Badge>}
              <span className="text-muted-foreground text-xs">{formatRelative(task.due, DEMO_NOW)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
