"use client";

import { ArrowDown, ArrowUp, GripVertical, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WidgetDefinition } from "./widget-registry";

interface WidgetFrameProps {
  widget: WidgetDefinition;
  editing: boolean;
  isFirst: boolean;
  isLast: boolean;
  dragging: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  dragProps: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
}

export function WidgetFrame({
  widget,
  editing,
  isFirst,
  isLast,
  dragging,
  onMoveUp,
  onMoveDown,
  onRemove,
  dragProps,
}: WidgetFrameProps) {
  const { Component, icon: Icon } = widget;
  return (
    <div {...dragProps} className={cn(widget.size === 2 && "md:col-span-2", dragging && "opacity-40")}>
      <Card
        className={cn(
          "h-full gap-4 transition-shadow",
          editing && "ring-primary/30 border-dashed ring-2 ring-offset-0",
        )}
      >
        <CardHeader className="flex flex-row items-center gap-2">
          {editing && <GripVertical className="text-muted-foreground size-4 cursor-grab" aria-hidden />}
          <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
            <Icon className="size-4" />
          </div>
          <CardTitle className="flex-1 text-[0.95rem]">{widget.title}</CardTitle>
          {editing && (
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon-sm" onClick={onMoveUp} disabled={isFirst} aria-label="Flytta upp">
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onMoveDown} disabled={isLast} aria-label="Flytta ned">
                <ArrowDown />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRemove}
                className="hover:text-destructive"
                aria-label={`Ta bort ${widget.title}`}
              >
                <X />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className={cn("flex-1", editing && "pointer-events-none opacity-70 select-none")}>
          <Component />
        </CardContent>
      </Card>
    </div>
  );
}
