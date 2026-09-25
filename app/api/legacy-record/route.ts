import { NextResponse } from "next/server";
import { findResident } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The "without Custos" strawman: a naive ministry endpoint that hands the whole record to
 * whoever asks. Exists purely so the demo can show what lands in an agent's context.
 */
export async function GET(request: Request) {
  const emiratesId = new URL(request.url).searchParams.get("emiratesId") ?? "";
  const resident = findResident(emiratesId);
  if (!resident) {
    return NextResponse.json({ error: "no record for that Emirates ID" }, { status: 404 });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { salarySalt, dobSalt, ...record } = resident;
  return NextResponse.json(record);
}
