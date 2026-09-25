import { NextResponse } from "next/server";
import { verifyReceipt } from "@/lib/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "invalid JSON body" }, { status: 400 });
  }

  const result = verifyReceipt(body.receipt);
  return NextResponse.json(result, { status: result.valid ? 200 : 400 });
}
