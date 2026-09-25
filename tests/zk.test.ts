import { beforeAll, describe, expect, it } from "vitest";
import agents from "../data/agents.json";
import residents from "../data/residents.json";
import { runQuery } from "../lib/query";
import { generateKeyPair } from "../lib/signing";
import { translateWithKeywords, type Translation } from "../lib/translate";
import { verifyAnswer } from "../lib/verify";
import { proveClaim, rangeWitnessFor, verifyClaimProof, verifyRangeProof } from "../lib/zk";
import type { Agent, Resident } from "../lib/types";

const housing = (agents as Agent[]).find((a) => a.id === "housing-agent")!;
const khalid = (residents as Resident[])[0];
const rajesh = (residents as Resident[])[2];

const translate = async (question: string): Promise<Translation> =>
  translateWithKeywords(question);

beforeAll(() => {
  process.env.CUSTOS_SIGNING_KEY = generateKeyPair().privateKeyBase64;
});

describe("range circuit", () => {
  it("proves and verifies salary below a threshold", async () => {
    const witness = rangeWitnessFor(khalid, "salary_below", 30000, true)!;
    const proof = await proveClaim(witness);

    expect(proof.proofType).toBe("zk-groth16");
    expect(JSON.stringify(proof)).not.toContain(String(khalid.salaryAED));
    expect(await verifyRangeProof(proof)).toBe(true);
  });

  it("proves the other direction when the answer is no", async () => {
    const witness = rangeWitnessFor(rajesh, "salary_below", 30000, false)!;
    expect(witness.mode).toBe(1);
    expect(await verifyRangeProof(await proveClaim(witness))).toBe(true);
  });

  it("proves age without revealing the date of birth", async () => {
    const witness = rangeWitnessFor(khalid, "age_at_least", 21, true)!;
    const proof = await proveClaim(witness);

    expect(await verifyRangeProof(proof)).toBe(true);
    expect(JSON.stringify(proof)).not.toContain(khalid.dob);
  });

  it("fails when the threshold is changed", async () => {
    const proof = await proveClaim(rangeWitnessFor(khalid, "salary_below", 30000, true)!);
    const publicSignals = [...proof.publicSignals];
    publicSignals[1] = "10000";

    expect(await verifyRangeProof({ proof: proof.proof, publicSignals })).toBe(false);
  });

  it("fails when the commitment is changed", async () => {
    const proof = await proveClaim(rangeWitnessFor(khalid, "salary_below", 30000, true)!);
    const publicSignals = [...proof.publicSignals];
    publicSignals[0] = (BigInt(publicSignals[0]) + 1n).toString();

    expect(await verifyRangeProof({ proof: proof.proof, publicSignals })).toBe(false);
  });

  it("rejects a proof whose public signals disagree with the stated commitment", async () => {
    const proof = await proveClaim(rangeWitnessFor(khalid, "salary_below", 30000, true)!);
    const claim = {
      result: true,
      proof: { ...proof, publicInputs: { ...proof.publicInputs, threshold: 10000 } },
    };

    expect(await verifyClaimProof(claim)).toMatchObject({ valid: false });
  });
});

describe("/api/query proofs", () => {
  it("attaches a zk proof to salary and age claims and verifies end to end", async () => {
    const outcome = await runQuery(
      housing.apiKey,
      khalid.emiratesId,
      "Is this person eligible for a housing grant?",
      translate,
    );
    if (!outcome.ok) throw new Error(outcome.reason);

    const salary = outcome.response.results.find((c) => c.predicate === "salary_below")!;
    const national = outcome.response.results.find((c) => c.predicate === "is_uae_national")!;
    expect(salary.proof?.proofType).toBe("zk-groth16");
    expect(national.proof).toBeUndefined();

    const serialised = JSON.stringify(outcome.response);
    expect(serialised).not.toContain(String(khalid.salaryAED));
    expect(serialised).not.toContain(khalid.salarySalt);

    await expect(verifyAnswer(outcome.response.receipt)).resolves.toMatchObject({ valid: true });
  });

  it("rejects an answer whose proof was swapped for another threshold", async () => {
    const outcome = await runQuery(
      housing.apiKey,
      khalid.emiratesId,
      "Is this person eligible for a housing grant?",
      translate,
    );
    if (!outcome.ok) throw new Error(outcome.reason);

    const receipt = outcome.response.receipt;
    const claims = receipt.claims.map((claim) =>
      claim.proof
        ? { ...claim, proof: { ...claim.proof, publicSignals: ["1", "2", "0"] } }
        : claim,
    );

    await expect(verifyAnswer({ ...receipt, claims })).resolves.toMatchObject({ valid: false });
  });
});
