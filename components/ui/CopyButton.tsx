"use client";

import { useState } from "react";

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail without permissions/HTTPS — fail quietly, no crash.
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-lg border border-line px-3 py-2 text-xs text-paper-100 hover:bg-ink-800"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
