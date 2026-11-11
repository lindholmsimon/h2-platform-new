/**
 * FIKTIVA EXEMPELDATA – endast för demoläget.
 * Får aldrig blandas med riktiga uppgifter från H2 Entreprenad.
 *
 * Alla tider räknas relativt DEMO_NOW så att demot ser likadant ut oavsett
 * när det körs (och för att undvika hydreringsskillnader).
 */
export const DEMO_NOW = new Date("2026-11-11T09:30:00+01:00");

export function daysFromNow(days: number, hours = 0) {
  return new Date(DEMO_NOW.getTime() + days * 86400000 + hours * 3600000).toISOString();
}
