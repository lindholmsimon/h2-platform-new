import { RequirePermission } from "@/components/shared/require-permission";

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
  return <RequirePermission permission="admin.view">{children}</RequirePermission>;
}
