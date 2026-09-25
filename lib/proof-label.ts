export const ZK_LABEL = "Zero-knowledge proof (Groth16)";
export const SIGNATURE_LABEL = "Digital signature";

export function proofLabel(hasZkProof: boolean): string {
  return hasZkProof ? ZK_LABEL : SIGNATURE_LABEL;
}
