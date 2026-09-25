"use client";

import { useState } from "react";
import CopyButton from "./copy-button";
import type { QueryResponse } from "@/lib/query";
import type { Agent, PredicateName } from "@/lib/types";

const EXAMPLES = [
  "Is this person eligible for a housing grant?",
  "Is their visa valid until 2026-12-31?",
  "What is their exact salary?",
  "هل عمره ٢١ سنة على الأقل؟",
];

const MANUAL_PREDICATES: { name: PredicateName; placeholder?: string }[] = [
  { name: "is_uae_national" },
  { name: "age_at_least", placeholder: "21" },
  { name: "salary_below", placeholder: "20000" },
  { name: "visa_valid_until", placeholder: "2026-12-31" },
  { name: "clearance_at_least", placeholder: "2" },
  { name: "insured_for", placeholder: "dental" },
];

/** Manual mode calls /api/facts, which issues a single-predicate receipt and no translation. */
type PanelAnswer = {
  results: QueryResponse["results"];
  receipt: Record<string, unknown>;
  translatedBy?: QueryResponse["translatedBy"];
};

function argsLabel(args: Record<string, unknown>): string {
  const values = Object.values(args);
  return values.length === 0 ? "" : `(${values.join(", ")})`;
}

function ResultChip({
  predicate,
  args,
  result,
}: {
  predicate: string;
  args: Record<string, unknown>;
  result: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
        result ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
      }`}
    >
      <span className="font-mono text-xs text-navy-700">
        {predicate}
        {argsLabel(args)}
      </span>
      <span
        className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white ${
          result ? "bg-emerald-600" : "bg-red-600"
        }`}
      >
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
}

export default function GatewayPanel({
  agents,
  residents,
  agentId,
  onAgentChange,
  emiratesId,
  onResidentChange,
  onAnswered,
}: Props) {
  const [question, setQuestion] = useState(EXAMPLES[0]);
  const [manual, setManual] = useState(false);
  const [predicate, setPredicate] = useState<PredicateName>("is_uae_national");
  const [manualValue, setManualValue] = useState("");
  const [answer, setAnswer] = useState<PanelAnswer | null>(null);
  const [refusal, setRefusal] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [pending, setPending] = useState(false);

  const agent = agents.find((a) => a.id === agentId)!;
  const manualSpec = MANUAL_PREDICATES.find((p) => p.name === predicate)!;
  const needsValue = manualSpec.placeholder !== undefined;

  async function ask() {
    setPending(true);
    setRefusal("");
    setAnswer(null);
    try {
      const response = manual
        ? await fetch("/api/facts", {
            method: "POST",
            headers: { "content-type": "application/json", "x-api-key": agent.apiKey },
            body: JSON.stringify({
              emiratesId,
              predicate,
              ...(needsValue
                ? { value: /^\d+$/.test(manualValue) ? Number(manualValue) : manualValue }
                : {}),
            }),
          })
        : await fetch("/api/query", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ apiKey: agent.apiKey, emiratesId, question }),
          });
      const data = await response.json();

      if (!response.ok) {
        setRefusal(data.reason ?? data.error ?? `request failed (${response.status})`);
      } else if (manual) {
        setAnswer({
          results: [{ predicate: data.predicate, args: {}, result: data.answer }],
          receipt: data,
        });
      } else {
        setAnswer(data as PanelAnswer);
      }
    } catch (error) {
      setRefusal(String(error));
    } finally {
      setPending(false);
      onAnswered();
    }
  }

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
          <span className="font-medium text-navy-700">{agent.owner}</span> · purpose:{" "}
          {agent.purpose} · may ask: {agent.allowedPredicates.join(", ") || "nothing"}
        </p>

        {manual ? (
          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="field-label">Predicate</span>
              <select
                className="field"
                value={predicate}
                onChange={(e) => setPredicate(e.target.value as PredicateName)}
              >
                {MANUAL_PREDICATES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Value</span>
              <input
                className="field disabled:bg-navy-50 disabled:text-navy-300"
                disabled={!needsValue}
                placeholder={manualSpec.placeholder ?? "—"}
                value={needsValue ? manualValue : ""}
                onChange={(e) => setManualValue(e.target.value)}
              />
            </label>
          </div>
        ) : (
          <div>
            <span className="field-label">Question</span>
            <textarea
              className="field min-h-[76px] resize-none"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask in plain language — English or Arabic"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuestion(example)}
                  className="rounded-full border border-navy-200 px-3 py-1 text-xs text-navy-600 transition hover:border-navy-400 hover:text-navy-800"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={ask}
            disabled={pending}
            className="rounded-lg bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-50"
          >
            {pending ? "Asking…" : "Ask Custos"}
          </button>
          <label className="flex items-center gap-2 text-xs text-navy-500">
            <input
              type="checkbox"
              checked={manual}
              onChange={(e) => setManual(e.target.checked)}
              className="accent-navy-700"
            />
            Manual mode
          </label>
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

            <div className="rounded-lg border border-navy-200">
              <div className="flex items-center justify-between px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setShowReceipt((open) => !open)}
                  className="text-xs font-semibold text-navy-700"
                >
                  {showReceipt ? "▾" : "▸"} Signed receipt
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
