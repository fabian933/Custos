import { NextResponse } from "next/server";
import { answerQuery } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let result;
  try {
    result = answerQuery(request.headers.get("x-api-key"), {
      emiratesId: typeof body.emiratesId === "string" ? body.emiratesId : undefined,
      predicate: body.predicate as never,
      value: body.value as string | number | undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.fact);
}
