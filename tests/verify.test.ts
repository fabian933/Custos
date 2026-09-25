import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import agents from "../data/agents.json";
import { clearAudit, listAudit } from "../lib/audit";
import { runQuery, subjectHash, type Receipt } from "../lib/query";
import { generateKeyPair } from "../lib/signing";
import { translateWithKeywords, type Translation } from "../lib/translate";
import { verifyReceipt } from "../lib/verify";
import type { Agent } from "../lib/types";

const housing = (agents as Agent[]).find((a) => a.id === "housing-agent")!;
const rogue = (agents as Agent[]).find((a) => a.id === "rogue-agent")!;
const MARIAM = "784-1996-7654321-2";

const translate = async (question: string): Promise<Translation> =>
  translateWithKeywords(question);

async function issueReceipt(): Promise<Receipt> {
  const outcome = await runQuery(
    housing.apiKey,
    MARIAM,
    "Is this person eligible for a housing grant?",
    translate,
  );
  if (!outcome.ok) throw new Error(`expected an answer, got: ${outcome.reason}`);
  return outcome.response.receipt;
}

beforeAll(() => {
  process.env.CUSTOS_SIGNING_KEY = generateKeyPair().privateKeyBase64;
});

beforeEach(() => {
  clearAudit();
});

describe("verifyReceipt", () => {
  it("accepts an untouched receipt", async () => {
    expect(verifyReceipt(await issueReceipt())).toEqual({
      valid: true,
      reason: "signature matches the canonical receipt",
    });
  });

  it("rejects a receipt whose result was flipped from true to false", async () => {
    const receipt = await issueReceipt();
    expect(receipt.claims[0].result).toBe(true);
    const tampered = {
      ...receipt,
      claims: receipt.claims.map((claim, i) => (i === 0 ? { ...claim, result: false } : claim)),
    };
    expect(verifyReceipt(tampered)).toEqual({
      valid: false,
      reason: "signature does not match the canonical receipt",
    });
  });

  it("ignores key order when recomputing the canonical JSON", async () => {
    const receipt = await issueReceipt();
    const reordered = Object.fromEntries(Object.entries(receipt).reverse());
    expect(verifyReceipt(reordered).valid).toBe(true);
  });

  it("rejects malformed receipts", async () => {
    const receipt = await issueReceipt();
    const { signature, ...unsigned } = receipt;
    expect(signature).toBeTypeOf("string");
    expect(verifyReceipt(unsigned)).toMatchObject({ valid: false, reason: /no signature/ });
    expect(verifyReceipt({ ...receipt, subjectHash: undefined })).toMatchObject({
      valid: false,
      reason: /missing: subjectHash/,
    });
    expect(verifyReceipt("not a receipt")).toMatchObject({ valid: false });
  });
});

describe("audit log", () => {
  it("records answered and refused calls, newest first, without raw values", async () => {
    await runQuery(housing.apiKey, MARIAM, "Is this person a UAE national?", translate);
    await runQuery(housing.apiKey, MARIAM, "What is their exact salary?", translate);
    await runQuery(rogue.apiKey, MARIAM, "Is this person a UAE national?", translate);

    const entries = listAudit();
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.outcome)).toEqual(["refused", "refused", "answered"]);

    expect(entries[2]).toMatchObject({
      agentId: "housing-agent",
      subjectHash: subjectHash(MARIAM),
      question: "Is this person a UAE national?",
      outcome: "answered",
      predicates: [{ predicate: "is_uae_national", args: {} }],
      reason: null,
    });
    expect(Date.parse(entries[2].timestamp)).not.toBeNaN();

    expect(entries[0]).toMatchObject({
      agentId: "rogue-agent",
      outcome: "refused",
      predicates: [],
      reason: "unregistered agent",
    });
    expect(entries[1].outcome).toBe("refused");

    expect(JSON.stringify(entries)).not.toContain(MARIAM);
  });
});
