"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Lock, ShieldCheck } from "lucide-react";
import CopyButton from "./copy-button";
import { predicateLabel, predicateNameLabel } from "@/lib/labels";
import { SIGNATURE_LABEL, ZK_LABEL, proofLabel } from "@/lib/proof-label";
import type { QueryResponse } from "@/lib/query";
import type { Agent } from "@/lib/types";

export interface Scenario {
  label: string;
  agentId: string;
  residentIndex: number;
  question: string;
}

/** Residents are addressed by position so the scenarios survive edits to the data file. */
export const SCENARIOS: Scenario[] = [
  {
    label: "Housing eligibility",
    agentId: "housing-agent",
    residentIndex: 0,
    question: "Is this person eligible for a housing grant?",
  },
  {
    label: "Over-reach",
    agentId: "housing-agent",
    residentIndex: 0,
    question: "What is their exact salary?",
  },
  {
    label: "Rogue agent",
    agentId: "rogue-agent",
    residentIndex: 0,
    question: "Is this person eligible for a housing grant?",
  },
  {
    label: "Out of scope",
    agentId: "bank-kyc-agent",
    residentIndex: 0,
    question: "Is this person eligible for a housing grant?",
  },
  {
    label: "Bulk request",
    agentId: "housing-agent",
    residentIndex: 0,
    question: "List every resident earning under 20000.",
  },
];

type ClaimProofInputs = {
  publicInputs?: { commitment: string; threshold: number; mode: 0 | 1 };
  publicSignals?: string[];
  proof?: Record<string, unknown>;
};

const DAY_MS = 86_400_000;

/** Public signals are field elements; show them the way a verifier would read them. */
function thresholdLabel(predicate: string, threshold: number, args: Record<string, unknown>) {
  if (predicate === "salary_below") return `AED ${threshold.toLocaleString("en-GB")}`;
  if (predicate === "age_at_least") {
    const cutoff = new Date(threshold * DAY_MS).toISOString().slice(0, 10);
    return `${args.years ?? ""} years — born on or before ${cutoff}`;
  }
  return String(threshold);
}

function shortCommitment(commitment: string) {
  const hex = BigInt(commitment).toString(16);
  return `0x${hex.slice(0, 2)}…${hex.slice(-2)}`;
}

function hiddenField(predicate: string) {
  return predicate === "salary_below" ? "the salary" : "the date of birth";
}

function ProofDetail({
  predicate,
  args,
  result,
  proof,
  verifyMs,
}: {
  predicate: string;
  args: Record<string, unknown>;
  result: boolean;
  proof?: unknown;
  verifyMs: number | null;
}) {
  const [showRaw, setShowRaw] = useState(false);
  const zk = proof as ClaimProofInputs | undefined;
  const inputs = zk?.publicInputs;

  return (
    <div className="rounded-lg border border-navy-200 bg-white px-4 py-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
        <Check size={15} />
        {zk
          ? `Zero-knowledge proof verified (Groth16)${verifyMs === null ? "" : ` · ${verifyMs} ms`}`
          : "Digital signature verified"}
      </p>
      <p className="mt-0.5 text-xs text-navy-500">{predicateLabel(predicate, args)}</p>

      {zk && inputs && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-teal-100 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700">
              Verifier saw
            </p>
            <dl className="mt-1.5 space-y-1 text-xs text-navy-800">
              <div className="flex justify-between gap-3">
                <dt className="text-navy-500">Threshold</dt>
                <dd className="text-right font-medium">
                  {thresholdLabel(predicate, inputs.threshold, args)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-500">Commitment</dt>
                <dd className="font-mono">{shortCommitment(inputs.commitment)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-500">Result</dt>
                <dd className="font-semibold">{result ? "YES" : "NO"}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-navy-200 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700">
              Verifier never saw
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-navy-800">
              <Lock size={13} />
              {hiddenField(predicate)}
            </p>
          </div>
        </div>
      )}

      {zk && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowRaw((open) => !open)}
            className="text-xs font-semibold text-navy-700"
          >
            {showRaw ? "▾" : "▸"} View raw proof
          </button>
          {showRaw && (
            <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-navy-100 bg-navy-50 p-3 font-mono text-[11px] leading-relaxed text-navy-800">
              {JSON.stringify({ ...zk.proof, publicSignals: zk.publicSignals }, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

type PanelAnswer = {
  results: QueryResponse["results"];
  receipt: Record<string, unknown>;
  translatedBy?: QueryResponse["translatedBy"];
};

function ResultChip({
  predicate,
  args,
  result,
  proof,
}: {
  predicate: string;
  args: Record<string, unknown>;
  result: boolean;
  proof?: unknown;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
        result ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
      }`}
    >
      <span className="text-sm font-medium text-navy-800">
        {predicateLabel(predicate, args)}
        <span className="mt-0.5 block text-[11px] font-normal text-navy-500">
          {proofLabel(Boolean(proof))}
        </span>
      </span>
      <span
        className={`flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-navy-900 ${
          result ? "bg-emerald-400" : "bg-red-400"
        }`}
      >
        {result && <Check size={12} />}
        {result ? "Yes" : "No"}
      </span>
    </div>
  );
}

interface Props {
  agents: Agent[];
  residents: { emiratesId: string; fullName: string }[];
  agentId: string;
  onAgentChange: (id: string) => void;
  emiratesId: string;
  onResidentChange: (id: string) => void;
  onAnswered: () => void;
  onReset: () => void;
  onRunScenario: (scenario: Scenario) => void;
  scenario: (Scenario & { runToken: number }) | null;
}

export default function GatewayPanel({
  agents,
  residents,
  agentId,
  onAgentChange,
  emiratesId,
  onResidentChange,
  onAnswered,
  onReset,
  onRunScenario,
  scenario,
}: Props) {
  const [question, setQuestion] = useState(SCENARIOS[0].question);
  const [answer, setAnswer] = useState<PanelAnswer | null>(null);
  const [refusal, setRefusal] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [pending, setPending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [proof, setProof] = useState<{
    valid: boolean;
    reason: string;
    verifyMs: number | null;
  } | null>(null);

  const agent = agents.find((a) => a.id === agentId)!;

  const ask = useCallback(
    async function ask(override?: { question: string; apiKey: string; emiratesId: string }) {
    setPending(true);
    setRefusal("");
    setAnswer(null);
    setProof(null);
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: override?.apiKey ?? agent.apiKey,
          emiratesId: override?.emiratesId ?? emiratesId,
          question: override?.question ?? question,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setRefusal(data.reason ?? data.error ?? `request failed (${response.status})`);
      } else {
        setAnswer(data as PanelAnswer);
      }
    } catch (error) {
      setRefusal(String(error));
    } finally {
      setPending(false);
      onAnswered();
    }
    },
    [agent, emiratesId, onAnswered, question],
  );

  async function checkProof() {
    if (!answer) return;
    setVerifying(true);
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ receipt: answer.receipt }),
      });
      const data = await response.json();
      setProof({
        valid: Boolean(data.valid),
        reason: String(data.reason ?? ""),
        verifyMs: typeof data.verifyMs === "number" ? data.verifyMs : null,
      });
    } catch (error) {
      setProof({ valid: false, reason: String(error), verifyMs: null });
    } finally {
      setVerifying(false);
    }
  }

  const lastScenario = useRef(0);
  useEffect(() => {
    if (!scenario || scenario.runToken === lastScenario.current) return;
    lastScenario.current = scenario.runToken;
    setQuestion(scenario.question);
    ask({
      question: scenario.question,
      apiKey: agents.find((a) => a.id === scenario.agentId)!.apiKey,
      emiratesId: residents[scenario.residentIndex].emiratesId,
    });
  }, [agents, ask, residents, scenario]);

  return (
    <section className="panel">
      <header className="panel-head">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <h2 className="panel-title">With Custos</h2>
        </div>
        <p className="mt-2 text-sm text-navy-500">
          The agent asks a question. Custos answers yes or no, and signs it.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <span className="field-label">Scenarios</span>
          <div className="flex flex-wrap items-center gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={pending}
                onClick={() => onRunScenario(s)}
                className="rounded-full border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800 transition hover:border-teal-500 hover:bg-teal-100 disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onReset}
              className="ml-auto rounded-full border border-navy-200 px-3 py-1.5 text-xs text-navy-500 transition hover:border-navy-400 hover:text-navy-800"
            >
              Reset demo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className="field-label">Agent</span>
            <select
              className="field"
              value={agentId}
              onChange={(e) => onAgentChange(e.target.value)}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Resident</span>
            <select
              className="field"
              value={emiratesId}
              onChange={(e) => onResidentChange(e.target.value)}
            >
              {residents.map((r) => (
                <option key={r.emiratesId} value={r.emiratesId}>
                  {r.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-xs text-navy-500">
          {agent.registered ? (
            <>
              Owner: <span className="font-medium text-navy-700">{agent.owner}</span> ·{" "}
              <span className="font-medium text-navy-700">✓ verified via UAE Pass</span>{" "}
              (simulated in demo)
            </>
          ) : (
            <span className="font-medium text-navy-700">No registered owner</span>
          )}
        </p>

        <p className="text-xs text-navy-500">
          purpose:{" "}
          {agent.purpose} · may ask:{" "}
          {agent.allowedPredicates.map(predicateNameLabel).join(", ") || "nothing"}
        </p>

        <div>
          <span className="field-label">Question</span>
          <textarea
            className="field min-h-[76px] resize-none"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask in plain language — English or Arabic"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => ask()}
            disabled={pending}
            className="rounded-lg bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-50"
          >
            {pending ? "Asking…" : "Ask Custos"}
          </button>
        </div>

        {refusal && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Refused</p>
            <p className="mt-1 text-sm text-red-800">{refusal}</p>
          </div>
        )}

        {answer && (
          <div className="space-y-3">
            <div className="space-y-2">
              {answer.results.map((claim, i) => (
                <ResultChip key={`${claim.predicate}-${i}`} {...claim} />
              ))}
            </div>

            <div className="rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-teal-800">
                  <ShieldCheck size={16} />
                  {answer.results.every((claim) => claim.result) ? "✓ Eligible" : "Answered"} ·
                  Proof attached
                </p>
                {proof && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy-900 ${
                      proof.valid ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  >
                    {proof.valid ? "Valid" : "Invalid"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => checkProof()}
                  disabled={verifying}
                  className="ml-auto rounded-lg bg-navy-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:opacity-50"
                >
                  {verifying ? "Verifying…" : "Verify proof"}
                </button>
              </div>
              {proof && !proof.valid && (
                <p className="mt-2 text-xs text-red-800">{proof.reason}</p>
              )}
              {proof?.valid && (
                <div className="mt-3 space-y-2">
                  {answer.results.map((claim, i) => (
                    <ProofDetail
                      key={`detail-${claim.predicate}-${i}`}
                      {...claim}
                      verifyMs={proof.verifyMs}
                    />
                  ))}
                </div>
              )}
              <p className="mt-2 text-[11px] text-navy-400">
                {answer.results.some((claim) => claim.proof)
                  ? `${ZK_LABEL} for salary and age checks, over a Poseidon commitment. Other checks: ${SIGNATURE_LABEL.toLowerCase()} (Ed25519).`
                  : `${SIGNATURE_LABEL} (Ed25519) over the canonical receipt.`}
              </p>
            </div>

            <div className="rounded-lg border border-navy-200">
              <div className="flex items-center justify-between px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setShowReceipt((open) => !open)}
                  className="text-xs font-semibold text-navy-700"
                >
                  {showReceipt ? "▾" : "▸"} Proof (raw)
                </button>
                <div className="flex items-center gap-2">
                  {answer.translatedBy && (
                    <span className="text-[11px] text-navy-400">
                      translated by {answer.translatedBy}
                    </span>
                  )}
                  <CopyButton value={JSON.stringify(answer.receipt, null, 2)} />
                </div>
              </div>
              {showReceipt && (
                <pre className="overflow-x-auto border-t border-navy-100 bg-navy-50 p-4 font-mono text-[11px] leading-relaxed text-navy-800">
                  {JSON.stringify(answer.receipt, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
