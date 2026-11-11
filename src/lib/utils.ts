import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const relativeFormatter = new Intl.RelativeTimeFormat("sv-SE", { numeric: "auto" });

/** Formats an ISO date relative to a fixed reference date (demo data is static). */
export function formatRelative(iso: string, now: Date = new Date()) {
  const diffMs = new Date(iso).getTime() - now.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 60) return relativeFormatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFormatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return relativeFormatter.format(days, "day");
  return formatDate(iso);
}

/** Fast tidszon så att server (Vercel, UTC) och webbläsare renderar samma tider. */
export const TIME_ZONE = "Europe/Stockholm";

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("sv-SE", {
    ...(options ?? { day: "numeric", month: "short", year: "numeric" }),
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}
