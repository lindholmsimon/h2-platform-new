"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, User } from "lucide-react";

import { DemoUserMenuItems } from "@/components/shared/demo-user-menu-items";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth/session-provider";
import { cn } from "@/lib/utils";

export function UserMenu({ variant = "compact", collapsed = false }: { variant?: "compact" | "sidebar"; collapsed?: boolean }) {
  const { user, role } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button
            className={cn(
              "hover:bg-sidebar-accent flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed && "justify-center p-1.5",
            )}
            aria-label="Användarmeny"
          >
            <UserAvatar name={user.name} />
            {!collapsed && (
              <>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{role.name}</span>
                </div>
                <ChevronsUpDown className="text-muted-foreground size-4" />
              </>
            )}
          </button>
        ) : (
          <button className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Användarmeny">
            <UserAvatar name={user.name} />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={variant === "sidebar" ? "top" : "bottom"} className="w-64">
        <DropdownMenuLabel className="flex flex-col">
          <span>{user.name}</span>
          <span className="text-muted-foreground text-xs font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profil">
            <User /> Min profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Byt demoanvändare</DropdownMenuLabel>
        <DemoUserMenuItems />
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <LogOut /> Logga ut (kommer med Entra ID)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
