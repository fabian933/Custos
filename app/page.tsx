import agents from "@/data/agents.json";
import { listResidentIds } from "@/lib/store";
import Console from "./console";
import type { Agent } from "@/lib/types";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Custos</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        A fact gateway for government AI agents. Agents ask a question about a resident and get
        back a signed yes/no fact. The underlying record never leaves the ministry.
      </p>
      <Console agents={agents as Agent[]} residents={listResidentIds()} />
    </main>
  );
}
