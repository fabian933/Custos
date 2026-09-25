"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditEntry } from "@/lib/audit";

function time(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-GB", { hour12: false });
}

export default function AuditPanel({ refreshToken }: { refreshToken: number }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/audit", { cache: "no-store" });
      const data = await response.json();
      setEntries(data.entries ?? []);
    } catch {
      /* the panel simply keeps the entries it already has */
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [load, refreshToken]);

  return (
    <section className="panel">
      <header className="panel-head">
        <div className="flex items-center justify-between">
          <h2 className="panel-title">Audit log</h2>
          <span className="flex items-center gap-1.5 text-[11px] text-navy-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            live
          </span>
        </div>
        <p className="mt-2 text-sm text-navy-500">
          Every question put to Custos, answered or refused. Subject hashes only.
        </p>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-6 lg:max-h-[640px]">
        {entries.length === 0 && (
          <p className="text-sm text-navy-400">No questions yet. Ask one to see it appear here.</p>
        )}
        {entries.map((entry) => {
          const answered = entry.outcome === "answered";
          return (
            <article
              key={`${entry.timestamp}-${entry.question}`}
              className={`rounded-lg border-l-4 px-4 py-3 ${
                answered
                  ? "border-l-emerald-500 bg-emerald-50/60"
                  : "border-l-red-500 bg-red-50/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    answered ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {entry.outcome}
                </span>
                <span className="font-mono text-[11px] text-navy-400">{time(entry.timestamp)}</span>
              </div>
              <p className="mt-1 text-xs font-medium text-navy-700">
                {entry.agentId ?? "unknown agent"}
              </p>
              <p className="mt-0.5 text-sm text-navy-800">{entry.question}</p>
              {answered ? (
                <p className="mt-1 font-mono text-[11px] text-navy-500">
                  {entry.predicates.map((p) => p.predicate).join(", ")}
                </p>
              ) : (
                <p className="mt-1 text-xs text-red-700">{entry.reason}</p>
              )}
              <p className="mt-1 truncate font-mono text-[10px] text-navy-300">
                {entry.subjectHash}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
