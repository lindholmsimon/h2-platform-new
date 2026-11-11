"use client";

import { Check } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAccess } from "@/lib/access/access-context";
import { rolesOf } from "@/lib/auth/policy";
import { useSession } from "@/lib/auth/session";
import { USER_STATUS } from "@/lib/auth/types";
import { UserAvatar } from "./user-avatar";

export function DemoUserMenuItems() {
  const { user, switchUser } = useSession();
  const { snapshot } = useAccess();
  return (
    <>
      {snapshot.users.map((u) => (
        <DropdownMenuItem key={u.id} onSelect={() => switchUser(u.id)} className="gap-2.5">
          <UserAvatar name={u.name} className="size-6 text-[10px]" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{u.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {rolesOf(snapshot, u)
                .map((r) => r.name)
                .join(", ") || "Ingen roll"}
              {u.status !== "active" && ` · ${USER_STATUS[u.status].label}`}
            </span>
          </div>
          {u.id === user.id && <Check className="text-primary" />}
        </DropdownMenuItem>
      ))}
    </>
  );
}
