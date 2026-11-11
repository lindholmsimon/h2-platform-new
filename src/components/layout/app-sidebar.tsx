"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-svh shrink-0 flex-col border-r transition-[width] duration-200 md:flex",
        collapsed ? "w-[4.25rem]" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-2")}>
        <Brand collapsed={collapsed} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks collapsed={collapsed} />
      </div>
      <div className="border-sidebar-border flex flex-col gap-2 border-t p-3">
        <UserMenu variant="sidebar" collapsed={collapsed} />
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn("text-muted-foreground justify-start", collapsed && "justify-center")}
          aria-label={collapsed ? "Fäll ut sidomenyn" : "Fäll ihop sidomenyn"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {!collapsed && "Fäll ihop"}
        </Button>
      </div>
    </aside>
  );
}
