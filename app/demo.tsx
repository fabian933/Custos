"use client";

import { useState } from "react";
import AuditPanel from "./components/audit-panel";
import GatewayPanel, { type Scenario } from "./components/gateway-panel";
import HeroExplainer from "./components/hero-explainer";
import type { Agent } from "@/lib/types";

interface Props {
  agents: Agent[];
  residents: { emiratesId: string; fullName: string }[];
}

export default function Demo({ agents, residents }: Props) {
  const [agentId, setAgentId] = useState(agents[0].id);
  const [emiratesId, setEmiratesId] = useState(residents[0].emiratesId);
  const [refreshToken, setRefreshToken] = useState(0);
  const [scenario, setScenario] = useState<(Scenario & { runToken: number }) | null>(null);

  function runScenario(next: Scenario) {
    setAgentId(next.agentId);
    setEmiratesId(residents[next.residentIndex].emiratesId);
    setScenario({ ...next, runToken: Date.now() });
  }

  async function reset() {
    await fetch("/api/audit", { method: "DELETE" });
    setScenario(null);
    setRefreshToken((token) => token + 1);
  }

  return (
    <>
      <HeroExplainer />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <GatewayPanel
          agents={agents}
          residents={residents}
          agentId={agentId}
          onAgentChange={setAgentId}
          emiratesId={emiratesId}
          onResidentChange={setEmiratesId}
          onAnswered={() => setRefreshToken((token) => token + 1)}
          onReset={reset}
          onRunScenario={runScenario}
          scenario={scenario}
        />
        <AuditPanel refreshToken={refreshToken} />
      </div>
    </>
  );
}
