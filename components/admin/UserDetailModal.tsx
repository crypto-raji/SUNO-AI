"use client";

import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  referral_code: string;
  referred_by: string | null;
  default_mode: string;
  is_admin: boolean;
  created_at: string;
}

interface UserDetailData {
  profile: UserProfile;
  stats: {
    sessionCount: number;
    documentCount: number;
    audioCount: number;
    referralCount: number;
  };
  recentSessions: Array<{ id: string; title: string; mode: string; updated_at: string }>;
  usageByService: Record<string, { tokens: number; characters: number; calls: number }>;
}

export default function UserDetailModal({
  userId,
  currentAdminId,
  onClose,
  onUserUpdated,
}: {
  userId: string;
  currentAdminId: string;
  onClose: () => void;
  onUserUpdated: () => void;
}) {
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
        } else {
          setActionError(json.error || "Failed to load user details");
        }
      } catch {
        setActionError("Network error loading user details");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [userId]);

  async function toggleAdminRole() {
    if (!data) return;
    const nextRole = !data.profile.is_admin;
    setSaving(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: nextRole }),
      });
      const json = await res.json();
      if (res.ok) {
        setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, is_admin: nextRole } } : null));
        onUserUpdated();
      } else {
        setActionError(json.error || "Failed to update role");
      }
    } catch {
      setActionError("Error updating role");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        onUserUpdated();
        onClose();
      } else {
        setActionError(json.error || "Failed to delete user");
        setSaving(false);
      }
    } catch {
      setActionError("Error deleting user");
      setSaving(false);
    }
  }

  const isSelf = userId === currentAdminId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg border border-line p-1.5 text-paper-300 hover:bg-ink-800 hover:text-paper-100"
        >
          ✕
        </button>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-paper-300 animate-pulse">Loading user profile & history…</p>
          </div>
        ) : !data ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-400">{actionError || "User not found"}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header / Identity */}
            <div className="flex items-start gap-4 border-b border-line pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-ink-950 font-display text-xl font-bold text-signal">
                {data.profile.username?.charAt(0).toUpperCase() || data.profile.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-display text-lg font-bold text-paper-100">
                    {data.profile.name || data.profile.username || "Anonymous"}
                  </h3>
                  {data.profile.is_admin && (
                    <span className="rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 text-[10px] font-semibold text-signal">
                      Admin
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-paper-300">{data.profile.email}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-paper-300/70">
                  <span>ID: <code className="font-mono text-paper-200">{data.profile.id.slice(0, 8)}…</code></span>
                  <span>·</span>
                  <span>Joined: {new Date(data.profile.created_at).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>Mode: <strong className="text-paper-200">{data.profile.default_mode}</strong></span>
                  <span>·</span>
                  <span>Code: <code className="font-mono text-signal">{data.profile.referral_code}</code></span>
                </div>
              </div>
            </div>

            {actionError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {actionError}
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-xl border border-line bg-ink-950/60 p-3 text-center">
                <p className="font-display text-lg font-bold text-paper-100">{data.stats.sessionCount}</p>
                <p className="text-[11px] text-paper-300/70">Sessions</p>
              </div>
              <div className="rounded-xl border border-line bg-ink-950/60 p-3 text-center">
                <p className="font-display text-lg font-bold text-paper-100">{data.stats.documentCount}</p>
                <p className="text-[11px] text-paper-300/70">Documents</p>
              </div>
              <div className="rounded-xl border border-line bg-ink-950/60 p-3 text-center">
                <p className="font-display text-lg font-bold text-paper-100">{data.stats.audioCount}</p>
                <p className="text-[11px] text-paper-300/70">Audio</p>
              </div>
              <div className="rounded-xl border border-line bg-ink-950/60 p-3 text-center">
                <p className="font-display text-lg font-bold text-paper-100">{data.stats.referralCount}</p>
                <p className="text-[11px] text-paper-300/70">Invites</p>
              </div>
            </div>

            {/* Usage by Service for this user */}
            <div className="rounded-xl border border-line bg-ink-950/50 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-paper-300">AI & Audio Metering</h4>
              {Object.keys(data.usageByService).length === 0 ? (
                <p className="mt-2 text-xs text-paper-300/60">No service consumption recorded for this user.</p>
              ) : (
                <div className="mt-3 space-y-2 text-xs">
                  {Object.entries(data.usageByService).map(([srv, usg]) => (
                    <div key={srv} className="flex items-center justify-between">
                      <span className="text-paper-200">{srv}</span>
                      <span className="font-mono text-paper-300/80">
                        {usg.calls} calls · {usg.tokens > 0 ? `${usg.tokens.toLocaleString()} tokens` : `${usg.characters.toLocaleString()} chars`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Conversations */}
            <div className="rounded-xl border border-line bg-ink-950/50 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-paper-300">Recent Sessions</h4>
              {data.recentSessions.length === 0 ? (
                <p className="mt-2 text-xs text-paper-300/60">No conversations created yet.</p>
              ) : (
                <div className="mt-2 divide-y divide-line text-xs">
                  {data.recentSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2">
                      <span className="truncate text-paper-100">{s.title}</span>
                      <span className="ml-2 shrink-0 text-[11px] text-paper-300/60">
                        {s.mode} · {new Date(s.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions & Role Management */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div>
                <button
                  onClick={toggleAdminRole}
                  disabled={saving || isSelf}
                  className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
                    data.profile.is_admin
                      ? "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                      : "border border-signal/30 bg-signal/10 text-signal hover:bg-signal/20"
                  } disabled:opacity-50`}
                >
                  {saving
                    ? "Updating…"
                    : data.profile.is_admin
                    ? "Demote (Remove Admin Role)"
                    : "Promote to Admin"}
                </button>
                {isSelf && (
                  <p className="mt-1 text-[10px] text-paper-300/60">You cannot modify your own admin role.</p>
                )}
              </div>

              {!isSelf && (
                <button
                  onClick={handleDeleteUser}
                  disabled={saving}
                  className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
                    confirmDelete
                      ? "bg-red-600 text-white font-bold"
                      : "border border-red-500/20 bg-transparent text-red-400 hover:bg-red-500/10"
                  } disabled:opacity-50`}
                >
                  {saving ? "Deleting…" : confirmDelete ? "Click again to confirm deletion" : "Delete Account"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
