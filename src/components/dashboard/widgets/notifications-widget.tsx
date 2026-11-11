import { Bell, FileText, ListTodo, TriangleAlert, type LucideIcon } from "lucide-react";

import { DEMO_NOW } from "@/data/demo";
import { DEMO_NOTIFICATIONS, type NotificationKind } from "@/data/demo/workspace";
import { cn, formatRelative } from "@/lib/utils";

const ICONS: Record<NotificationKind, { icon: LucideIcon; className: string }> = {
  info: { icon: Bell, className: "bg-info/12 text-info" },
  uppgift: { icon: ListTodo, className: "bg-primary/10 text-primary" },
  fil: { icon: FileText, className: "bg-success/12 text-success" },
  varning: { icon: TriangleAlert, className: "bg-warning/15 text-warning" },
};

export function NotificationsWidget() {
  return (
    <ul className="flex flex-col gap-3">
      {DEMO_NOTIFICATIONS.map((n) => {
        const { icon: Icon, className } = ICONS[n.kind];
        return (
          <li key={n.id} className="flex gap-3">
            <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", className)}>
              <Icon className="size-4" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cn("truncate text-sm", !n.read && "font-medium")}>{n.title}</span>
              <span className="text-muted-foreground truncate text-xs">{n.body}</span>
            </div>
            <span className="text-muted-foreground shrink-0 text-xs">{formatRelative(n.at, DEMO_NOW)}</span>
          </li>
        );
      })}
    </ul>
  );
}
