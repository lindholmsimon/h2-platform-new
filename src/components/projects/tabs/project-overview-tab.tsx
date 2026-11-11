import { UserAvatar } from "@/components/shared/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DEMO_NOW } from "@/data/demo";
import type { Project } from "@/data/demo/projects";
import { getUser } from "@/data/demo/users";
import { formatRelative } from "@/lib/utils";

export function ProjectOverviewTab({ project }: { project: Project }) {
  const done = project.tasks.filter((t) => t.status === "klar").length;
  const daysLeft = Math.round((new Date(project.endDate).getTime() - DEMO_NOW.getTime()) / 86400000);
  const stats = [
    { label: "Färdigställt", value: `${project.progress}%` },
    { label: "Uppgifter klara", value: `${done}/${project.tasks.length}` },
    { label: "Filer", value: project.files.length },
    { label: daysLeft >= 0 ? "Dagar kvar" : "Dagar sedan slut", value: Math.abs(daysLeft) },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="gap-1 py-4">
              <CardContent className="px-4">
                <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
                <div className="text-muted-foreground text-xs">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Om projektet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>Total framdrift</span>
                <span className="text-muted-foreground tabular-nums">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Projektteam</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {project.teamIds.map((id) => {
                const u = getUser(id);
                if (!u) return null;
                return (
                  <li key={id} className="flex items-center gap-3">
                    <UserAvatar name={u.name} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{u.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {u.title} · {u.department}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Senaste aktivitet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{project.lastActivity.text}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {getUser(project.lastActivity.userId)?.name} · {formatRelative(project.lastActivity.at, DEMO_NOW)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
