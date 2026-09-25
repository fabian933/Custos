export interface Resident {
  emiratesId: string;
  fullName: string;
  nationality: string;
  dob: string;
  salaryAED: number;
  visaExpiry: string | null;
  clearanceLevel: number;
  insurancePlan: string;
  coveredTreatments: string[];
}

export interface Agent {
  id: string;
  owner: string;
  purpose: string;
  allowedPredicates: string[];
  apiKey: string;
  registered: boolean;
}

export type PredicateName =
  | "is_uae_national"
  | "age_at_least"
  | "salary_below"
  | "visa_valid_until"
  | "clearance_at_least"
  | "insured_for";

export interface FactQuery {
  emiratesId: string;
  predicate: PredicateName;
  value?: string | number;
}

export interface SignedFact {
  emiratesId: string;
  predicate: PredicateName;
  value: string | number | null;
  answer: boolean;
  issuedAt: string;
  issuer: string;
  agentId: string;
  signature: string;
  algorithm: "Ed25519";
}
