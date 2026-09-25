import { CATALOG_NAMES, describeCatalog } from "./catalog";

export interface PredicateRequest {
  name: string;
  args: Record<string, unknown>;
}

export type Translation =
  | { refuse: false; predicates: PredicateRequest[]; source: "llm" | "fallback" }
  | { refuse: true; reason: string; source: "llm" | "fallback" };

export const HOUSING_GRANT_SALARY_CEILING = 30000;

export const SYSTEM_PROMPT = `You are the query translator for Custos, a fact gateway that stands between AI agents and a government resident registry. Agents never receive records; they receive yes/no answers to predicates.

Every question is about one resident, already chosen by the caller. Singular "they"/"their" and Arabic plural politeness refer to that one resident, never to a group.

Translate the agent's question into predicates from this catalog, and nothing else:
${describeCatalog()}

Rules:
- Output JSON only. No prose, no markdown, no code fences.
- Either {"predicates":[{"name":"<catalog name>","args":{...}}]} or {"refuse":true,"reason":"<short reason>"}.
- Use only catalog predicate names and only their documented argument names.
- Refuse any request for raw field values (exact salary, date of birth, full name, nationality, visa expiry date, insurance plan, the full record) — those are values, not yes/no facts.
- Refuse requests for bulk data only when the question explicitly asks about more than one resident: lists, exports, counts, "all residents", statistics.
- Refuse anything the catalog cannot express.
- Questions may be in English or Arabic; treat both identically.
- "housing grant eligibility" (and equivalent phrasings) maps to is_uae_national plus salary_below with amount ${HOUSING_GRANT_SALARY_CEILING}.
- A yes/no question about a threshold is allowed even when it mentions a sensitive field: "does he earn less than 20000?" is salary_below(20000), while "what is his salary?" is refused.`;

const DEFAULT_MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 15000;

function parseTranslation(content: string, source: "llm" | "fallback"): Translation {
  const parsed = JSON.parse(content) as Record<string, unknown>;

  if (parsed.refuse === true) {
    return { refuse: true, reason: String(parsed.reason ?? "request refused"), source };
  }

  const predicates = parsed.predicates;
  if (!Array.isArray(predicates) || predicates.length === 0) {
    return { refuse: true, reason: "question could not be mapped to a known fact", source };
  }

  const requests: PredicateRequest[] = [];
  for (const entry of predicates) {
    const name = (entry as PredicateRequest)?.name;
    if (typeof name !== "string" || !CATALOG_NAMES.includes(name as never)) {
      return { refuse: true, reason: `unknown predicate: ${String(name)}`, source };
    }
    const args = (entry as PredicateRequest).args;
    requests.push({ name, args: args && typeof args === "object" ? args : {} });
  }
  return { refuse: false, predicates: requests, source };
}

async function translateWithLlm(question: string): Promise<Translation> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.CUSTOS_LLM_MODEL || DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");
  return parseTranslation(content, "llm");
}

const RAW_DATA_PATTERNS: RegExp[] = [
  /\b(what|what's|whats|tell me|give me|show me|return|provide|list|export|share)\b[^?]*\b(salary|wage|income|dob|date of birth|birth ?date|age|name|nationality|visa|expiry|record|file|plan|treatments?|emirates id)\b/i,
  /\b(full|entire|complete|raw|whole)\b[^?]*\b(record|profile|file|details?|data)\b/i,
  /\b(all|every|list of|how many)\b[^?]*\b(residents?|people|citizens?|nationals?|records?)\b/i,
  /\b(exact|precise|actual)\b/i,
  /(كم|ما هو|ما هي|اعطني|أعطني|أظهر|قائمة)\s*[^؟?]*\s*(راتب|الراتب|تاريخ الميلاد|الاسم|السجل|الملف|الجنسية)/i,
];

const ARABIC_NATIONAL = /(مواطن|إماراتي|اماراتي)/;
const ARABIC_HOUSING = /(منحة|مساعدة)\s*(سكن|سكنية|الإسكان|الاسكان)|أهلية السكن/;
const ARABIC_AGE = /(عمر|السن)/;
const ARABIC_SALARY = /(راتب|الراتب|الدخل)/;
const ARABIC_VISA = /(تأشيرة|التأشيرة|الإقامة|الاقامة)/;
const ARABIC_INSURANCE = /(تأمين|التأمين|مغطى|تغطية)/;
const ARABIC_CLEARANCE = /(تصريح|التصريح|الأمني|امني)/;

function firstNumber(question: string): number | undefined {
  const match = question.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function firstDate(question: string): string | undefined {
  return question.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? question.match(/\b(20\d{2})\b/)?.[1];
}

/** Keyword parser used when the LLM is unavailable, so the demo never breaks. */
export function translateWithKeywords(question: string): Translation {
  const q = question.trim();
  const lower = q.toLowerCase();
  const source = "fallback" as const;

  if (RAW_DATA_PATTERNS.some((re) => re.test(q))) {
    return { refuse: true, reason: "raw record values cannot be disclosed", source };
  }

  if (/housing (grant|subsidy|support)|eligib\w* for (a )?housing|housing eligibility/.test(lower) || ARABIC_HOUSING.test(q)) {
    return {
      refuse: false,
      source,
      predicates: [
        { name: "is_uae_national", args: {} },
        { name: "salary_below", args: { amount: HOUSING_GRANT_SALARY_CEILING } },
      ],
    };
  }

  const predicates: PredicateRequest[] = [];

  if (/uae national|emirati|citizen/.test(lower) || ARABIC_NATIONAL.test(q)) {
    predicates.push({ name: "is_uae_national", args: {} });
  }

  if (/\b(older|at least|over|above|aged|age)\b/.test(lower) || ARABIC_AGE.test(q)) {
    const n = firstNumber(q);
    if (n !== undefined && n < 130) predicates.push({ name: "age_at_least", args: { n } });
  }

  if (/salary|earn|income|paid/.test(lower) || ARABIC_SALARY.test(q)) {
    const amount = firstNumber(q);
    if (amount !== undefined && amount >= 100) {
      predicates.push({ name: "salary_below", args: { amount } });
    }
  }

  if (/visa|residen\w*/.test(lower) || ARABIC_VISA.test(q)) {
    const date = firstDate(q);
    if (date) {
      predicates.push({
        name: "visa_valid_until",
        args: { date: date.length === 4 ? `${date}-01-01` : date },
      });
    }
  }

  if (/clearance|vetting|security level/.test(lower) || ARABIC_CLEARANCE.test(q)) {
    const level = firstNumber(q);
    if (level !== undefined && level <= 3) {
      predicates.push({ name: "clearance_at_least", args: { level } });
    }
  }

  if (/insur\w*|covered|cover|treatment/.test(lower) || ARABIC_INSURANCE.test(q)) {
    const treatment = lower.match(
      /\b(dental|optical|maternity|oncology|physiotherapy|cardiology|general)\b/,
    )?.[1];
    if (treatment) predicates.push({ name: "insured_for", args: { treatment } });
  }

  if (predicates.length === 0) {
    return { refuse: true, reason: "question could not be mapped to a known fact", source };
  }
  return { refuse: false, predicates, source };
}

/** Translates a plain-language question, falling back to keywords if the LLM fails. */
export async function translateQuestion(question: string): Promise<Translation> {
  try {
    return await translateWithLlm(question);
  } catch {
    return translateWithKeywords(question);
  }
}
