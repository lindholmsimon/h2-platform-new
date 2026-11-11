import { ListTodo } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_NOW } from "@/data/demo";
import type { Project, TaskStatus } from "@/data/demo/projects";
import { getUser } from "@/data/demo/users";
import { formatRelative } from "@/lib/utils";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "att-gora", label: "Att göra" },
  { status: "pagar", label: "Pågår" },
  { status: "klar", label: "Klar" },
];

const PRIORITY = {
  hog: { label: "Hög", variant: "destructive" },
  normal: { label: "Normal", variant: "secondary" },
  lag: { label: "Låg", variant: "outline" },
} as const;

export function ProjectTasksTab({ project }: { project: Project }) {
  if (project.tasks.length === 0) {
    return <EmptyState icon={ListTodo} title="Inga uppgifter" description="Projektet har inga uppgifter just nu." />;
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const tasks = project.tasks.filter((t) => t.status === col.status);
        return (
          <Card key={col.status} className="bg-muted/40 gap-3 py-4 shadow-none">
            <CardHeader className="px-4">
              <CardTitle className="flex items-center justify-between text-sm">
                {col.label} <span className="text-muted-foreground font-normal">{tasks.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-3">
              {tasks.map((t) => {
                const assignee = getUser(t.assigneeId);
                return (
                  <div key={t.id} className="bg-card flex flex-col gap-2.5 rounded-lg border p-3 shadow-xs">
                    <span className="text-sm font-medium">{t.title}</span>
                    <div className="flex items-center gap-2">
                      {assignee && <UserAvatar name={assignee.name} className="size-6 text-[10px]" />}
                      <span className="text-muted-foreground flex-1 text-xs">{formatRelative(t.due, DEMO_NOW)}</span>
                      <Badge variant={PRIORITY[t.priority].variant}>{PRIORITY[t.priority].label}</Badge>
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && <p className="text-muted-foreground px-1 py-2 text-xs">Inga uppgifter</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
