"use client";

import { FlaskConical, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Brand } from "./brand";
import { MobileMenu } from "./mobile-nav";
import { NotificationsMenu } from "./notifications-menu";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar() {
  return (
    <header className="bg-background/90 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 backdrop-blur md:px-6">
      <MobileMenu />
      <Brand collapsed size="sm" priority className="md:hidden" />
      <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          type="search"
          placeholder="Sök i plattformen…"
          aria-label="Sök (kommer i senare fas)"
          disabled
          className="bg-muted/60 placeholder:text-muted-foreground h-9 w-full rounded-lg border border-transparent pr-3 pl-9 text-sm outline-none disabled:cursor-not-allowed"
        />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Badge variant="warning" className="mr-1 hidden sm:inline-flex">
          <FlaskConical /> Demoläge
        </Badge>
        <ThemeToggle />
        <NotificationsMenu />
        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
