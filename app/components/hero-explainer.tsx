"use client";

import { useState } from "react";

function AgentIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" strokeWidth={2}>
      <rect x="10" y="16" width="28" height="22" rx="5" className="stroke-navy-700" />
      <path d="M24 8v8" className="stroke-navy-700" strokeLinecap="round" />
      <circle cx="24" cy="6" r="2.5" className="fill-navy-700" />
      <circle cx="18.5" cy="26" r="2.5" className="fill-navy-700" />
      <circle cx="29.5" cy="26" r="2.5" className="fill-navy-700" />
      <path d="M19 32h10" className="stroke-navy-500" strokeLinecap="round" />
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
        className="fill-emerald-400 stroke-navy-700"
        strokeLinejoin="round"
      />
      <path
        d="m17 24 5 5 9-10"
        className="stroke-navy-700"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" strokeWidth={1.6}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" className="stroke-navy-600" />
      <path d="M5.75 7V5a2.25 2.25 0 1 1 4.5 0v2" className="stroke-navy-600" />
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
        <p className="text-[11px] text-navy-500">{sub}</p>
      </div>
    </div>
  );
}

function Link({ label, lock = false }: { label: string; lock?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 pt-5">
      <span className="flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-navy-700">
        {lock && <LockIcon />}
        {label}
      </span>
      <svg
        viewBox="0 0 120 12"
        preserveAspectRatio="none"
        className="h-3 w-full stroke-navy-700"
        fill="none"
        strokeWidth={1}
      >
        <path d="M6 6h108" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d="M11 2 6 6l5 4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d="M109 2l5 4-5 4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export default function HeroExplainer() {
  const [withCustos, setWithCustos] = useState(false);

  return (
    <section className="panel px-8 py-6">
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
                      ? "bg-emerald-400 text-navy-900 shadow-sm"
                      : "bg-navy-700 text-white shadow-sm"
                    : "text-navy-500 hover:text-navy-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-navy-100 bg-teal-100 p-5">
          <div className="flex items-start gap-4">
            <Node icon={<AgentIcon />} label="AI agent" sub="housing-agent" />

            {withCustos ? (
              <>
                <Link label="Answer + proof" />
                <Node icon={<ShieldIcon />} label="Custos" sub="fact gateway" />
                <Link label="Record stays here" lock />
              </>
            ) : (
              <Link label="Full record" />
            )}

            <Node icon={<GovernmentIcon />} label="Government records" sub="resident registry" />
          </div>

          <p className="mt-5 text-sm text-navy-600">
            {withCustos
              ? "One question. One approved answer. The record stays put."
              : "One question. The full record sent to the model."}
          </p>
        </div>
      </div>
    </section>
  );
}
