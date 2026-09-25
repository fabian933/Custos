import { PREDICATES_REQUIRING_VALUE, evaluatePredicate } from "./predicates";
import { signPayload } from "./signing";
import { findAgentByApiKey, findResident } from "./store";
import type { FactQuery, PredicateName, SignedFact } from "./types";

export const ISSUER = "custos.gov.demo";

const KNOWN_PREDICATES: PredicateName[] = [
  "is_uae_national",
  "age_at_least",
  "salary_below",
  "visa_valid_until",
  "clearance_at_least",
  "insured_for",
];

export type GatewayResult =
  | { ok: true; fact: SignedFact }
  | { ok: false; status: number; error: string };

export function answerQuery(apiKey: string | null, query: Partial<FactQuery>): GatewayResult {
  if (!apiKey) return { ok: false, status: 401, error: "Missing x-api-key header" };

  const agent = findAgentByApiKey(apiKey);
  if (!agent) return { ok: false, status: 401, error: "Unknown API key" };
  if (!agent.registered) {
    return { ok: false, status: 403, error: `Agent ${agent.id} is not registered` };
  }

  const { emiratesId, predicate, value } = query;
  if (!emiratesId) return { ok: false, status: 400, error: "emiratesId is required" };
  if (!predicate || !KNOWN_PREDICATES.includes(predicate as PredicateName)) {
    return { ok: false, status: 400, error: `Unknown predicate: ${String(predicate)}` };
  }
  if (!agent.allowedPredicates.includes(predicate)) {
    return {
      ok: false,
      status: 403,
      error: `Agent ${agent.id} may not ask "${predicate}" for purpose "${agent.purpose}"`,
    };
  }
  if (PREDICATES_REQUIRING_VALUE.includes(predicate as PredicateName) && value === undefined) {
    return { ok: false, status: 400, error: `Predicate "${predicate}" requires a value` };
  }

  const resident = findResident(emiratesId);
  if (!resident) return { ok: false, status: 404, error: "No record for that Emirates ID" };

  const answer = evaluatePredicate(resident, predicate as PredicateName, value);
  const claim = {
    emiratesId: resident.emiratesId,
    predicate: predicate as PredicateName,
    value: value ?? null,
    answer,
    issuedAt: new Date().toISOString(),
    issuer: ISSUER,
    agentId: agent.id,
  };

  return {
    ok: true,
    fact: { ...claim, signature: signPayload(claim), algorithm: "Ed25519" },
  };
}
