import type { Metadata } from "next";

import { RequirePermission } from "@/components/shared/require-permission";
import { PlatformSettings } from "@/components/admin/platform-settings";

export const metadata: Metadata = { title: "Inställningar" };

export default function SettingsPage() {
  return (
    <RequirePermission permission={"settings.view"}>
      <PlatformSettings />
    </RequirePermission>
  );
}
