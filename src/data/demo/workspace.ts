import { daysFromNow } from ".";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  projectId?: string;
}

export const DEMO_EVENTS: CalendarEvent[] = [
  { id: "e1", title: "Byggmöte Kv. Lärkan", start: daysFromNow(0, 1), end: daysFromNow(0, 2), location: "Platskontor", projectId: "p-1001" },
  { id: "e2", title: "Avstämning kalkyl Logistiklager", start: daysFromNow(0, 4.5), end: daysFromNow(0, 5.5), location: "Teams", projectId: "p-1003" },
  { id: "e3", title: "Skyddsrond Västra skolan", start: daysFromNow(1, -1), end: daysFromNow(1, 0), location: "Västra skolan", projectId: "p-1002" },
  { id: "e4", title: "Ledningsgruppsmöte", start: daysFromNow(2, 0.5), end: daysFromNow(2, 2), location: "Huvudkontoret" },
];

export type NotificationKind = "info" | "uppgift" | "fil" | "varning";

export interface DemoNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
}

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { id: "n1", kind: "fil", title: "Ny fil i Kv. Lärkan", body: "K-ritning plan 4 rev C laddades upp", at: daysFromNow(0, -2), read: false },
  { id: "n2", kind: "uppgift", title: "Du har tilldelats en uppgift", body: "Provtagning asbest hus B", at: daysFromNow(0, -5), read: false },
  { id: "n3", kind: "varning", title: "Deadline närmar sig", body: "Stämma av gjutplan plan 4 – i morgon", at: daysFromNow(-1), read: true },
  { id: "n4", kind: "info", title: "Plattformen är i demoläge", body: "Integrationer ansluts i en senare fas", at: daysFromNow(-2), read: true },
];
