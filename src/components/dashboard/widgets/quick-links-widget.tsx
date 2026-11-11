import Link from "next/link";
import { FolderKanban, Plug, User, Users } from "lucide-react";

const LINKS = [
  { href: "/projekt", label: "Alla projekt", icon: FolderKanban },
  { href: "/profil", label: "Min profil", icon: User },
  { href: "/administration/anvandare", label: "Användare", icon: Users },
  { href: "/administration/integrationer", label: "Integrationer", icon: Plug },
];

export function QuickLinksWidget() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="hover:bg-accent flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors"
        >
          <l.icon className="text-primary size-4" /> {l.label}
        </Link>
      ))}
    </div>
  );
}
