"use client";

import { useState } from "react";

export default function TestConnectionButton({ provider }: { provider: "groq" | "assemblyai" }) {
  const [state, setState] = useState<"idle" | "testing" | "ok" | "failed">("idle");

  async function handleTest() {
    setState("testing");
    try {
      const res = await fetch("/api/admin/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setState(data.ok ? "ok" : "failed");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 4000);
  }

  return (
    <button
      onClick={handleTest}
      disabled={state === "testing"}
      className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs text-paper-100 hover:bg-ink-800"
    >
      {state === "idle" && "Test"}
      {state === "testing" && "Testing…"}
      {state === "ok" && "✓ Connected"}
      {state === "failed" && "✕ Failed"}
    </button>
  );
}
