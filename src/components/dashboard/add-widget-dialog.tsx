"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WIDGETS, type WidgetId } from "./widget-registry";

export function AddWidgetDialog({ available, onAdd }: { available: WidgetId[]; onAdd: (id: WidgetId) => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus /> Lägg till widget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till widget</DialogTitle>
          <DialogDescription>Välj vilka widgets som ska visas på din startsida.</DialogDescription>
        </DialogHeader>
        {available.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">Alla tillgängliga widgets finns redan på din dashboard.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {available.map((id) => {
              const w = WIDGETS[id];
              return (
                <li key={id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
                    <w.icon className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">{w.title}</span>
                    <span className="text-muted-foreground text-xs">{w.description}</span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => onAdd(id)}>
                    Lägg till
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
