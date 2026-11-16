/**
 * Skydd mot öppen omdirigering: returnerar en säker intern sökväg, annars "/".
 * Används för ?next= efter inloggning. Filen får inte importera andra moduler
 * (testas direkt med node --test).
 */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const path = value.trim();
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("://") ||
    /[\u0000-\u001f\u007f]/.test(path) ||
    path.length > 512
  ) {
    return "/";
  }
  if (path === "/logga-in" || path.startsWith("/logga-in?") || path.startsWith("/auth/")) return "/";
  return path;
}
