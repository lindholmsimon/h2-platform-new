"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { isActive, NAV_GROUPS } from "@/config/modules";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

/** Hamburgarmeny för små skärmar. */
export function MobileMenu() {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Öppna meny">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-sidebar w-72 p-0">
        <SheetTitle className="sr-only">Meny</SheetTitle>
        <SheetDescription className="sr-only">Navigera mellan plattformens moduler</SheetDescription>
        <div className="flex h-16 items-center px-4">
          <Brand />
        </div>
        <div className="px-3 py-2">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Fast bottennavigation för mobil – visar moduler markerade med `mobile: true`. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { can } = useSession();
  const items = NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.mobile && can(i.permission));
  const tabs = [...items, { id: "profil", label: "Profil", href: "/profil", icon: User }];

  return (
    <nav
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Snabbnavigation"
    >
      <ul className="flex">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.id} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active && "text-primary",
                )}
              >
                <tab.icon className="size-5" />
                <span className="max-w-full truncate px-1">{tab.label.split(" ")[0]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
