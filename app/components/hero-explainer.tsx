"use client";

import { useState } from "react";

const RECORD_FIELDS = [
  "Emirates ID",
  "Full name",
  "Date of birth",
  "Salary",
  "Visa status",
  "Clearance",
  "Insurance",
  "Medical cover",
];

const QUESTION = "Eligible for housing grant?";

function AgentIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" strokeWidth={2}>
      <rect x="10" y="16" width="28" height="22" rx="5" className="stroke-navy-700" />
      <path d="M24 8v8" className="stroke-navy-700" strokeLinecap="round" />
      <circle cx="24" cy="6" r="2.5" className="fill-navy-700" />
      <circle cx="18.5" cy="26" r="2.5" className="fill-teal-500" />
      <circle cx="29.5" cy="26" r="2.5" className="fill-teal-500" />
      <path d="M19 32h10" className="stroke-navy-400" strokeLinecap="round" />
    </svg>
  );
}

function GovernmentIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" strokeWidth={2}>
      <path d="M6 18 24 8l18 10" className="stroke-navy-700" strokeLinejoin="round" />
      <path d="M11 18v16M19 18v16M29 18v16M37 18v16" className="stroke-navy-700" />
      <path d="M6 38h36" className="stroke-navy-700" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" strokeWidth={2}>
      <path
        d="M24 5 40 11v14c0 9-7 15.5-16 18-9-2.5-16-9-16-18V11L24 5Z"
        className="fill-teal-50 stroke-teal-600"
        strokeLinejoin="round"
      />
      <path d="m17 24 5 5 9-10" className="stroke-teal-600" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" strokeWidth={1.6}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" className="stroke-navy-400" />
      <path d="M5.75 7V5a2.25 2.25 0 1 1 4.5 0v2" className="stroke-navy-400" />
    </svg>
  );
}

function Node({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex w-32 shrink-0 flex-col items-center gap-2 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-navy-200 bg-white shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-navy-800">{label}</p>
        <p className="text-[11px] text-navy-400">{sub}</p>
      </div>
    </div>
  );
}

function Flow({ label, tone }: { label: string; tone: "question" | "leak" | "fact" }) {
  const colour =
    tone === "leak" ? "bg-red-400" : tone === "fact" ? "bg-teal-500" : "bg-navy-300";
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <span className="text-[11px] font-medium text-navy-500">{label}</span>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
        <span className={`absolute inset-y-0 w-1/3 animate-flow-out rounded-full ${colour}`} />
      </div>
    </div>
  );
}

export default function HeroExplainer() {
  const [withCustos, setWithCustos] = useState(false);

  return (
    <section className="panel mb-6 px-8 py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr] lg:gap-10">
        <div className="flex flex-col justify-center gap-3">
          <h1 className="text-2xl font-semibold leading-snug tracking-tight text-navy-900">
            AI agents need answers, not your sensitive data.
          </h1>
          <p className="text-base text-navy-500">
            Custos sits between AI and government records. Agents get only the answer
            they&apos;re allowed. The record never moves.
          </p>
          <div className="inline-flex w-fit rounded-full border border-navy-200 bg-navy-50 p-1">
            {[
              { on: false, label: "Without Custos" },
              { on: true, label: "With Custos" },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setWithCustos(option.on)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  withCustos === option.on
                    ? option.on
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-red-600 text-white shadow-sm"
                    : "text-navy-500 hover:text-navy-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div
          key={withCustos ? "with" : "without"}
          className="animate-chip-in rounded-xl border border-navy-100 bg-navy-50/60 p-5"
        >
          <div className="flex items-start gap-4">
            <Node icon={<AgentIcon />} label="AI agent" sub="housing-agent" />

            {withCustos ? (
              <>
                <div className="flex min-w-0 flex-1 flex-col gap-3 pt-4">
                  <Flow label={QUESTION} tone="question" />
                </div>
                <Node icon={<ShieldIcon />} label="Custos" sub="fact gateway" />
                <div className="flex min-w-0 flex-1 flex-col gap-3 pt-4">
                  <Flow label="one signed answer" tone="fact" />
                </div>
              </>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col gap-3 pt-4">
                <Flow label={QUESTION} tone="question" />
                <Flow label="the whole record comes back" tone="leak" />
              </div>
            )}

            <Node icon={<GovernmentIcon />} label="Government records" sub="resident registry" />
          </div>

          <div className="mt-5">
            {withCustos ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr]">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                    Returned to the agent
                  </p>
                  <div className="animate-chip-in rounded-lg border border-teal-300 bg-teal-50 px-4 py-3">
                    <p className="text-sm font-semibold text-teal-800">Eligible: YES ✓</p>
                    <p className="mt-0.5 text-xs text-teal-700">+ signed answer</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                    Stays in government systems
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {RECORD_FIELDS.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 rounded-full border border-navy-200 bg-navy-100 px-2.5 py-1 text-[11px] font-medium text-navy-400 transition"
                      >
                        <LockIcon />
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                  Sent to the model
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {RECORD_FIELDS.map((field, i) => (
                    <span
                      key={field}
                      style={{ animationDelay: `${i * 45}ms` }}
                      className="animate-chip-in rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-4 text-sm text-navy-500">
              {withCustos
                ? "One question. One approved answer. The record stays put."
                : "One question. The full record sent to the model."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
