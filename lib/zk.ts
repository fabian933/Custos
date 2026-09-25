import { readFile } from "node:fs/promises";
import path from "node:path";
import * as snarkjs from "snarkjs";
import { ageThresholdDays, dobToDays } from "./zk-inputs";
import type { PredicateName, Resident } from "./types";

export interface ZkProof {
  proofType: "zk-groth16";
  circuit: "range";
  proof: Record<string, unknown>;
  publicSignals: string[];
}

export interface RangeWitness {
  /** The private value being proven about; never leaves the server. */
  value: number;
  /** The private salt behind the public Poseidon commitment. */
  salt: string;
  commitment: string;
  threshold: number;
  /** 0 proves value < threshold, 1 proves value >= threshold. */
  mode: 0 | 1;
}

/** Committed under zk/ and traced into the serverless bundle by next.config.mjs. */
function artifact(name: string): string {
  return path.join(process.cwd(), "zk", name);
}

let wasm: Uint8Array | null = null;
let zkey: Uint8Array | null = null;
let verificationKey: Record<string, unknown> | null = null;

async function loadArtifacts() {
  wasm ??= new Uint8Array(await readFile(artifact("range.wasm")));
  zkey ??= new Uint8Array(await readFile(artifact("range.zkey")));
  return { wasm, zkey };
}

export async function loadVerificationKey(): Promise<Record<string, unknown>> {
  verificationKey ??= JSON.parse(await readFile(artifact("verification_key.json"), "utf8"));
  return verificationKey!;
}

export async function proveRange(witness: RangeWitness): Promise<ZkProof> {
  const { wasm: wasmBytes, zkey: zkeyBytes } = await loadArtifacts();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
      value: witness.value.toString(),
      salt: witness.salt,
      commitment: witness.commitment,
      threshold: witness.threshold.toString(),
      mode: witness.mode.toString(),
    },
    wasmBytes,
    zkeyBytes,
  );

  return {
    proofType: "zk-groth16",
    circuit: "range",
    proof: proof as unknown as Record<string, unknown>,
    publicSignals: publicSignals as string[],
  };
}

export async function verifyRangeProof(zk: {
  proof: unknown;
  publicSignals: unknown;
}): Promise<boolean> {
  if (!zk.proof || !Array.isArray(zk.publicSignals)) return false;
  const key = await loadVerificationKey();
  try {
    return await snarkjs.groth16.verify(
      key,
      zk.publicSignals as string[],
      zk.proof as Parameters<typeof snarkjs.groth16.verify>[2],
    );
  } catch {
    return false;
  }
}

export interface ClaimProof extends ZkProof {
  publicInputs: { commitment: string; threshold: number; mode: 0 | 1 };
}

export const ZK_PREDICATES: PredicateName[] = ["salary_below", "age_at_least"];

/**
 * Both checks are range comparisons against a committed value: salary directly, age as the
 * number of days since the epoch for the date of birth. A false result is proven the other
 * way round (mode 1), so refusals to answer "yes" are backed by a proof too.
 */
export function rangeWitnessFor(
  resident: Resident,
  predicate: PredicateName,
  arg: number,
  result: boolean,
  now: Date = new Date(),
): RangeWitness | null {
  if (predicate === "salary_below") {
    return {
      value: resident.salaryAED,
      salt: resident.salarySalt,
      commitment: resident.salaryCommitment,
      threshold: arg,
      mode: result ? 0 : 1,
    };
  }
  if (predicate === "age_at_least") {
    return {
      value: dobToDays(resident.dob),
      salt: resident.dobSalt,
      commitment: resident.dobCommitment,
      threshold: ageThresholdDays(arg, now),
      mode: result ? 0 : 1,
    };
  }
  return null;
}

export async function proveClaim(witness: RangeWitness): Promise<ClaimProof> {
  const proof = await proveRange(witness);
  return {
    ...proof,
    publicInputs: {
      commitment: witness.commitment,
      threshold: witness.threshold,
      mode: witness.mode,
    },
  };
}

/**
 * A proof only means something if its public signals are the ones the claim states, so the
 * commitment, threshold and direction are re-checked against the receipt before verifying.
 */
export async function verifyClaimProof(
  claim: { result: unknown; proof?: unknown },
): Promise<{ valid: boolean; reason: string }> {
  const proof = claim.proof as Partial<ClaimProof> | undefined;
  if (!proof || proof.proofType !== "zk-groth16") {
    return { valid: false, reason: "claim has no zero-knowledge proof" };
  }
  const inputs = proof.publicInputs;
  const signals = proof.publicSignals;
  if (!inputs || !Array.isArray(signals) || signals.length < 3) {
    return { valid: false, reason: "proof is missing its public inputs" };
  }

  const expectedMode = claim.result === true ? 0 : 1;
  if (inputs.mode !== expectedMode) {
    return { valid: false, reason: "proof direction does not match the claimed result" };
  }

  const matches =
    BigInt(signals[0]) === BigInt(inputs.commitment) &&
    BigInt(signals[1]) === BigInt(inputs.threshold) &&
    BigInt(signals[2]) === BigInt(inputs.mode);
  if (!matches) {
    return { valid: false, reason: "public signals do not match the stated commitment" };
  }

  const valid = await verifyRangeProof({ proof: proof.proof, publicSignals: signals });
  return valid
    ? { valid: true, reason: "zero-knowledge proof verifies" }
    : { valid: false, reason: "zero-knowledge proof does not verify" };
}
