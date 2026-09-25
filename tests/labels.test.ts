import { describe, expect, it } from "vitest";
import { predicateLabel } from "../lib/labels";

describe("predicateLabel", () => {
  it("renders every catalog predicate in plain English", () => {
    expect(predicateLabel("is_uae_national", {})).toBe("UAE national");
    expect(predicateLabel("salary_below", { amount: 30000 })).toBe("Salary below AED 30,000");
    expect(predicateLabel("age_at_least", { n: 21 })).toBe("Aged 21 or over");
    expect(predicateLabel("visa_valid_until", { date: "2026-12-31" })).toBe(
      "Visa valid until 31 Dec 2026",
    );
    expect(predicateLabel("clearance_at_least", { level: 2 })).toBe(
      "Clearance level 2 or higher",
    );
    expect(predicateLabel("insured_for", { treatment: "dental" })).toBe("Insured for dental");
  });

  it("never shows underscores or dashes", () => {
    expect(predicateLabel("some_unknown-predicate", {})).toBe("some unknown predicate");
  });
});
