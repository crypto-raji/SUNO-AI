"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Mode } from "@/lib/types/database";

const MODES: { value: Mode; label: string }[] = [
  { value: "general", label: "General chat" },
  { value: "student", label: "Student" },
  { value: "business", label: "Business" },
  { value: "creator", label: "Creator" },
  { value: "reading", label: "Reading" },
];

export default function SettingsForm({ initialDefaultMode }: { initialDefaultMode: Mode }) {
  const [defaultMode, setDefaultMode] = useState<Mode>(initialDefaultMode);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleChange(mode: Mode) {
    setDefaultMode(mode);
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ default_mode: mode }).eq("id", user.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-ink-900/60 p-5">
      <label className="mb-2 block text-sm text-paper-300">Default mode when you open Sona AI</label>
      <select
        value={defaultMode}
        onChange={(e) => handleChange(e.target.value as Mode)}
        className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-sm text-paper-100"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-paper-300/70">
        {saving ? "Saving…" : saved ? "Saved." : "Changes save automatically."}
      </p>
    </div>
  );
}
