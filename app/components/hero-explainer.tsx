"use client";

import { useState } from "react";
import { Bot, ChevronLeft, ChevronRight, Landmark, Lock, ShieldCheck } from "lucide-react";

const RECORD_FIELDS = [
  "Emirates ID",
  "Full name",
  "Date of birth",
  "Salary",
  "Visa status",
  "Clearance",
  "Medical cover",
];

const QUESTION = "Eligible for housing grant?";

function Node({
  icon,
  label,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border bg-white shadow-sm ${
          accent ? "border-teal-300 text-teal-600" : "border-navy-200 text-navy-700"
        }`}
      >
        {icon}
      </div>
      <p className="text-[11px] font-semibold text-navy-700">{label}</p>
    </div>
  );
}

function Arrows({
  label,
  tone,
  direction,
}: {
  label: string;
  tone: "navy" | "red" | "teal";
  direction: "right" | "left";
}) {
  const colour =
    tone === "red" ? "text-red-400" : tone === "teal" ? "text-teal-500" : "text-navy-300";
  const labelColour =
    tone === "red" ? "text-red-600" : tone === "teal" ? "text-teal-700" : "text-navy-500";
  const Chevron = direction === "right" ? ChevronRight : ChevronLeft;
  const chevrons = [0, 1, 2];

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className={`text-[11px] font-medium ${labelColour}`}>{label || "\u00a0"}</span>
      <div
        className={`flex w-full items-center ${
          direction === "right" ? "justify-start" : "flex-row-reverse justify-start"
        } ${colour}`}
      >
        <span className="h-px flex-1 bg-current opacity-30" />
        {chevrons.map((i) => (
          <Chevron
            key={i}
            size={14}
            strokeWidth={3}
            className="animate-pulse-chevron"
            style={{
              animationDelay: `${(direction === "right" ? i : chevrons.length - 1 - i) * 220}ms`,
            }}
          />
        ))}
        <span className="h-px flex-1 bg-current opacity-30" />
      </div>
    </div>
  );
}

function FieldStack({ withCustos }: { withCustos: boolean }) {
  return (
    <div className="w-44 shrink-0 overflow-hidden rounded-lg border border-navy-200 bg-white">
      {withCustos && (
        <div className="flex items-center gap-1.5 border-b border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700">
          Eligible ✓
        </div>
      )}
      {RECORD_FIELDS.map((field) => (
        <div
          key={field}
          className={`flex items-center gap-1.5 border-b border-navy-100 px-3 py-1.5 text-[11px] font-medium last:border-b-0 transition-colors duration-300 ${
            withCustos ? "bg-navy-50 text-navy-400" : "bg-red-50 text-red-700"
          }`}
        >
          {withCustos && <Lock size={11} />}
          {field}
        </div>
      ))}
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
          className="animate-chip-in rounded-xl border border-navy-100 bg-navy-50/60 px-6 py-5"
        >
          <div className="flex items-center gap-4">
            <Node icon={<Bot size={26} strokeWidth={1.8} />} label="AI agent" />
            <Arrows label={QUESTION} tone="navy" direction="right" />
            {withCustos && (
              <>
                <Node
                  icon={<ShieldCheck size={26} strokeWidth={1.8} />}
                  label="Custos"
                  accent
                />
                <Arrows label="" tone="navy" direction="right" />
              </>
            )}
            <div className="flex w-44 shrink-0 justify-center">
              <Node icon={<Landmark size={26} strokeWidth={1.8} />} label="Government records" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="w-24 shrink-0" />
            {withCustos ? (
              <>
                <Arrows label="Answer + proof" tone="teal" direction="left" />
                <div className="w-24 shrink-0" />
                <Arrows label="Answer" tone="teal" direction="left" />
              </>
            ) : (
              <Arrows label="Full record" tone="red" direction="left" />
            )}
            <FieldStack withCustos={withCustos} />
          </div>

          <p className="mt-6 text-sm text-navy-500">
            {withCustos
              ? "One question. One answer with proof. The record stays put."
              : "One question. The full record sent to the model."}
          </p>
        </div>
      </div>
    </section>
  );
}
