import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/projects/project-detail";
import { RequirePermission } from "@/components/shared/require-permission";
import { DEMO_PROJECTS, getProject } from "@/data/demo/projects";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return DEMO_PROJECTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  return { title: getProject(id)?.name ?? "Projekt" };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  return (
    <RequirePermission permission="projects.view">
      <ProjectDetail project={project} />
    </RequirePermission>
  );
}
