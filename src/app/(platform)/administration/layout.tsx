import { RequirePermission } from "@/components/shared/require-permission";
import { ADMIN_PERMISSIONS } from "@/config/modules";

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
  return <RequirePermission permission={ADMIN_PERMISSIONS}>{children}</RequirePermission>;
}
