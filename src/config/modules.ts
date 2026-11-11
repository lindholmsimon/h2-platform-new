import {
  FolderKanban,
  History,
  LayoutDashboard,
  Plug,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/auth/permissions";

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
  /** Visas om användaren har minst en av behörigheterna. */
  permission: Permission | readonly Permission[];
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
      {
        id: "anvandare",
        label: "Användare & roller",
        href: "/administration/anvandare",
        icon: Users,
        permission: ["users.view", "roles.view"],
        mobile: true,
      },
      { id: "historik", label: "Aktivitetslogg", href: "/administration/historik", icon: History, permission: "audit.view" },
      { id: "integrationer", label: "Integrationer", href: "/administration/integrationer", icon: Plug, permission: "integrations.view" },
      { id: "installningar", label: "Inställningar", href: "/administration/installningar", icon: Settings, permission: "settings.view" },
    ],
  },
];

/** Alla behörigheter som ger tillgång till någon del av administrationen. */
export const ADMIN_PERMISSIONS: readonly Permission[] = [
  "users.view",
  "roles.view",
  "audit.view",
  "integrations.view",
  "settings.view",
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
