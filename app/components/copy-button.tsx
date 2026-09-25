"use client";

import { useState } from "react";

export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-600 transition hover:border-navy-400 hover:text-navy-800"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
