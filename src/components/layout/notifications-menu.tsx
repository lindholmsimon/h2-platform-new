"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEMO_NOW } from "@/data/demo";
import { DEMO_NOTIFICATIONS } from "@/data/demo/workspace";
import { cn, formatRelative } from "@/lib/utils";

export function NotificationsMenu() {
  const unread = DEMO_NOTIFICATIONS.filter((n) => !n.read).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notiser, ${unread} olästa`}>
          <Bell className="size-[1.1rem]" />
          {unread > 0 && <span className="bg-destructive ring-background absolute top-2 right-2 size-2 rounded-full ring-2" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notiser <span className="text-muted-foreground text-xs font-normal">{unread} olästa</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DEMO_NOTIFICATIONS.map((n) => (
          <DropdownMenuItem key={n.id} className="items-start gap-3 py-2">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{n.title}</span>
              <span className="text-muted-foreground truncate text-xs">{n.body}</span>
              <span className="text-muted-foreground text-[11px]">{formatRelative(n.at, DEMO_NOW)}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
