"use client";

import { TriangleAlert } from "lucide-react";

import { useSession } from "@/lib/auth/session";

export function DemoBanner() {
  const { mode } = useSession();
  return (
    <div className="bg-warning/12 text-foreground border-warning/30 flex items-center justify-center gap-2 border-b px-4 py-1.5 text-center text-xs">
      <TriangleAlert className="text-warning size-3.5 shrink-0" />
      {mode === "demo" ? (
        <span>
          <strong className="font-semibold">Demoläge</strong> – all data är fiktiv.
          <span className="hidden sm:inline"> Använd inte plattformen för riktiga H2-uppgifter ännu.</span>
        </span>
      ) : (
        <span>
          <strong className="font-semibold">Exempeldata</strong> – projekt, kalender och notiser är ännu inte riktiga.
          <span className="hidden sm:inline"> Användare, roller och aktivitetslogg är riktiga.</span>
        </span>
      )}
    </div>
  );
}
