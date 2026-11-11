import type { IntegrationDefinition } from "../types";

export const microsoft365: IntegrationDefinition = {
  id: "microsoft365",
  name: "Microsoft 365",
  vendor: "Microsoft",
  description: "Inloggning via Entra ID, kalender, e-post, Teams och SharePoint.",
  capabilities: ["Single sign-on (Entra ID)", "Outlook-kalender", "Teams-notiser", "SharePoint-dokument"],
  plannedScopes: ["openid", "profile", "User.Read", "Calendars.Read", "Files.Read.All"],
  status: "not_connected",
};

/** Planerat gränssnitt – implementeras server-side via Microsoft Graph. */
export interface Microsoft365Client {
  getMyEvents(range: { from: string; to: string }): Promise<unknown[]>;
  getMyProfile(): Promise<unknown>;
}
