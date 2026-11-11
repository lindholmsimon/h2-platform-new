import { MapPin } from "lucide-react";

import { DEMO_EVENTS } from "@/data/demo/workspace";
import { formatDate } from "@/lib/utils";

const time = (iso: string) => formatDate(iso, { hour: "2-digit", minute: "2-digit" });
const day = (iso: string) => formatDate(iso, { weekday: "short", day: "numeric", month: "short" });

export function CalendarWidget() {
  return (
    <ul className="flex flex-col gap-3">
      {DEMO_EVENTS.map((event) => (
        <li key={event.id} className="flex gap-3">
          <div className="bg-primary/10 text-primary flex w-14 shrink-0 flex-col items-center justify-center rounded-lg py-1.5 text-center">
            <span className="text-[10px] font-medium uppercase">{day(event.start).split(" ")[0]}</span>
            <span className="text-sm font-semibold tabular-nums">{time(event.start)}</span>
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-0.5">
            <span className="truncate text-sm font-medium">{event.title}</span>
            {event.location && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <MapPin className="size-3" /> {event.location} · {time(event.start)}–{time(event.end)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
