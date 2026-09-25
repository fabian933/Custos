import { generateKeyPair } from "../lib/signing";

const { privateKeyBase64, publicKeyBase64 } = generateKeyPair();

console.log("Ed25519 keypair generated.\n");
console.log("Add this line to .env.local (keep it secret):\n");
console.log(`CUSTOS_SIGNING_KEY=${privateKeyBase64}\n`);
console.log("Corresponding public key (served at GET /api/public-key):\n");
console.log(publicKeyBase64);
