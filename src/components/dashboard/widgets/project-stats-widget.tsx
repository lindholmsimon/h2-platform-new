import { DEMO_PROJECTS, PROJECT_STATUS, type ProjectStatus } from "@/data/demo/projects";

export function ProjectStatsWidget() {
  const counts = (Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((status) => ({
    status,
    label: PROJECT_STATUS[status].label,
    count: DEMO_PROJECTS.filter((p) => p.status === status).length,
  }));
  return (
    <div className="grid grid-cols-2 gap-3">
      {counts.map((c) => (
        <div key={c.status} className="bg-muted/50 rounded-lg p-3">
          <div className="text-2xl font-semibold tabular-nums">{c.count}</div>
          <div className="text-muted-foreground text-xs">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
