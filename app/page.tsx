import agents from "@/data/agents.json";
import { listResidentIds } from "@/lib/store";
import SiteHeader from "./components/site-header";
import Demo from "./demo";
import type { Agent } from "@/lib/types";

export default function Home() {
  return (
    <>
      <SiteHeader active="demo" />
      <main className="mx-auto max-w-[1400px] px-8 py-10">
        <Demo agents={agents as Agent[]} residents={listResidentIds()} />
      </main>
    </>
  );
}
