/**
 * Gemensamma typer för framtida integrationer.
 *
 * Varje integration ligger i en egen mapp (microsoft365/, dropbox/, claude/)
 * och exporterar en `definition` som UI:t visar. Själva klienterna
 * implementeras server-side (Route Handlers / Server Actions) i en senare fas
 * – inga hemligheter eller API-nycklar ska någonsin hamna i klientkoden.
 */

export type IntegrationStatus = "not_connected" | "connected" | "error";

export interface IntegrationDefinition {
  id: "microsoft365" | "dropbox" | "claude";
  name: string;
  vendor: string;
  description: string;
  capabilities: string[];
  /** Behörigheter/scopes som kommer att begäras vid anslutning. */
  plannedScopes: string[];
  status: IntegrationStatus;
}
