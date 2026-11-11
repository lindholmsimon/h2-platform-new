import { claude } from "./claude";
import { dropbox } from "./dropbox";
import { microsoft365 } from "./microsoft365";

export const INTEGRATIONS = [microsoft365, dropbox, claude];

export type { IntegrationDefinition, IntegrationStatus } from "./types";
