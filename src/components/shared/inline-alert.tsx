import { CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const VARIANTS: Record<"error" | "success" | "info" | "warning", { icon: LucideIcon; className: string; iconClass: string }> = {
  error: { icon: CircleAlert, className: "bg-destructive/8 border-destructive/25", iconClass: "text-destructive" },
  success: { icon: CircleCheck, className: "bg-success/10 border-success/25", iconClass: "text-success" },
  info: { icon: Info, className: "bg-info/10 border-info/20", iconClass: "text-info" },
  warning: { icon: CircleAlert, className: "bg-warning/12 border-warning/30", iconClass: "text-warning" },
};

export function InlineAlert({
  variant = "info",
  children,
  className,
}: {
  variant?: keyof typeof VARIANTS;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: tone, iconClass } = VARIANTS[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("text-foreground flex items-start gap-3 rounded-xl border p-3.5 text-sm", tone, className)}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconClass)} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
