import { NextResponse } from "next/server";
import { runQuery } from "@/lib/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ refused: true, reason: "invalid JSON body" }, { status: 400 });
  }

  let outcome;
  try {
    outcome = await runQuery(body.apiKey, body.emiratesId, body.question);
  } catch (error) {
    return NextResponse.json({ refused: true, reason: (error as Error).message }, { status: 500 });
  }

  if (!outcome.ok) {
    return NextResponse.json({ refused: true, reason: outcome.reason }, { status: outcome.status });
  }
  return NextResponse.json(outcome.response);
}
