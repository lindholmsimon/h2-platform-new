import {
  FolderKanban,
  LayoutDashboard,
  Plug,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/auth/types";

/**
 * Modulregister – källan till navigationen.
 *
 * Lägg till en ny modul genom att:
 *  1. skapa en route under src/app/(platform)/<modul>/
 *  2. lägga till en post här med rätt behörighet
 * Sidomeny, mobilmeny och bottennavigation byggs automatiskt härifrån.
 */

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
  /** Visas i mobilens bottennavigation. */
  mobile?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "arbete",
    label: "Arbete",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard, permission: "dashboard.view", mobile: true },
      { id: "projekt", label: "Projekt", href: "/projekt", icon: FolderKanban, permission: "projects.view", mobile: true },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      { id: "anvandare", label: "Användare & roller", href: "/administration/anvandare", icon: Users, permission: "admin.view", mobile: true },
      { id: "integrationer", label: "Integrationer", href: "/administration/integrationer", icon: Plug, permission: "admin.view" },
      { id: "installningar", label: "Inställningar", href: "/administration/installningar", icon: Settings, permission: "admin.view" },
    ],
  },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
