/**
 * Display-only wording for predicates. Receipts keep the machine names, so nothing here is
 * ever signed or sent back to an agent.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(value: unknown): string {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatAmount(value: unknown): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString("en-US") : String(value);
}

function firstArg(args: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    if (args[name] !== undefined) return args[name];
  }
  return Object.values(args)[0];
}

const NAMES: Record<string, string> = {
  is_uae_national: "UAE national",
  salary_below: "Salary below a threshold",
  age_at_least: "Minimum age",
  visa_valid_until: "Visa validity",
  clearance_at_least: "Minimum clearance level",
  insured_for: "Insurance cover",
};

export function predicateNameLabel(predicate: string): string {
  return NAMES[predicate] ?? predicate.replace(/[_-]+/g, " ");
}

export function predicateLabel(predicate: string, args: Record<string, unknown> = {}): string {
  switch (predicate) {
    case "is_uae_national":
      return "UAE national";
    case "salary_below":
      return `Salary below AED ${formatAmount(firstArg(args, "amount", "value"))}`;
    case "age_at_least":
      return `Aged ${firstArg(args, "n", "value")} or over`;
    case "visa_valid_until":
      return `Visa valid until ${formatDate(firstArg(args, "date", "value"))}`;
    case "clearance_at_least":
      return `Clearance level ${firstArg(args, "level", "value")} or higher`;
    case "insured_for":
      return `Insured for ${firstArg(args, "treatment", "value")}`;
    default:
      return predicate.replace(/[_-]+/g, " ");
  }
}
