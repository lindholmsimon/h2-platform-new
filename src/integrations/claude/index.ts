import type { IntegrationDefinition } from "../types";

export const claude: IntegrationDefinition = {
  id: "claude",
  name: "Claude",
  vendor: "Anthropic",
  description: "AI-assistent och AI-agenter för projektanalys, sammanfattningar och frågor om underlag.",
  capabilities: ["AI-assistent på dashboard", "AI-analys av projekt", "Sammanfatta dokument", "Agenter för återkommande uppgifter"],
  plannedScopes: ["API-nyckel lagras server-side"],
  status: "not_connected",
};

/** Planerat gränssnitt – anrop sker endast server-side. */
export interface AiAssistantClient {
  ask(prompt: string, context?: { projectId?: string }): Promise<string>;
}
