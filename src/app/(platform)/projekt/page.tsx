import type { Metadata } from "next";

import { ProjectList } from "@/components/projects/project-list";
import { RequirePermission } from "@/components/shared/require-permission";

export const metadata: Metadata = { title: "Projekt" };

export default function ProjectsPage() {
  return (
    <RequirePermission permission="projects.view">
      <ProjectList />
    </RequirePermission>
  );
}
