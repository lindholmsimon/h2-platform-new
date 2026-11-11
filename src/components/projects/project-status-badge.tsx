import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS, type ProjectStatus } from "@/data/demo/projects";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { label, variant } = PROJECT_STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}
