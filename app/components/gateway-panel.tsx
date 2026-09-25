"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CopyButton from "./copy-button";
import WithoutCustos from "./without-custos";
import { predicateLabel, predicateNameLabel } from "@/lib/labels";
import type { QueryResponse } from "@/lib/query";
import type { Agent, PredicateName } from "@/lib/types";

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
  {
    label: "Arabic",
    agentId: "bank-kyc-agent",
    residentIndex: 4,
    question: "هل عمره ٢١ سنة على الأقل؟",
  },
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
      <span className="text-sm font-medium text-navy-800">{predicateLabel(predicate, args)}</span>
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
  const [manual, setManual] = useState(false);
  const [predicate, setPredicate] = useState<PredicateName>("is_uae_national");
  const [manualValue, setManualValue] = useState("");
  const [answer, setAnswer] = useState<PanelAnswer | null>(null);
  const [refusal, setRefusal] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showNaive, setShowNaive] = useState(false);
  const [pending, setPending] = useState(false);

  const agent = agents.find((a) => a.id === agentId)!;
  const manualSpec = MANUAL_PREDICATES.find((p) => p.name === predicate)!;
  const needsValue = manualSpec.placeholder !== undefined;

  const ask = useCallback(
    async function ask(override?: { question: string; apiKey: string; emiratesId: string }) {
    setPending(true);
    setRefusal("");
    setAnswer(null);
    try {
      const response = manual && !override
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
            body: JSON.stringify({
              apiKey: override?.apiKey ?? agent.apiKey,
              emiratesId: override?.emiratesId ?? emiratesId,
              question: override?.question ?? question,
            }),
          });
      const data = await response.json();

      if (!response.ok) {
        setRefusal(data.reason ?? data.error ?? `request failed (${response.status})`);
      } else if (manual && !override) {
        setAnswer({
          results: [
            {
              predicate: data.predicate,
              args: data.value === undefined ? {} : { value: data.value },
              result: data.answer,
            },
          ],
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
    },
    [agent, emiratesId, manual, manualValue, needsValue, onAnswered, predicate, question],
  );

  const lastScenario = useRef(0);
  useEffect(() => {
    if (!scenario || scenario.runToken === lastScenario.current) return;
    lastScenario.current = scenario.runToken;
    setManual(false);
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
          <span className="font-medium text-navy-700">{agent.owner}</span> · purpose:{" "}
          {agent.purpose} · may ask:{" "}
          {agent.allowedPredicates.map(predicateNameLabel).join(", ") || "nothing"}
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
                    {predicateNameLabel(p.name)}
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
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => ask()}
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

        <div className="mt-auto rounded-lg border border-red-200">
          <button
            type="button"
            onClick={() => setShowNaive((open) => !open)}
            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-700"
          >
            {showNaive ? "▾" : "▸"} See what a naive agent receives
          </button>
          {showNaive && (
            <div className="border-t border-red-100 p-4">
              <WithoutCustos emiratesId={emiratesId} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
