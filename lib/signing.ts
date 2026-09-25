import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify,
  type KeyObject,
} from "node:crypto";

const ENV_VAR = "CUSTOS_SIGNING_KEY";

export interface GeneratedKeyPair {
  privateKeyBase64: string;
  publicKeyBase64: string;
}

/** Generates an Ed25519 keypair as base64-encoded DER (PKCS#8 private, SPKI public). */
export function generateKeyPair(): GeneratedKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  return {
    privateKeyBase64: privateKey.export({ type: "pkcs8", format: "der" }).toString("base64"),
    publicKeyBase64: publicKey.export({ type: "spki", format: "der" }).toString("base64"),
  };
}

export function getPrivateKey(): KeyObject {
  const raw = process.env[ENV_VAR];
  if (!raw) {
    throw new Error(
      `${ENV_VAR} is not set. Run "npm run genkey" and put the printed value in .env.local.`,
    );
  }
  return createPrivateKey({
    key: Buffer.from(raw.trim(), "base64"),
    format: "der",
    type: "pkcs8",
  });
}

export function getPublicKeyBase64(): string {
  return createPublicKey(getPrivateKey()).export({ type: "spki", format: "der" }).toString("base64");
}

export function getPublicKeyPem(): string {
  return createPublicKey(getPrivateKey()).export({ type: "spki", format: "pem" }).toString();
}

/** Canonical JSON: object keys sorted recursively, so signatures are reproducible. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`);
  return `{${entries.join(",")}}`;
}

export function signPayload(payload: unknown, privateKey: KeyObject = getPrivateKey()): string {
  return nodeSign(null, Buffer.from(canonicalize(payload), "utf8"), privateKey).toString("base64");
}

export function verifyPayload(
  payload: unknown,
  signatureBase64: string,
  publicKeyBase64: string,
): boolean {
  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyBase64, "base64"),
    format: "der",
    type: "spki",
  });
  return nodeVerify(
    null,
    Buffer.from(canonicalize(payload), "utf8"),
    publicKey,
    Buffer.from(signatureBase64, "base64"),
  );
}
