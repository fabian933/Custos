"use client";

import { useState } from "react";

interface VerifyResult {
  valid: boolean;
  reason: string;
}

export default function Verifier() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function verify(receiptText: string) {
    setPending(true);
    setError("");
    setResult(null);
    let receipt: unknown;
    try {
      receipt = JSON.parse(receiptText);
    } catch {
      setError("That is not valid JSON. Paste the receipt object from the demo.");
      setPending(false);
      return;
    }
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ receipt }),
      });
      setResult((await response.json()) as VerifyResult);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setPending(false);
    }
  }

  /** Flips the first claim so the signature no longer matches, then re-verifies. */
  function tamper() {
    let receipt: { claims?: { result?: boolean }[] };
    try {
      receipt = JSON.parse(text);
    } catch {
      setError("Paste a receipt first — this button edits the JSON above.");
      return;
    }
    if (!Array.isArray(receipt.claims) || receipt.claims.length === 0) {
      setError("That receipt has no claims to flip.");
      return;
    }
    receipt.claims[0].result = !receipt.claims[0].result;
    const tampered = JSON.stringify(receipt, null, 2);
    setText(tampered);
    verify(tampered);
  }

  return (
    <div className="space-y-5">
      <label>
        <span className="field-label">Receipt JSON</span>
        <textarea
          className="field min-h-[320px] font-mono text-[12px] leading-relaxed"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{"claims":[…],"subjectHash":"…","signature":"…"}'
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => verify(text)}
          disabled={pending}
          className="rounded-lg bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-50"
        >
          {pending ? "Verifying…" : "Verify"}
        </button>
        <button
          type="button"
          onClick={tamper}
          className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          Tamper with it
        </button>
        <span className="text-xs text-navy-400">
          Flips the first result and re-verifies — the signature should fail.
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {result && (
        <div
          className={`rounded-xl border px-6 py-5 ${
            result.valid
              ? "border-emerald-300 bg-emerald-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <p
            className={`text-4xl font-semibold tracking-tight ${
              result.valid ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {result.valid ? "VALID" : "INVALID"}
          </p>
          <p className={`mt-2 text-sm ${result.valid ? "text-emerald-800" : "text-red-800"}`}>
            {result.reason}
          </p>
        </div>
      )}
    </div>
  );
}
