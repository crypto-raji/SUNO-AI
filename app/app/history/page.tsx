"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isToday, isYesterday } from "date-fns";
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

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sessions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setSessions((data ?? []) as Session[]);
        setLoading(false);
      });
  }, []);

  const groups = groupSessions(sessions);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl text-paper-100">Your conversations</h1>

      {loading && <p className="mt-6 text-sm text-paper-300">Loading…</p>}

      {!loading && sessions.length === 0 && (
        <p className="mt-6 text-sm text-paper-300">
          No conversations yet.{" "}
          <Link href="/app" className="underline">
            Start one
          </Link>
          .
        </p>
      )}

      {Object.entries(groups).map(
        ([label, items]) =>
          items.length > 0 && (
            <div key={label} className="mt-8">
              <p className="mb-3 text-xs uppercase tracking-wide text-paper-300/70">{label}</p>
              <ul className="space-y-2">
                {items.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/app?session=${s.id}`}
                      className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm text-paper-100 hover:bg-ink-800"
                    >
                      <span className="truncate">{s.title}</span>
                      <span className="ml-3 shrink-0 text-xs capitalize text-paper-300/70">{s.mode}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
      )}
    </div>
  );
}
