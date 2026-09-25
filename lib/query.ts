import { createHash, randomUUID } from "node:crypto";
import { argValue, catalogSpec } from "./catalog";
import { evaluatePredicate } from "./predicates";
import { signPayload } from "./signing";
import { findAgentByApiKey, findResident } from "./store";
import { translateQuestion, type Translation } from "./translate";
import { ISSUER } from "./gateway";
import type { PredicateName } from "./types";

export interface QueryClaim {
  predicate: PredicateName;
  args: Record<string, unknown>;
  result: boolean;
}

export interface Receipt {
  claims: QueryClaim[];
  subjectHash: string;
  agentId: string;
  purpose: string;
  timestamp: string;
  nonce: string;
  issuer: string;
  signature: string;
}

export interface QueryResponse {
  results: QueryClaim[];
  receipt: Receipt;
  translatedBy: "llm" | "fallback";
}

export type QueryOutcome =
  | { ok: true; response: QueryResponse }
  | { ok: false; status: number; reason: string };

export const REASON_UNREGISTERED = "unregistered agent";
export const REASON_NOT_PERMITTED = "predicate not permitted for this agent's purpose";

export function subjectHash(emiratesId: string): string {
  return createHash("sha256").update(emiratesId.trim()).digest("hex");
}

export async function runQuery(
  apiKey: unknown,
  emiratesId: unknown,
  question: unknown,
  translate: (q: string) => Promise<Translation> = translateQuestion,
): Promise<QueryOutcome> {
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    return { ok: false, status: 401, reason: REASON_UNREGISTERED };
  }
  const agent = findAgentByApiKey(apiKey);
  if (!agent || !agent.registered) {
    return { ok: false, status: 403, reason: REASON_UNREGISTERED };
  }

  if (typeof emiratesId !== "string" || emiratesId.trim() === "") {
    return { ok: false, status: 400, reason: "emiratesId is required" };
  }
  if (typeof question !== "string" || question.trim() === "") {
    return { ok: false, status: 400, reason: "question is required" };
  }

  const translation = await translate(question);
  if (translation.refuse) {
    return { ok: false, status: 403, reason: translation.reason };
  }

  const resident = findResident(emiratesId);
  if (!resident) return { ok: false, status: 404, reason: "no record for that Emirates ID" };

  const claims: QueryClaim[] = [];
  for (const request of translation.predicates) {
    const spec = catalogSpec(request.name);
    if (!spec) return { ok: false, status: 400, reason: `unknown predicate: ${request.name}` };
    if (!agent.allowedPredicates.includes(spec.name)) {
      return { ok: false, status: 403, reason: REASON_NOT_PERMITTED };
    }

    const value = argValue(spec, request.args);
    if (spec.args.length > 0 && (value === undefined || value === "" || Number.isNaN(value))) {
      return { ok: false, status: 400, reason: `predicate ${spec.name} is missing its argument` };
    }

    claims.push({
      predicate: spec.name,
      args: spec.args.length === 0 ? {} : { [spec.args[0].name]: value },
      result: evaluatePredicate(resident, spec.name, value),
    });
  }

  const unsigned = {
    claims,
    subjectHash: subjectHash(resident.emiratesId),
    agentId: agent.id,
    purpose: agent.purpose,
    timestamp: new Date().toISOString(),
    nonce: randomUUID(),
    issuer: ISSUER,
  };

  return {
    ok: true,
    response: {
      results: claims,
      receipt: { ...unsigned, signature: signPayload(unsigned) },
      translatedBy: translation.source,
    },
  };
}
