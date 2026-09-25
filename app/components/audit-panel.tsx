"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { predicateLabel } from "@/lib/labels";
import type { AuditEntry } from "@/lib/audit";

function time(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-GB", { hour12: false });
}

function shortHash(hash: string | null): string {
  if (!hash) return "";
  return `subject ${hash.slice(0, 4)}…${hash.slice(-4)}`;
}

function meta(entry: AuditEntry): string {
  const detail =
    entry.outcome === "answered"
      ? entry.predicates.map((p) => predicateLabel(p.predicate, p.args)).join(", ")
      : entry.reason ?? "";
  return [entry.agentId ?? "unknown agent", detail, time(entry.timestamp)]
    .filter(Boolean)
    .join(" · ");
}

export default function AuditPanel({ refreshToken }: { refreshToken: number }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const newest = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/audit", { cache: "no-store" });
      const data = await response.json();
      const next: AuditEntry[] = data.entries ?? [];
      setEntries(next);
      const key = next[0] ? `${next[0].timestamp}-${next[0].question}` : null;
      if (key !== newest.current) {
        newest.current = key;
        setFreshKey(key);
      }
    } catch {
      /* the panel simply keeps the entries it already has */
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [load, refreshToken]);

  useEffect(() => {
    if (!freshKey) return;
    const timer = setTimeout(() => setFreshKey(null), 1400);
    return () => clearTimeout(timer);
  }, [freshKey]);

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

      <div className="flex-1 divide-y divide-navy-100 overflow-y-auto lg:max-h-[640px]">
        {entries.length === 0 && (
          <p className="p-6 text-sm text-navy-400">
            No questions yet. Ask one to see it appear here.
          </p>
        )}
        {entries.map((entry) => {
          const key = `${entry.timestamp}-${entry.question}`;
          const answered = entry.outcome === "answered";
          return (
            <article
              key={key}
              className={`flex items-start gap-3 px-6 py-3.5 transition-colors duration-700 ${
                key === freshKey ? "bg-navy-50" : "bg-white"
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  answered ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {answered ? "✓ Answered" : "✕ Refused"}
              </span>
              {answered && (
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-500">
                  <Lock size={10} />
                  proof
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm text-navy-800">{entry.question}</p>
                <p className="mt-0.5 text-xs text-navy-400">{meta(entry)}</p>
                <p className="mt-0.5 font-mono text-[11px] text-navy-300">
                  {shortHash(entry.subjectHash)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
