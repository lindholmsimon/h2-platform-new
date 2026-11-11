"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isActive, NAV_GROUPS } from "@/config/modules";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export function NavLinks({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can } = useSession();

  return (
    <nav className="flex flex-col gap-5" aria-label="Huvudnavigation">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => can(item.permission));
        if (items.length === 0) return null;
        return (
          <div key={group.id} className="flex flex-col gap-1">
            {collapsed ? (
              <div className="bg-sidebar-border mx-auto mb-1 h-px w-6" />
            ) : (
              <span className="text-muted-foreground px-3 pb-1 text-[11px] font-medium tracking-wider uppercase">
                {group.label}
              </span>
            )}
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              const link = (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    active && "bg-sidebar-accent text-sidebar-accent-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon className={cn("size-[1.1rem] shrink-0", active && "text-sidebar-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
              return collapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
