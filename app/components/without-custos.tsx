"use client";

import { useEffect, useState } from "react";

/** Fields that identify a person and should never reach an agent's context. */
const PERSONAL_FIELDS = ["emiratesId", "fullName", "dob", "salaryAED"];

function RecordJson({ json }: { json: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-navy-900 p-4 font-mono text-[11px] leading-relaxed text-navy-100">
      {json.split("\n").map((line, i) => {
        const key = line.trim().match(/^"([^"]+)":/)?.[1];
        const personal = key !== undefined && PERSONAL_FIELDS.includes(key);
        return (
          <div
            key={i}
            className={
              personal
                ? "-mx-1 rounded bg-red-500/20 px-1 font-semibold text-red-300"
                : undefined
            }
          >
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}

export default function WithoutCustos({ emiratesId }: { emiratesId: string }) {
  const [json, setJson] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    fetch(`/api/legacy-record?emiratesId=${encodeURIComponent(emiratesId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setJson(JSON.stringify(data, null, 2));
      })
      .catch((cause) => {
        if (!cancelled) setError(String(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [emiratesId]);

  return (
    <section className="panel">
      <header className="panel-head">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <h2 className="panel-title">Without Custos</h2>
        </div>
        <p className="mt-2 text-sm text-navy-500">
          The agent calls the ministry directly and gets the whole record back.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="font-mono text-[11px] text-navy-500">
          GET /api/legacy-record?emiratesId={emiratesId}
        </p>
        <p className="text-xs font-medium text-navy-600">
          What lands in the model&apos;s context and in the logs:
        </p>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <RecordJson json={json} />
        )}
        <p className="mt-auto rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Everything the agent asked for, and everything it didn&apos;t.
        </p>
      </div>
    </section>
  );
}
