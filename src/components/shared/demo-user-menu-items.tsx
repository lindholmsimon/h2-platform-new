"use client";

import { Check } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DEMO_USERS } from "@/data/demo/users";
import { ROLES } from "@/lib/auth/roles";
import { useSession } from "@/lib/auth/session-provider";
import { UserAvatar } from "./user-avatar";

export function DemoUserMenuItems() {
  const { user, switchUser } = useSession();
  return (
    <>
      {DEMO_USERS.map((u) => (
        <DropdownMenuItem key={u.id} onSelect={() => switchUser(u.id)} className="gap-2.5">
          <UserAvatar name={u.name} className="size-6 text-[10px]" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{u.name}</span>
            <span className="text-muted-foreground truncate text-xs">{ROLES[u.roleId].name}</span>
          </div>
          {u.id === user.id && <Check className="text-primary" />}
        </DropdownMenuItem>
      ))}
    </>
  );
}
