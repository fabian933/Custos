import type { QueryClaim } from "./query";

export interface AuditEntry {
  timestamp: string;
  agentId: string | null;
  subjectHash: string | null;
  question: string;
  outcome: "answered" | "refused";
  predicates: { predicate: string; args: Record<string, unknown> }[];
  reason: string | null;
  zkProof?: boolean;
}

const MAX_ENTRIES = 500;

/**
 * In-memory only: the log is per-process and resets when the server restarts. It hangs off
 * globalThis because Next bundles each route handler separately, so a module-level array would
 * give /api/query and /api/audit two different logs.
 */
const globalStore = globalThis as typeof globalThis & { __custosAudit?: AuditEntry[] };
const entries: AuditEntry[] = (globalStore.__custosAudit ??= []);

export function recordAudit(entry: Omit<AuditEntry, "timestamp"> & { timestamp?: string }): void {
  entries.push({ timestamp: new Date().toISOString(), ...entry });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
}

/** Newest first. */
export function listAudit(): AuditEntry[] {
  return [...entries].reverse();
}

export function clearAudit(): void {
  entries.length = 0;
}

export function claimsToPredicates(claims: QueryClaim[]): AuditEntry["predicates"] {
  return claims.map(({ predicate, args }) => ({ predicate, args }));
}

export function claimsHaveZkProof(claims: QueryClaim[]): boolean {
  return claims.some((claim) => Boolean(claim.proof));
}
