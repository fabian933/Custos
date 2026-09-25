import type { PredicateName, Resident } from "./types";

const UAE_NATIONALITIES = ["united arab emirates", "uae", "emirati"];

export function is_uae_national(resident: Resident): boolean {
  return UAE_NATIONALITIES.includes(resident.nationality.trim().toLowerCase());
}

export function age_at_least(resident: Resident, n: number, now: Date = new Date()): boolean {
  const dob = new Date(resident.dob);
  if (Number.isNaN(dob.getTime())) return false;
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age >= n;
}

export function salary_below(resident: Resident, amount: number): boolean {
  return resident.salaryAED < amount;
}

export function visa_valid_until(resident: Resident, date: string | Date): boolean {
  const target = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(target.getTime())) return false;
  // UAE nationals have no visa; residency is unconditional.
  if (resident.visaExpiry === null) return is_uae_national(resident);
  const expiry = new Date(resident.visaExpiry);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() >= target.getTime();
}

export function clearance_at_least(resident: Resident, level: number): boolean {
  return resident.clearanceLevel >= level;
}

export function insured_for(resident: Resident, treatment: string): boolean {
  const needle = treatment.trim().toLowerCase();
  return resident.coveredTreatments.some((t) => t.trim().toLowerCase() === needle);
}

export const PREDICATES_REQUIRING_VALUE: PredicateName[] = [
  "age_at_least",
  "salary_below",
  "visa_valid_until",
  "clearance_at_least",
  "insured_for",
];

export function evaluatePredicate(
  resident: Resident,
  predicate: PredicateName,
  value?: string | number,
): boolean {
  switch (predicate) {
    case "is_uae_national":
      return is_uae_national(resident);
    case "age_at_least":
      return age_at_least(resident, Number(value));
    case "salary_below":
      return salary_below(resident, Number(value));
    case "visa_valid_until":
      return visa_valid_until(resident, String(value));
    case "clearance_at_least":
      return clearance_at_least(resident, Number(value));
    case "insured_for":
      return insured_for(resident, String(value));
    default: {
      const exhaustive: never = predicate;
      throw new Error(`Unknown predicate: ${String(exhaustive)}`);
    }
  }
}
