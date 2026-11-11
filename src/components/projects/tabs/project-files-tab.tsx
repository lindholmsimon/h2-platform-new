import { File, FileImage, FileSpreadsheet, FileText, FolderOpen, Upload, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEMO_NOW } from "@/data/demo";
import type { Project, ProjectFile } from "@/data/demo/projects";
import { getUser } from "@/data/demo/users";
import { formatRelative } from "@/lib/utils";

const FILE_ICONS: Record<ProjectFile["type"], LucideIcon> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  jpg: FileImage,
  dwg: File,
};

export function ProjectFilesTab({ project }: { project: Project }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Filer hämtas från Dropbox när integrationen är ansluten. Nedan visas exempelfiler.
        </p>
        <Button size="sm" variant="outline" disabled>
          <Upload /> Ladda upp
        </Button>
      </div>
      {project.files.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Inga filer ännu" description="Projektets filer visas här." />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namn</TableHead>
                <TableHead className="hidden sm:table-cell">Mapp</TableHead>
                <TableHead className="hidden md:table-cell">Storlek</TableHead>
                <TableHead>Ändrad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.files.map((f) => {
                const Icon = FILE_ICONS[f.type];
                return (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Icon className="text-muted-foreground size-4 shrink-0" />
                        <span className="max-w-[14rem] truncate font-medium sm:max-w-none">{f.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{f.folder}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{f.size}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelative(f.updatedAt, DEMO_NOW)}
                      <span className="hidden lg:inline"> · {getUser(f.updatedBy)?.name.split(" ")[0]}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
