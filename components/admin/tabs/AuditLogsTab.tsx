"use client";

import { useEffect, useState, useCallback } from "react";

interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_BADGES: Record<string, { label: string; color: string }> = {
  update_user_role: { label: "User Role Modified", color: "border-signal/30 bg-signal/10 text-signal" },
  toggle_maintenance: { label: "Maintenance Toggle", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  delete_user: { label: "User Deleted", color: "border-red-500/30 bg-red-500/10 text-red-300" },
  delete_content: { label: "Content Deleted", color: "border-red-500/30 bg-red-500/10 text-red-300" },
  retry_job: { label: "Pipeline Job Retried", color: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
};

export default function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs?limit=50");
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-ink-900/60 p-6 backdrop-blur-glass">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-paper-100">Administrative Audit Trail</h3>
            <p className="text-xs text-paper-300/70">
              Tamper-evident record of administrative changes, security modifications, and moderation actions.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="rounded-lg border border-line bg-ink-950 px-2.5 py-1 text-xs text-paper-200 hover:bg-ink-800"
          >
            Refresh Log
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <p className="text-sm text-paper-300 animate-pulse">Loading audit trail…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-paper-300/70">No administrative actions recorded yet.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {logs.map((log) => {
              const badge = ACTION_BADGES[log.action] ?? {
                label: log.action,
                color: "border-line bg-ink-950 text-paper-300",
              };
              return (
                <div key={log.id} className="py-3.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="font-medium text-paper-100">{log.adminName}</span>
                      {log.targetId && (
                        <span className="text-[11px] text-paper-300/60 font-mono">
                          Target: {log.targetId.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-paper-300/60 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-2 rounded-lg border border-line bg-ink-950/70 p-2 text-[11px] font-mono text-paper-300">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
