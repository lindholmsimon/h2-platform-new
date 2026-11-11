import type { IntegrationDefinition } from "../types";

export const dropbox: IntegrationDefinition = {
  id: "dropbox",
  name: "Dropbox",
  vendor: "Dropbox",
  description: "Projektfiler, ritningar och foton synkade från företagets Dropbox.",
  capabilities: ["Bläddra projektmappar", "Förhandsgranska filer", "Ladda upp foton från fält"],
  plannedScopes: ["files.metadata.read", "files.content.read", "files.content.write"],
  status: "not_connected",
};

/** Planerat gränssnitt – implementeras server-side med Dropbox API. */
export interface DropboxClient {
  listFolder(path: string): Promise<unknown[]>;
  getTemporaryLink(path: string): Promise<string>;
}
