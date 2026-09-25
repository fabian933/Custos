"use client";

import { useState } from "react";
import AuditPanel from "./components/audit-panel";
import GatewayPanel from "./components/gateway-panel";
import WithoutCustos from "./components/without-custos";
import type { Agent } from "@/lib/types";

interface Props {
  agents: Agent[];
  residents: { emiratesId: string; fullName: string }[];
}

export default function Demo({ agents, residents }: Props) {
  const [agentId, setAgentId] = useState(agents[0].id);
  const [emiratesId, setEmiratesId] = useState(residents[0].emiratesId);
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <WithoutCustos emiratesId={emiratesId} />
      <GatewayPanel
        agents={agents}
        residents={residents}
        agentId={agentId}
        onAgentChange={setAgentId}
        emiratesId={emiratesId}
        onResidentChange={setEmiratesId}
        onAnswered={() => setRefreshToken((token) => token + 1)}
      />
      <AuditPanel refreshToken={refreshToken} />
    </div>
  );
}
