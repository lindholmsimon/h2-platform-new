import type { Metadata } from "next";

import { RequirePermission } from "@/components/shared/require-permission";
import { IntegrationsAdmin } from "@/components/admin/integrations-admin";

export const metadata: Metadata = { title: "Integrationer" };

export default function IntegrationsPage() {
  return (
    <RequirePermission permission={"integrations.view"}>
      <IntegrationsAdmin />
    </RequirePermission>
  );
}
