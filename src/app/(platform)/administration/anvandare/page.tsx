import type { Metadata } from "next";

import { RequirePermission } from "@/components/shared/require-permission";
import { UsersAdmin } from "@/components/admin/users-admin";

export const metadata: Metadata = { title: "Användare & roller" };

export default function UsersPage() {
  return (
    <RequirePermission permission={["users.view", "roles.view"]}>
      <UsersAdmin />
    </RequirePermission>
  );
}
