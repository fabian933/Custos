import Link from "next/link";
import { MessageSquare, ShieldCheck, BadgeCheck } from "lucide-react";
import agents from "@/data/agents.json";
import { listResidentIds } from "@/lib/store";
import SiteHeader from "./components/site-header";
import HeroExplainer from "./components/hero-explainer";
import Demo from "./demo";
import type { Agent } from "@/lib/types";

const STEPS = [
  {
    icon: MessageSquare,
    title: "The agent asks",
    body: "Is this person eligible for a housing grant?",
  },
  {
    icon: ShieldCheck,
    title: "Custos checks",
    body:
      "Is this agent registered to an owner verified through UAE Pass? Is it allowed to ask this?",
  },
  {
    icon: BadgeCheck,
    title: "An answer with proof",
    body: "Yes or no, verifiable. The record never moves.",
  },
];

const NEXT = [
  "Zero-knowledge proofs for every check",
  "Live UAE Pass integration",
  "Deployment on sovereign cloud",
];

export default function Home() {
  return (
    <>
      <SiteHeader active="demo" />
      <main className="mx-auto max-w-[1400px] px-8 pb-20">
        <section id="hero" className="scroll-mt-24 pt-8">
          <HeroExplainer />
        </section>

        <section id="problem" className="scroll-mt-24 py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <p className="text-5xl font-semibold leading-tight tracking-tight text-navy-800">
              50% of UAE federal government operations will run on AI agents by 2028.
            </p>
            <div>
              <p className="section-eyebrow">The problem</p>
              <p className="text-lg text-navy-600">
                Every one of those agents will ask for citizen data. Today, they get the whole
                file.
              </p>
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 py-8">
          <p className="section-eyebrow">How it works</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="panel gap-3 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                  <step.icon size={20} />
                </span>
                <h3 className="text-base font-semibold text-navy-800">{step.title}</h3>
                <p className="text-sm text-navy-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="demo" className="scroll-mt-24 py-16">
          <p className="section-eyebrow">Live demo</p>
          <h2 className="section-title mb-6">Ask a question. Get one approved answer.</h2>
          <Demo agents={agents as Agent[]} residents={listResidentIds()} />
        </section>

        <section id="proof" className="scroll-mt-24 py-8">
          <div className="panel gap-4 p-8">
            <p className="section-eyebrow">The proof</p>
            <p className="max-w-3xl text-lg text-navy-700">
              Salary and age checks are proven with zero-knowledge proofs (Groth16). Anyone can
              verify the answer is true without seeing the salary or date of birth. Other checks
              are digitally signed.
            </p>
            <Link
              href="/verify"
              className="w-fit rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              Verify an answer
            </Link>
          </div>
        </section>

        <section id="next" className="scroll-mt-24 py-16">
          <p className="section-eyebrow">What&apos;s next</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {NEXT.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-navy-200/70 bg-cream-100 p-6 text-base font-medium text-navy-700"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
