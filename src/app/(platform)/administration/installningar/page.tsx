import type { Metadata } from "next";

import { PlatformSettings } from "@/components/admin/platform-settings";

export const metadata: Metadata = { title: "Inställningar" };

export default function SettingsPage() {
  return <PlatformSettings />;
}
