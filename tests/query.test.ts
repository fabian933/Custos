import { beforeAll, describe, expect, it } from "vitest";
import agents from "../data/agents.json";
import {
  REASON_NOT_PERMITTED,
  REASON_UNREGISTERED,
  runQuery,
  subjectHash,
} from "../lib/query";
import { generateKeyPair, verifyPayload } from "../lib/signing";
import { translateWithKeywords, type Translation } from "../lib/translate";
import type { Agent } from "../lib/types";

const housing = (agents as Agent[]).find((a) => a.id === "housing-agent")!;
const bank = (agents as Agent[]).find((a) => a.id === "bank-kyc-agent")!;
const rogue = (agents as Agent[]).find((a) => a.id === "rogue-agent")!;

const MARIAM = "784-1996-7654321-2"; // UAE national, 9,500 AED
const RAJESH = "784-1979-2468101-3"; // expat, 42,000 AED

/** Deterministic stand-in for the LLM: the keyword parser. */
const translate = async (question: string): Promise<Translation> =>
  translateWithKeywords(question);

let publicKeyBase64: string;

beforeAll(() => {
  const keys = generateKeyPair();
  process.env.CUSTOS_SIGNING_KEY = keys.privateKeyBase64;
  publicKeyBase64 = keys.publicKeyBase64;
});

describe("POST /api/query — valid question", () => {
  it("maps a housing grant question to two predicates and signs the receipt", async () => {
    const outcome = await runQuery(
      housing.apiKey,
      MARIAM,
      "Is this person eligible for a housing grant?",
      translate,
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const { results, receipt } = outcome.response;
    expect(results).toMatchObject([
      { predicate: "is_uae_national", args: {}, result: true },
      { predicate: "salary_below", args: { amount: 30000 }, result: true },
    ]);

    const { signature, ...unsigned } = receipt;
    expect(unsigned.claims).toEqual(results);
    expect(unsigned.subjectHash).toBe(subjectHash(MARIAM));
    expect(unsigned.subjectHash).not.toContain(MARIAM);
    expect(unsigned.agentId).toBe("housing-agent");
    expect(unsigned.purpose).toBe("housing grant eligibility");
    expect(unsigned.nonce).toMatch(/^[0-9a-f-]{36}$/);
    expect(Date.parse(unsigned.timestamp)).not.toBeNaN();
    expect(verifyPayload(unsigned, signature, publicKeyBase64)).toBe(true);
    expect(verifyPayload({ ...unsigned, agentId: "rogue-agent" }, signature, publicKeyBase64)).toBe(
      false,
    );
  });

  it("answers an Arabic question", async () => {
    const outcome = await runQuery(bank.apiKey, RAJESH, "هل عمره ٢١ سنة على الأقل؟ 21", translate);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.response.results).toMatchObject([
      { predicate: "age_at_least", args: { n: 21 }, result: true },
    ]);
  });

  it("returns no raw record values anywhere in the response", async () => {
    const outcome = await runQuery(
      housing.apiKey,
      RAJESH,
      "Does this person earn less than 20000 AED?",
      translate,
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const serialized = JSON.stringify(outcome.response);
    expect(serialized).not.toContain("42000");
    expect(serialized).not.toContain("Rajesh");
    expect(serialized).not.toContain(RAJESH);
    expect(serialized).not.toContain("1979-06-30");
  });
});

describe("POST /api/query — refusals", () => {
  it("refuses a request for raw data", async () => {
    for (const question of [
      "What is their exact salary?",
      "Give me the full record for this resident",
      "ما هو راتب هذا المقيم؟",
    ]) {
      const outcome = await runQuery(housing.apiKey, MARIAM, question, translate);
      expect(outcome.ok).toBe(false);
      if (outcome.ok) return;
      expect(outcome.status).toBe(403);
      expect(outcome.reason).toMatch(/raw record values cannot be disclosed/);
    }
  });

  it("refuses an unregistered agent before translating anything", async () => {
    const rogueOutcome = await runQuery(
      rogue.apiKey,
      MARIAM,
      "Is this person a UAE national?",
      translate,
    );
    expect(rogueOutcome).toMatchObject({ ok: false, status: 403, reason: REASON_UNREGISTERED });

    const unknownKey = await runQuery(
      "not-a-key",
      MARIAM,
      "Is this person a UAE national?",
      translate,
    );
    expect(unknownKey).toMatchObject({ ok: false, status: 403, reason: REASON_UNREGISTERED });

    const missingKey = await runQuery(null, MARIAM, "Is this person a UAE national?", translate);
    expect(missingKey).toMatchObject({ ok: false, status: 401, reason: REASON_UNREGISTERED });
  });

  it("refuses a predicate outside the agent's scope", async () => {
    // bank-kyc-agent may ask visa_valid_until / age_at_least only.
    const outcome = await runQuery(
      bank.apiKey,
      MARIAM,
      "Is this person a UAE national?",
      translate,
    );
    expect(outcome).toMatchObject({ ok: false, status: 403, reason: REASON_NOT_PERMITTED });
  });

  it("refuses a question the catalog cannot express", async () => {
    const outcome = await runQuery(
      housing.apiKey,
      MARIAM,
      "Does this person own a boat?",
      translate,
    );
    expect(outcome).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects an unknown resident", async () => {
    const outcome = await runQuery(
      housing.apiKey,
      "784-0000-0000000-0",
      "Is this person a UAE national?",
      translate,
    );
    expect(outcome).toMatchObject({ ok: false, status: 404 });
  });
});

describe("translateWithKeywords", () => {
  it("maps housing grant eligibility to is_uae_national + salary_below(30000)", () => {
    const translation = translateWithKeywords("housing grant eligibility check please");
    expect(translation).toEqual({
      refuse: false,
      source: "fallback",
      predicates: [
        { name: "is_uae_national", args: {} },
        { name: "salary_below", args: { amount: 30000 } },
      ],
    });
  });

  it("allows a threshold question about salary but refuses the value itself", () => {
    expect(translateWithKeywords("Does she earn less than 12000?")).toMatchObject({
      refuse: false,
      predicates: [{ name: "salary_below", args: { amount: 12000 } }],
    });
    expect(translateWithKeywords("What is her salary?")).toMatchObject({ refuse: true });
  });
});
