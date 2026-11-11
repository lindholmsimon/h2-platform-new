import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

const TONES = [
  "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  "bg-stone-500/15 text-stone-700 dark:text-stone-300",
  "bg-teal-500/15 text-teal-800 dark:text-teal-300",
  "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  "bg-rose-500/15 text-rose-800 dark:text-rose-300",
];

function tone(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback className={cn("font-semibold", tone(name))}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
