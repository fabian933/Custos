import { getPublicKeyBase64, verifyPayload } from "./signing";
import { verifyClaimProof } from "./zk";
import { proofLabel } from "./proof-label";

export interface VerifyResult {
  valid: boolean;
  reason: string;
  proofTypes?: string[];
}

const REQUIRED_FIELDS = [
  "claims",
  "subjectHash",
  "agentId",
  "purpose",
  "timestamp",
  "nonce",
] as const;

/**
 * Re-derives the canonical JSON of the receipt minus `signature` and checks the Ed25519
 * signature against the gateway's public key.
 */
export function verifyReceipt(receipt: unknown): VerifyResult {
  if (typeof receipt !== "object" || receipt === null || Array.isArray(receipt)) {
    return { valid: false, reason: "receipt must be an object" };
  }

  const { signature, ...unsigned } = receipt as Record<string, unknown>;
  if (typeof signature !== "string" || signature === "") {
    return { valid: false, reason: "receipt has no signature" };
  }

  const missing = REQUIRED_FIELDS.filter((field) => unsigned[field] === undefined);
  if (missing.length > 0) {
    return { valid: false, reason: `receipt is missing: ${missing.join(", ")}` };
  }
  if (!Array.isArray(unsigned.claims)) {
    return { valid: false, reason: "receipt claims must be an array" };
  }

  let valid: boolean;
  try {
    valid = verifyPayload(unsigned, signature, getPublicKeyBase64());
  } catch (error) {
    return { valid: false, reason: (error as Error).message };
  }

  return valid
    ? { valid: true, reason: "signature matches the canonical receipt" }
    : { valid: false, reason: "signature does not match the canonical receipt" };
}

/**
 * Full check of an answer: the Ed25519 signature over the whole receipt, plus every
 * zero-knowledge proof carried by a salary or age claim.
 */
export async function verifyAnswer(receipt: unknown): Promise<VerifyResult> {
  const signature = verifyReceipt(receipt);
  if (!signature.valid) return signature;

  const claims = (receipt as { claims: { result: unknown; proof?: unknown }[] }).claims;
  const reasons = [signature.reason];

  for (const claim of claims) {
    if (!claim.proof) continue;
    const zk = await verifyClaimProof(claim);
    if (!zk.valid) return { valid: false, reason: zk.reason };
    reasons.push(zk.reason);
  }

  return {
    valid: true,
    reason: reasons.join("; "),
    proofTypes: [...new Set(claims.map((claim) => proofLabel(Boolean(claim.proof))))],
  };
}
