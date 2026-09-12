"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isToday, isYesterday, format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@/lib/types/database";

function groupSessions(sessions: Session[]) {
  const groups: Record<string, Session[]> = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };
  for (const s of sessions) {
    const d = new Date(s.updated_at);
    if (isToday(d)) groups["Today"].push(s);
    else if (isYesterday(d)) groups["Yesterday"].push(s);
    else if (Date.now() - d.getTime() < 7 * 86400000) groups["Previous 7 days"].push(s);
    else groups["Older"].push(s);
  }
  return groups;
}

export default function HistoryDrawer() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("sessions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setSessions((data ?? []) as Session[]);
        setLoading(false);
      });
  }, [open, pathname]);

  const groups = groupSessions(sessions);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open conversation history"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line hover:bg-ink-800"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-full max-w-xs overflow-y-auto border-r border-line bg-ink-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg">History</h2>
              <button onClick={() => setOpen(false)} className="text-paper-300 hover:text-paper-100" aria-label="Close">
                ✕
              </button>
            </div>

            {loading && <p className="text-sm text-paper-300">Loading…</p>}

            {!loading && sessions.length === 0 && (
              <p className="text-sm text-paper-300">No conversations yet. Start typing to begin one.</p>
            )}

            {Object.entries(groups).map(
              ([label, items]) =>
                items.length > 0 && (
                  <div key={label} className="mb-5">
                    <p className="mb-2 text-xs uppercase tracking-wide text-paper-300/70">{label}</p>
                    <ul className="space-y-1">
                      {items.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={`/app?session=${s.id}`}
                            onClick={() => setOpen(false)}
                            className="block truncate rounded-lg px-2 py-2 text-sm text-paper-100 hover:bg-ink-800"
                          >
                            {s.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )}
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
