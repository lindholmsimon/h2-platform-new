"use client";

import * as React from "react";
import { Check, LayoutGrid, RotateCcw, SlidersHorizontal } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEMO_NOW } from "@/data/demo";
import { useSession } from "@/lib/auth/session-provider";
import { formatDate } from "@/lib/utils";
import { AddWidgetDialog } from "./add-widget-dialog";
import { useDashboardLayout } from "./use-dashboard-layout";
import { WidgetFrame } from "./widget-frame";
import { WIDGETS } from "./widget-registry";

function greeting(date: Date) {
  const h = Number(formatDate(date.toISOString(), { hour: "numeric", hourCycle: "h23" }));
  if (h < 10) return "God morgon";
  if (h < 17) return "Hej";
  return "God kväll";
}

export function Dashboard() {
  const { user } = useSession();
  const { layout, ready, available, add, remove, move, reset } = useDashboardLayout(user.id);
  const [editing, setEditing] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  return (
    <>
      <PageHeader
        title={`${greeting(DEMO_NOW)}, ${user.name.split(" ")[0]}`}
        description={`${formatDate(DEMO_NOW.toISOString(), { weekday: "long", day: "numeric", month: "long" })} · Här är din översikt.`}
        actions={
          editing ? (
            <>
              <AddWidgetDialog available={available} onAdd={add} />
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw /> Återställ
              </Button>
              <Button size="sm" onClick={() => setEditing(false)}>
                <Check /> Klar
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <SlidersHorizontal /> Anpassa
            </Button>
          )
        }
      />

      {editing && (
        <p className="text-muted-foreground mb-4 text-sm">
          Dra widgets för att ändra ordning, eller använd pilarna. Layouten sparas automatiskt i webbläsaren.
        </p>
      )}

      {!ready ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : layout.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Din dashboard är tom"
          description="Lägg till widgets för att bygga din personliga startsida."
          action={<AddWidgetDialog available={available} onAdd={add} />}
        />
      ) : (
        <div className="grid grid-flow-row-dense gap-4 md:grid-cols-2 lg:grid-cols-3">
          {layout.map((id, index) => (
            <WidgetFrame
              key={id}
              widget={WIDGETS[id]}
              editing={editing}
              isFirst={index === 0}
              isLast={index === layout.length - 1}
              dragging={dragIndex === index}
              onMoveUp={() => move(index, index - 1)}
              onMoveDown={() => move(index, index + 1)}
              onRemove={() => remove(id)}
              dragProps={
                editing
                  ? {
                      draggable: true,
                      onDragStart: (e) => {
                        setDragIndex(index);
                        e.dataTransfer.effectAllowed = "move";
                      },
                      onDragOver: (e) => e.preventDefault(),
                      onDrop: (e) => {
                        e.preventDefault();
                        if (dragIndex !== null) move(dragIndex, index);
                        setDragIndex(null);
                      },
                      onDragEnd: () => setDragIndex(null),
                    }
                  : {}
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
