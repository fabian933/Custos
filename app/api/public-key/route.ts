import { NextResponse } from "next/server";
import { getPublicKeyBase64, getPublicKeyPem } from "@/lib/signing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      algorithm: "Ed25519",
      format: "spki-der-base64",
      publicKey: getPublicKeyBase64(),
      publicKeyPem: getPublicKeyPem(),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
