import Image from "next/image";

import logoDark from "@/assets/brand/logo-dark.png";
import logoLight from "@/assets/brand/logo-light.png";
import mark from "@/assets/brand/mark.png";
import { cn } from "@/lib/utils";

const ALT = "Hanssons Hus AB Entreprenad";

const SIZES = {
  sm: "h-8",
  md: "h-11",
  lg: "h-16",
} as const;

/**
 * Företagets logotyp.
 *
 * - Hel logotyp: separata varianter för ljust och mörkt tema (svart resp. vit
 *   text), växlas med CSS så att rätt variant visas direkt utan flimmer.
 * - `collapsed`: endast märket (hopfälld sidomeny, mobilens toppfält).
 */
export function Brand({
  collapsed = false,
  size = "md",
  priority = false,
  className,
}: {
  collapsed?: boolean;
  size?: keyof typeof SIZES;
  priority?: boolean;
  className?: string;
}) {
  const height = SIZES[size];

  if (collapsed) {
    return (
      <span className={cn("flex shrink-0 items-center", className)}>
        <Image src={mark} alt={ALT} priority={priority} className={cn(height, "w-auto")} />
      </span>
    );
  }

  return (
    <span className={cn("flex shrink-0 items-center", className)}>
      <Image src={logoLight} alt={ALT} priority={priority} className={cn(height, "w-auto dark:hidden")} />
      <Image src={logoDark} alt={ALT} priority={priority} className={cn(height, "hidden w-auto dark:block")} />
    </span>
  );
}
