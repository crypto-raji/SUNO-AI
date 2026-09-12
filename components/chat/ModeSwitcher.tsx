"use client";

import type { Mode } from "@/lib/types/database";

const MODES: { id: Mode; label: string }[] = [
  { id: "general", label: "General" },
  { id: "student", label: "Student" },
  { id: "business", label: "Business" },
  { id: "creator", label: "Creator" },
  { id: "reading", label: "Reading" },
];

export default function ModeSwitcher({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs sm:text-sm font-medium transition-all ${
            mode === m.id
              ? "bg-signal text-ink-950 shadow-sm font-semibold"
              : "border border-line/70 bg-ink-900/40 text-paper-300 hover:text-paper-100 hover:bg-ink-800/60"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
