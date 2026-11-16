import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/server/auth/actions";

export function SignOutButton({ variant = "outline" }: { variant?: "outline" | "ghost" }) {
  return (
    <form action={signOut} className="w-full">
      <Button type="submit" variant={variant} className="w-full">
        <LogOut /> Logga ut
      </Button>
    </form>
  );
}
