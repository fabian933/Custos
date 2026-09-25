import { NextResponse } from "next/server";
import { listAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const entries = listAudit();
  return NextResponse.json({ count: entries.length, entries });
}
