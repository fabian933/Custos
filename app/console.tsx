"use client";

import { useState } from "react";
import type { Agent, PredicateName } from "@/lib/types";

const PREDICATES: { name: PredicateName; label: string; placeholder?: string }[] = [
  { name: "is_uae_national", label: "is_uae_national" },
  { name: "age_at_least", label: "age_at_least", placeholder: "21" },
  { name: "salary_below", label: "salary_below", placeholder: "20000" },
  { name: "visa_valid_until", label: "visa_valid_until", placeholder: "2026-12-31" },
  { name: "clearance_at_least", label: "clearance_at_least", placeholder: "2" },
  { name: "insured_for", label: "insured_for", placeholder: "dental" },
];

const NO_VALUE: PredicateName[] = ["is_uae_national"];

interface Props {
  agents: Agent[];
  residents: { emiratesId: string; fullName: string }[];
}

export default function Console({ agents, residents }: Props) {
  const [agentId, setAgentId] = useState(agents[0].id);
  const [emiratesId, setEmiratesId] = useState(residents[0].emiratesId);
  const [predicate, setPredicate] = useState<PredicateName>("is_uae_national");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<string>("");
  const [pending, setPending] = useState(false);

  const agent = agents.find((a) => a.id === agentId)!;
  const selected = PREDICATES.find((p) => p.name === predicate)!;
  const needsValue = !NO_VALUE.includes(predicate);

  async function ask() {
    setPending(true);
    try {
      const response = await fetch("/api/facts", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": agent.apiKey },
        body: JSON.stringify({
          emiratesId,
          predicate,
          ...(needsValue ? { value: /^\d+$/.test(value) ? Number(value) : value } : {}),
        }),
      });
      setResult(JSON.stringify(await response.json(), null, 2));
    } catch (error) {
      setResult(String(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Agent</span>
          <select
            className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.owner}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            purpose: {agent.purpose} · allowed: {agent.allowedPredicates.join(", ") || "none"}
          </span>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">Resident</span>
          <select
            className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
            value={emiratesId}
            onChange={(e) => setEmiratesId(e.target.value)}
          >
            {residents.map((r) => (
              <option key={r.emiratesId} value={r.emiratesId}>
                {r.emiratesId} — {r.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">Predicate</span>
          <select
            className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
            value={predicate}
            onChange={(e) => setPredicate(e.target.value as PredicateName)}
          >
            {PREDICATES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">Value</span>
          <input
            className="w-full rounded border border-slate-300 bg-transparent px-3 py-2 disabled:opacity-40 dark:border-slate-700"
            disabled={!needsValue}
            placeholder={selected.placeholder ?? "—"}
            value={needsValue ? value : ""}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
      </div>

      <button
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
        disabled={pending}
        onClick={ask}
      >
        {pending ? "Asking…" : "Ask Custos"}
      </button>

      {result && (
        <pre className="overflow-x-auto rounded bg-slate-100 p-4 text-xs dark:bg-slate-900">
          {result}
        </pre>
      )}
    </section>
  );
}
