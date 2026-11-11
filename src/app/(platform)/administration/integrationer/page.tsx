import type { Metadata } from "next";

import { IntegrationsAdmin } from "@/components/admin/integrations-admin";

export const metadata: Metadata = { title: "Integrationer" };

export default function IntegrationsPage() {
  return <IntegrationsAdmin />;
}
