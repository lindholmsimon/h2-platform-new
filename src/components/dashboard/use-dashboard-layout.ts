"use client";

import * as React from "react";

import { DEFAULT_LAYOUT, WIDGETS, type WidgetId } from "./widget-registry";

/**
 * Widgetlayout per användare, sparad i localStorage.
 * Byts mot Supabase (tabell `dashboard_layouts`) när databasen kopplas in –
 * behåll samma returtyp så att komponenterna inte behöver ändras.
 */
const storageKey = (userId: string) => `h2.dashboard.layout.v1.${userId}`;

function readLayout(userId: string): WidgetId[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;
    return parsed.filter((id): id is WidgetId => typeof id === "string" && id in WIDGETS);
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function useDashboardLayout(userId: string) {
  const [layout, setLayout] = React.useState<WidgetId[]>(DEFAULT_LAYOUT);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setLayout(readLayout(userId));
    setReady(true);
  }, [userId]);

  const update = React.useCallback(
    (next: WidgetId[]) => {
      setLayout(next);
      try {
        window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
      } catch {
        // ignorera – layouten gäller då bara för sessionen
      }
    },
    [userId],
  );

  return {
    layout,
    ready,
    available: (Object.keys(WIDGETS) as WidgetId[]).filter((id) => !layout.includes(id)),
    add: (id: WidgetId) => update([...layout, id]),
    remove: (id: WidgetId) => update(layout.filter((w) => w !== id)),
    move: (from: number, to: number) => {
      if (to < 0 || to >= layout.length || from === to) return;
      const next = [...layout];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      update(next);
    },
    reset: () => update(DEFAULT_LAYOUT),
  };
}
