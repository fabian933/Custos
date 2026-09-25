import { getPublicKeyBase64, verifyPayload } from "./signing";

export interface VerifyResult {
  valid: boolean;
  reason: string;
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
