import type { PredicateName } from "./types";

export interface PredicateSpec {
  name: PredicateName;
  args: { name: string; type: "number" | "string"; description: string }[];
  description: string;
}

/** The only questions Custos can answer. Anything outside this catalog is refused. */
export const PREDICATE_CATALOG: PredicateSpec[] = [
  {
    name: "is_uae_national",
    args: [],
    description: "True if the resident is a UAE national.",
  },
  {
    name: "age_at_least",
    args: [{ name: "n", type: "number", description: "age in full years" }],
    description: "True if the resident is at least n years old.",
  },
  {
    name: "salary_below",
    args: [{ name: "amount", type: "number", description: "monthly salary in AED" }],
    description: "True if the resident's monthly salary is strictly below amount AED.",
  },
  {
    name: "visa_valid_until",
    args: [{ name: "date", type: "string", description: "ISO date, e.g. 2026-12-31" }],
    description:
      "True if the resident's residency visa is valid at least until date. UAE nationals are always valid.",
  },
  {
    name: "clearance_at_least",
    args: [{ name: "level", type: "number", description: "clearance level 0-3" }],
    description: "True if the resident's security clearance is at least level.",
  },
  {
    name: "insured_for",
    args: [{ name: "treatment", type: "string", description: "treatment name, e.g. dental" }],
    description: "True if the resident's insurance plan covers the treatment.",
  },
];

export const CATALOG_NAMES = PREDICATE_CATALOG.map((p) => p.name);

export function catalogSpec(name: string): PredicateSpec | undefined {
  return PREDICATE_CATALOG.find((p) => p.name === name);
}

/** Extracts the single positional value a predicate takes, from its named args. */
export function argValue(
  spec: PredicateSpec,
  args: Record<string, unknown>,
): string | number | undefined {
  if (spec.args.length === 0) return undefined;
  const raw = args[spec.args[0].name];
  if (raw === undefined || raw === null) return undefined;
  return spec.args[0].type === "number" ? Number(raw) : String(raw);
}

export function describeCatalog(): string {
  return PREDICATE_CATALOG.map((p) => {
    const args = p.args.map((a) => `${a.name}: ${a.type} (${a.description})`).join(", ");
    return `- ${p.name}(${args}) — ${p.description}`;
  }).join("\n");
}
