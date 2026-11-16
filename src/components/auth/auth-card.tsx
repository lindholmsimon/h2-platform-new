import type { LucideIcon } from "lucide-react";

import { Brand } from "@/components/layout/brand";

/** Gemensam layout för inloggning och åtkomstmeddelanden (samma stil som SecureModeGate). */
export function AuthCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <Brand size="lg" priority />
      <div className="bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center shadow-xs">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          <Icon className="size-5" />
        </div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}
