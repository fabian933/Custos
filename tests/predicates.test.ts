import { describe, expect, it } from "vitest";
import residents from "../data/residents.json";
import {
  age_at_least,
  clearance_at_least,
  evaluatePredicate,
  insured_for,
  is_uae_national,
  salary_below,
  visa_valid_until,
} from "../lib/predicates";
import type { Resident } from "../lib/types";

const byId = (emiratesId: string): Resident =>
  (residents as Resident[]).find((r) => r.emiratesId === emiratesId)!;

const khalid = byId("784-1987-1234567-1"); // UAE national, 18k, clearance 2
const mariam = byId("784-1996-7654321-2"); // UAE national, 9.5k, clearance 0
const rajesh = byId("784-1979-2468101-3"); // India, 42k, visa 2027-08-15, clearance 3
const sophia = byId("784-2001-1357913-4"); // UK, 7.2k, visa 2026-02-28, clearance 1
const ahmed = byId("784-1965-9876543-5"); // Egypt, 15.5k, visa 2025-12-01, clearance 0

describe("is_uae_national", () => {
  it("is true for nationals", () => {
    expect(is_uae_national(khalid)).toBe(true);
    expect(is_uae_national(mariam)).toBe(true);
  });

  it("is false for expats", () => {
    expect(is_uae_national(rajesh)).toBe(false);
    expect(is_uae_national(sophia)).toBe(false);
    expect(is_uae_national(ahmed)).toBe(false);
  });

  it("ignores case and whitespace", () => {
    expect(is_uae_national({ ...rajesh, nationality: " uae " })).toBe(true);
  });
});

describe("age_at_least", () => {
  const now = new Date("2025-06-01T00:00:00Z");

  it("compares full years at the reference date", () => {
    expect(age_at_least(khalid, 38, now)).toBe(true); // born 1987-03-14 -> 38
    expect(age_at_least(khalid, 39, now)).toBe(false);
    expect(age_at_least(sophia, 24, now)).toBe(true); // born 2001-01-21 -> 24
    expect(age_at_least(sophia, 25, now)).toBe(false);
  });

  it("does not count a birthday that has not happened yet", () => {
    expect(age_at_least(mariam, 29, new Date("2025-11-01T00:00:00Z"))).toBe(false);
    expect(age_at_least(mariam, 29, new Date("2025-11-02T00:00:00Z"))).toBe(true);
  });

  it("is false for an unparseable date of birth", () => {
    expect(age_at_least({ ...khalid, dob: "not-a-date" }, 1, now)).toBe(false);
  });
});

describe("salary_below", () => {
  it("is a strict comparison", () => {
    expect(salary_below(mariam, 10000)).toBe(true);
    expect(salary_below(rajesh, 10000)).toBe(false);
    expect(salary_below(khalid, 18000)).toBe(false);
    expect(salary_below(khalid, 18001)).toBe(true);
  });
});

describe("visa_valid_until", () => {
  it("checks the expiry against the requested date", () => {
    expect(visa_valid_until(rajesh, "2027-01-01")).toBe(true);
    expect(visa_valid_until(rajesh, "2028-01-01")).toBe(false);
    expect(visa_valid_until(sophia, "2026-02-28")).toBe(true);
    expect(visa_valid_until(ahmed, "2026-01-01")).toBe(false);
  });

  it("treats nationals as always valid", () => {
    expect(visa_valid_until(khalid, "2099-01-01")).toBe(true);
  });

  it("is false for an expat record with no visa on file", () => {
    expect(visa_valid_until({ ...rajesh, visaExpiry: null }, "2026-01-01")).toBe(false);
  });

  it("is false for an unparseable target date", () => {
    expect(visa_valid_until(rajesh, "whenever")).toBe(false);
  });
});

describe("clearance_at_least", () => {
  it("compares clearance levels", () => {
    expect(clearance_at_least(rajesh, 3)).toBe(true);
    expect(clearance_at_least(khalid, 3)).toBe(false);
    expect(clearance_at_least(khalid, 2)).toBe(true);
    expect(clearance_at_least(ahmed, 1)).toBe(false);
    expect(clearance_at_least(ahmed, 0)).toBe(true);
  });
});

describe("insured_for", () => {
  it("matches covered treatments case-insensitively", () => {
    expect(insured_for(khalid, "oncology")).toBe(true);
    expect(insured_for(khalid, "Dental")).toBe(true);
    expect(insured_for(sophia, "dental")).toBe(false);
    expect(insured_for(ahmed, "cardiology")).toBe(true);
    expect(insured_for(mariam, "optical")).toBe(false);
  });
});

describe("evaluatePredicate", () => {
  it("dispatches by predicate name", () => {
    expect(evaluatePredicate(khalid, "is_uae_national")).toBe(true);
    expect(evaluatePredicate(mariam, "salary_below", 10000)).toBe(true);
    expect(evaluatePredicate(rajesh, "visa_valid_until", "2027-01-01")).toBe(true);
    expect(evaluatePredicate(rajesh, "clearance_at_least", 3)).toBe(true);
    expect(evaluatePredicate(sophia, "insured_for", "general")).toBe(true);
    expect(evaluatePredicate(sophia, "age_at_least", 18)).toBe(true);
  });

  it("throws on an unknown predicate", () => {
    expect(() => evaluatePredicate(khalid, "nonsense" as never)).toThrow(/Unknown predicate/);
  });
});
