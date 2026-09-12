"use client";

import { useState } from "react";

export default function MaintenanceToggle({
  initialEnabled,
  initialMessage,
}: {
  initialEnabled: boolean;
  initialMessage: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState(initialMessage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(nextEnabled: boolean) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: nextEnabled, message }),
    });
    if (!res.ok) {
      setError("Couldn't update maintenance mode. Please try again.");
      setSaving(false);
      return;
    }
    setEnabled(nextEnabled);
    setSaving(false);
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-paper-100">{enabled ? "Enabled" : "Disabled"}</span>
        <button
          onClick={() => save(!enabled)}
          disabled={saving}
          className={`rounded-full px-4 py-2 text-sm ${
            enabled ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {saving ? "Saving…" : enabled ? "Disable maintenance mode" : "Enable maintenance mode"}
        </button>
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onBlur={() => save(enabled)}
        placeholder="Sona AI is currently under maintenance. We're working on improvements and will be back shortly."
        rows={2}
        className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-sm text-paper-100"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
