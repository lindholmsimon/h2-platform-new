import { Bell, Bot, CalendarDays, ChartColumn, FolderKanban, Link2, ListTodo, type LucideIcon } from "lucide-react";

import { AiAssistantWidget } from "./widgets/ai-assistant-widget";
import { CalendarWidget } from "./widgets/calendar-widget";
import { MyTasksWidget } from "./widgets/my-tasks-widget";
import { NotificationsWidget } from "./widgets/notifications-widget";
import { ProjectStatsWidget } from "./widgets/project-stats-widget";
import { QuickLinksWidget } from "./widgets/quick-links-widget";
import { RecentProjectsWidget } from "./widgets/recent-projects-widget";

/**
 * Widgetregister. Lägg till en ny widget genom att skapa en komponent i
 * ./widgets och registrera den här – den dyker då upp i "Lägg till widget".
 */

export type WidgetId =
  | "my-tasks"
  | "calendar"
  | "recent-projects"
  | "notifications"
  | "ai-assistant"
  | "project-stats"
  | "quick-links";

export interface WidgetDefinition {
  id: WidgetId;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Antal kolumner på stora skärmar (av 3). */
  size: 1 | 2;
  Component: React.ComponentType;
}

export const WIDGETS: Record<WidgetId, WidgetDefinition> = {
  "my-tasks": {
    id: "my-tasks",
    title: "Mina uppgifter",
    description: "Öppna uppgifter tilldelade dig",
    icon: ListTodo,
    size: 2,
    Component: MyTasksWidget,
  },
  calendar: {
    id: "calendar",
    title: "Kalender",
    description: "Kommande möten och händelser",
    icon: CalendarDays,
    size: 1,
    Component: CalendarWidget,
  },
  "recent-projects": {
    id: "recent-projects",
    title: "Senaste projekt",
    description: "Projekt med senast aktivitet",
    icon: FolderKanban,
    size: 1,
    Component: RecentProjectsWidget,
  },
  notifications: {
    id: "notifications",
    title: "Notiser",
    description: "Händelser som rör dig",
    icon: Bell,
    size: 1,
    Component: NotificationsWidget,
  },
  "ai-assistant": {
    id: "ai-assistant",
    title: "AI-assistent",
    description: "Ställ frågor om projekt och underlag",
    icon: Bot,
    size: 1,
    Component: AiAssistantWidget,
  },
  "project-stats": {
    id: "project-stats",
    title: "Projektstatus",
    description: "Antal projekt per status",
    icon: ChartColumn,
    size: 1,
    Component: ProjectStatsWidget,
  },
  "quick-links": {
    id: "quick-links",
    title: "Snabblänkar",
    description: "Genvägar till vanliga sidor",
    icon: Link2,
    size: 1,
    Component: QuickLinksWidget,
  },
};

export const DEFAULT_LAYOUT: WidgetId[] = ["my-tasks", "calendar", "recent-projects", "notifications", "ai-assistant"];
