import type { Metadata } from "next";

import { AuditLogView } from "@/components/admin/audit-log-view";
import { RequirePermission } from "@/components/shared/require-permission";

export const metadata: Metadata = { title: "Aktivitetslogg" };

export default function AuditLogPage() {
  return (
    <RequirePermission permission="audit.view">
      <AuditLogView />
    </RequirePermission>
  );
}
