import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-primary text-sm font-semibold">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Sidan hittades inte</h1>
      <p className="text-muted-foreground max-w-sm text-sm">Länken kan vara felaktig eller så har sidan flyttats.</p>
      <Button asChild>
        <Link href="/">Till dashboard</Link>
      </Button>
    </div>
  );
}
