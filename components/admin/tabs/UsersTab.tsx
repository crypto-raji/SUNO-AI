"use client";

import { useEffect, useState, useCallback } from "react";
import UserDetailModal from "@/components/admin/UserDetailModal";

interface EnrichedUser {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  referral_code: string;
  default_mode: string;
  is_admin: boolean;
  created_at: string;
  referralCount: number;
  usageTokens: number;
  usageCharacters: number;
}

export default function UsersTab({ currentAdminId }: { currentAdminId: string }) {
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        role: roleFilter,
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, username, or name…"
            className="w-full rounded-xl border border-line bg-ink-900/80 px-4 py-2.5 pl-10 text-xs text-paper-100 placeholder-paper-300/50 outline-none backdrop-blur focus:border-signal/50 sm:text-sm"
          />
          <span className="absolute left-3.5 top-3 text-xs text-paper-300/60">🔍</span>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-2.5 text-xs text-paper-300/60 hover:text-paper-100"
            >
              ✕
            </button>
          )}
        </form>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-line bg-ink-900/80 p-1 text-xs">
            <button
              onClick={() => {
                setRoleFilter("all");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 transition ${
                roleFilter === "all" ? "bg-ink-800 text-paper-100 font-semibold" : "text-paper-300/70"
              }`}
            >
              All ({total})
            </button>
            <button
              onClick={() => {
                setRoleFilter("admin");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 transition ${
                roleFilter === "admin" ? "bg-signal text-ink-950 font-semibold" : "text-paper-300/70"
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => {
                setRoleFilter("user");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 transition ${
                roleFilter === "user" ? "bg-ink-800 text-paper-100 font-semibold" : "text-paper-300/70"
              }`}
            >
              Standard
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-ink-900/60 backdrop-blur-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-ink-950/70 text-[11px] font-semibold uppercase tracking-wider text-paper-300/80">
              <tr>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Mode</th>
                <th className="px-4 py-3.5">Usage (Tokens/Chars)</th>
                <th className="px-4 py-3.5">Invites</th>
                <th className="px-4 py-3.5">Joined</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-paper-300 animate-pulse">
                    Loading users directory…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-paper-300/70">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-ink-800/40">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-ink-950 text-xs font-semibold text-paper-100">
                          {u.username?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-paper-100 truncate">
                            {u.username ? `@${u.username}` : u.name || "Anonymous"}
                          </p>
                          <p className="text-[11px] text-paper-300/70 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.is_admin ? (
                        <span className="inline-flex items-center rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 text-[10px] font-semibold text-signal">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-line bg-ink-950 px-2 py-0.5 text-[10px] text-paper-300">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 capitalize text-paper-200">{u.default_mode || "general"}</td>
                    <td className="px-4 py-3.5 font-mono text-paper-300">
                      {u.usageTokens > 0
                        ? `${u.usageTokens.toLocaleString()} tok`
                        : u.usageCharacters > 0
                        ? `${u.usageCharacters.toLocaleString()} chr`
                        : "0"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-paper-200">
                      {u.referralCount > 0 ? (
                        <span className="text-signal font-semibold">{u.referralCount}</span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-paper-300/70">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className="rounded-lg border border-line bg-ink-950/80 px-2.5 py-1 text-[11px] font-medium text-paper-200 transition hover:border-signal/40 hover:bg-ink-800"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-paper-300/80">
          <span>
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total users)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-line px-3 py-1 text-xs text-paper-200 hover:bg-ink-800 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-line px-3 py-1 text-xs text-paper-200 hover:bg-ink-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Inspect/Edit Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          currentAdminId={currentAdminId}
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
