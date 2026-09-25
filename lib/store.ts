import agentsData from "../data/agents.json";
import residentsData from "../data/residents.json";
import type { Agent, Resident } from "./types";

const residents = residentsData as Resident[];
const agents = agentsData as Agent[];

/** Records never leave the ministry: only predicate evaluation reads them. */
export function findResident(emiratesId: string): Resident | undefined {
  return residents.find((r) => r.emiratesId === emiratesId.trim());
}

export function findAgentByApiKey(apiKey: string): Agent | undefined {
  return agents.find((a) => a.apiKey === apiKey.trim());
}

/** Public directory of agents — API keys are never exposed. */
export function listAgents(): Omit<Agent, "apiKey">[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return agents.map(({ apiKey, ...rest }) => rest);
}

/** Identifiers only, for the demo UI. Never exposes record fields. */
export function listResidentIds(): { emiratesId: string; fullName: string }[] {
  return residents.map(({ emiratesId, fullName }) => ({ emiratesId, fullName }));
}
