#!/usr/bin/env bash
# Compiles the range circuit and runs a local Groth16 setup.
# The powers of tau ceremony is generated locally: fine for a demo, not for production.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
build="$root/build/zk"
out="$root/zk"
snarkjs="npx snarkjs"

mkdir -p "$build" "$out"

circom "$root/circuits/range.circom" --r1cs --wasm -o "$build"

$snarkjs powersoftau new bn128 14 "$build/pot_0.ptau" -v
$snarkjs powersoftau contribute "$build/pot_0.ptau" "$build/pot_1.ptau" \
  --name="custos demo" -v -e="custos demo entropy"
$snarkjs powersoftau prepare phase2 "$build/pot_1.ptau" "$build/pot_final.ptau" -v

$snarkjs groth16 setup "$build/range.r1cs" "$build/pot_final.ptau" "$build/range_0.zkey"
$snarkjs zkey contribute "$build/range_0.zkey" "$build/range.zkey" \
  --name="custos demo" -v -e="custos demo entropy 2"
$snarkjs zkey export verificationkey "$build/range.zkey" "$out/verification_key.json"

cp "$build/range_js/range.wasm" "$out/range.wasm"
cp "$build/range.zkey" "$out/range.zkey"

echo "Artifacts written to $out"
