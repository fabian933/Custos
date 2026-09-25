const DAY_MS = 86_400_000;

/** Whole days between the epoch and a date, so dates fit the circuit's integer comparator. */
export function dobToDays(dob: string): number {
  return Math.floor(Date.parse(`${dob.slice(0, 10)}T00:00:00Z`) / DAY_MS);
}

/**
 * age_at_least(n) holds when the resident was born on or before the cutoff date,
 * so the circuit proves dobDays < cutoffDays + 1 (mode 0) without revealing the date.
 */
export function ageThresholdDays(n: number, now: Date = new Date()): number {
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear() - n, now.getUTCMonth(), now.getUTCDate()),
  );
  return Math.floor(cutoff.getTime() / DAY_MS) + 1;
}
