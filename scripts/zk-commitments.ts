/**
 * Adds a random salt and a Poseidon commitment for salary and date of birth to
 * every resident. The commitments are public; the values and salts stay server-side.
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildPoseidon } from "circomlibjs";
import { dobToDays } from "../lib/zk-inputs";

const file = path.join(process.cwd(), "data", "residents.json");

async function main() {
  const poseidon = await buildPoseidon();
  const residents = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>[];

  const commit = (value: number, salt: string): string =>
    poseidon.F.toObject(poseidon([BigInt(value), BigInt(salt)])).toString();

  for (const resident of residents) {
    const salarySalt = BigInt(`0x${randomBytes(16).toString("hex")}`).toString();
    const dobSalt = BigInt(`0x${randomBytes(16).toString("hex")}`).toString();

    resident.salarySalt = salarySalt;
    resident.salaryCommitment = commit(Number(resident.salaryAED), salarySalt);
    resident.dobSalt = dobSalt;
    resident.dobCommitment = commit(dobToDays(String(resident.dob)), dobSalt);
  }

  writeFileSync(file, `${JSON.stringify(residents, null, 2)}\n`);
  console.log(`Updated commitments for ${residents.length} residents.`);
}

main();
