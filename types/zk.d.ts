declare module "snarkjs" {
  export interface Groth16Proof {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  }

  export const groth16: {
    fullProve(
      input: Record<string, string | string[]>,
      wasm: string | Uint8Array,
      zkey: string | Uint8Array,
    ): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;
    verify(
      verificationKey: Record<string, unknown>,
      publicSignals: string[],
      proof: Groth16Proof,
    ): Promise<boolean>;
  };
}

declare module "circomlibjs" {
  export interface PoseidonField {
    toObject(value: unknown): bigint;
  }
  export interface Poseidon {
    (inputs: bigint[]): unknown;
    F: PoseidonField;
  }
  export function buildPoseidon(): Promise<Poseidon>;
}
