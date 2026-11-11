import { cn } from "@/lib/utils";

export function Brand({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tracking-tight">
        H2
      </div>
      {!collapsed && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">H2 Entreprenad</span>
          <span className="text-muted-foreground truncate text-xs">Intern plattform</span>
        </div>
      )}
    </div>
  );
}
