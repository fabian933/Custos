import { beforeAll, describe, expect, it } from "vitest";
import agents from "../data/agents.json";
import { ISSUER, answerQuery } from "../lib/gateway";
import { canonicalize, generateKeyPair, verifyPayload } from "../lib/signing";
import type { Agent } from "../lib/types";

const housing = (agents as Agent[]).find((a) => a.id === "housing-agent")!;
const bank = (agents as Agent[]).find((a) => a.id === "bank-kyc-agent")!;
const rogue = (agents as Agent[]).find((a) => a.id === "rogue-agent")!;

const KHALID = "784-1987-1234567-1"; // UAE national
const RAJESH = "784-1979-2468101-3"; // expat, visa until 2027-08-15

let publicKeyBase64: string;

beforeAll(() => {
  const keys = generateKeyPair();
  process.env.CUSTOS_SIGNING_KEY = keys.privateKeyBase64;
  publicKeyBase64 = keys.publicKeyBase64;
});

describe("answerQuery", () => {
  it("returns a verifiable signed fact for an allowed predicate", () => {
    const result = answerQuery(housing.apiKey, {
      emiratesId: KHALID,
      predicate: "is_uae_national",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { signature, algorithm, ...claim } = result.fact;
    expect(claim.answer).toBe(true);
    expect(claim.issuer).toBe(ISSUER);
    expect(claim.agentId).toBe("housing-agent");
    expect(algorithm).toBe("Ed25519");
    expect(verifyPayload(claim, signature, publicKeyBase64)).toBe(true);
  });

  it("rejects a tampered claim", () => {
    const result = answerQuery(housing.apiKey, {
      emiratesId: KHALID,
      predicate: "salary_below",
      value: 10000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { signature, algorithm: _algorithm, ...claim } = result.fact;
    expect(claim.answer).toBe(false);
    expect(verifyPayload({ ...claim, answer: true }, signature, publicKeyBase64)).toBe(false);
  });

  it("never includes record fields beyond the answered claim", () => {
    const result = answerQuery(bank.apiKey, {
      emiratesId: RAJESH,
      predicate: "visa_valid_until",
      value: "2027-01-01",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.fact).sort()).toEqual([
      "agentId",
      "algorithm",
      "answer",
      "emiratesId",
      "issuedAt",
      "issuer",
      "predicate",
      "signature",
      "value",
    ]);
  });

  it("refuses a predicate outside the agent's purpose", () => {
    const result = answerQuery(bank.apiKey, { emiratesId: KHALID, predicate: "is_uae_national" });
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it("refuses an unregistered agent", () => {
    const result = answerQuery(rogue.apiKey, { emiratesId: KHALID, predicate: "age_at_least" });
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it("refuses an unknown or missing api key", () => {
    expect(answerQuery("nope", { emiratesId: KHALID, predicate: "age_at_least" })).toMatchObject({
      ok: false,
      status: 401,
    });
    expect(answerQuery(null, { emiratesId: KHALID, predicate: "age_at_least" })).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("requires a value for parameterised predicates", () => {
    expect(answerQuery(housing.apiKey, { emiratesId: KHALID, predicate: "age_at_least" })).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("returns 404 for an unknown resident", () => {
    const result = answerQuery(housing.apiKey, {
      emiratesId: "784-0000-0000000-0",
      predicate: "is_uae_national",
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});

describe("canonicalize", () => {
  it("is independent of key order", () => {
    expect(canonicalize({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe(
      canonicalize({ a: [2, { c: 4, d: 3 }], b: 1 }),
    );
  });
});
