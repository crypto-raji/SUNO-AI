"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isToday, isYesterday } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@/lib/types/database";

interface ProfileData {
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin?: boolean;
}

interface SidebarProps {
  user: {
    id: string;
    email?: string;
  };
  profile: ProfileData | null;
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

function groupSessions(sessions: Session[]) {
  const groups: Record<string, Session[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };
  for (const s of sessions) {
    const d = new Date(s.updated_at);
    if (isToday(d)) groups["Today"].push(s);
    else if (isYesterday(d)) groups["Yesterday"].push(s);
    else if (Date.now() - d.getTime() < 7 * 86400000) groups["Previous 7 days"].push(s);
    else groups["Older"].push(s);
  }
  return groups;
}

export default function Sidebar({
  user,
  profile,
  isOpen,
  onToggle,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSessionId = searchParams.get("session");
  const router = useRouter();

  const displayName =
    profile?.name || profile?.username || user.email?.split("@")[0] || "User";

  // Fetch conversations
  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setSessions((data ?? []) as Session[]);
        setLoading(false);
      });

    function handleSessionCreated(e: any) {
      if (e.detail?.session) {
        setSessions((prev) => [e.detail.session, ...prev.filter((s) => s.id !== e.detail.session.id)]);
      }
    }

    window.addEventListener("sona:session-created", handleSessionCreated);
    return () => window.removeEventListener("sona:session-created", handleSessionCreated);
  }, [user.id, pathname, currentSessionId]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  async function handleDeleteSession(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/sessions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (currentSessionId === id) {
          router.push("/app");
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const groups = groupSessions(sessions);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-ink-950 text-paper-100">
      {/* Top Header & New Chat Button */}
      <div className="p-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <Link
            href="/app"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
          >
            <Image src="/logo.png" alt="Sona AI" width={24} height={24} className="rounded-md" />
            <span className="font-display text-base font-semibold tracking-tight text-paper-100">
              Sona AI
            </span>
          </Link>

          {/* Desktop Collapse Button */}
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-paper-300 transition-colors hover:bg-ink-800 hover:text-paper-100 md:flex"
            title="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
              <path d="m14 9-3 3 3 3" />
            </svg>
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            aria-label="Close sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-paper-300 transition-colors hover:bg-ink-800 hover:text-paper-100 md:hidden"
          >
            ✕
          </button>
        </div>

        {/* New Chat Button */}
        <Link
          href="/app"
          onClick={onMobileClose}
          className="group flex w-full items-center justify-between rounded-xl border border-line bg-ink-900/90 px-3.5 py-2.5 text-sm font-medium text-paper-100 shadow-sm transition-all hover:border-signal/40 hover:bg-ink-800"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-signal/15 text-signal transition-transform group-hover:scale-110">
              +
            </span>
            <span>New chat</span>
          </div>
          <span className="text-xs text-paper-300/60">⌘K</span>
        </Link>
      </div>

      {/* Grouped Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        {loading && sessions.length === 0 && (
          <div className="space-y-2 py-4 px-2">
            <div className="h-4 w-20 rounded bg-ink-800 animate-pulse" />
            <div className="h-8 w-full rounded-lg bg-ink-900 animate-pulse" />
            <div className="h-8 w-full rounded-lg bg-ink-900 animate-pulse" />
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="px-2 py-8 text-center text-xs text-paper-300/70">
            <p>No conversation history yet.</p>
            <p className="mt-1">Start chatting to see your sessions here.</p>
          </div>
        )}

        {Object.entries(groups).map(
          ([label, items]) =>
            items.length > 0 && (
              <div key={label} className="mb-4">
                <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-paper-300/60">
                  {label}
                </p>
                <div className="space-y-0.5">
                  {items.map((s) => {
                    const isActive = currentSessionId === s.id;
                    return (
                      <div
                        key={s.id}
                        className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-ink-800 text-paper-100 font-medium"
                            : "text-paper-200 hover:bg-ink-900 hover:text-paper-100"
                        }`}
                      >
                        <Link
                          href={`/app?session=${s.id}`}
                          onClick={onMobileClose}
                          className="flex-1 truncate pr-2 text-left"
                          title={s.title}
                        >
                          {s.title}
                        </Link>

                        {/* Delete Session Action Button */}
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          disabled={deletingId === s.id}
                          aria-label="Delete conversation"
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded hover:bg-ink-700 text-paper-300 hover:text-red-400"
                          title="Delete chat"
                        >
                          {deletingId === s.id ? (
                            <span className="text-[10px]">…</span>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
        )}
      </div>

      {/* Modes Navigation */}
      <div className="border-t border-line/60 p-2 space-y-0.5">
        <Link
          href="/app/student"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-paper-300 hover:bg-ink-900 hover:text-paper-100 transition-colors"
        >
          <span>🎓</span>
          <span>Student Mode</span>
        </Link>
        <Link
          href="/app/business"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-paper-300 hover:bg-ink-900 hover:text-paper-100 transition-colors"
        >
          <span>💼</span>
          <span>Business Mode</span>
        </Link>
        <Link
          href="/app/creator"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-paper-300 hover:bg-ink-900 hover:text-paper-100 transition-colors"
        >
          <span>🎙️</span>
          <span>Creator Mode</span>
        </Link>
        <Link
          href="/app/reading"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-paper-300 hover:bg-ink-900 hover:text-paper-100 transition-colors"
        >
          <span>📖</span>
          <span>Reading Mode</span>
        </Link>
      </div>

      {/* Footer Profile Pill & Popover Menu */}
      <div className="relative border-t border-line p-3" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-line bg-ink-900 p-1.5 shadow-2xl backdrop-blur-glass z-30 space-y-0.5">
            <Link
              href="/profile"
              onClick={() => {
                setMenuOpen(false);
                onMobileClose();
              }}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-paper-200 hover:bg-ink-800 hover:text-paper-100 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Profile</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => {
                setMenuOpen(false);
                onMobileClose();
              }}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-paper-200 hover:bg-ink-800 hover:text-paper-100 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings</span>
            </Link>

            {profile?.is_admin && (
              <Link
                href="/admin"
                onClick={() => {
                  setMenuOpen(false);
                  onMobileClose();
                }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-signal hover:bg-ink-800 transition-colors"
              >
                <span>🛡️</span>
                <span>Admin Dashboard</span>
              </Link>
            )}

            <div className="my-1 border-t border-line/60" />

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-ink-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        )}

        {/* Profile Pill Trigger Button */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl p-1.5 text-left transition-colors hover:bg-ink-900"
          aria-label="User menu"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-line bg-ink-800">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-medium text-paper-300">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-paper-100">{displayName}</p>
              <p className="truncate text-[11px] text-paper-300/70">{user.email}</p>
            </div>
          </div>
          <span className="text-paper-300 text-xs">•••</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Docked Sidebar */}
      <aside
        className={`hidden md:flex h-screen flex-col border-r border-line transition-all duration-300 ease-in-out shrink-0 overflow-hidden z-20 ${
          isOpen ? "w-64 lg:w-72 opacity-100" : "w-0 -translate-x-full border-none opacity-0"
        }`}
      >
        <div className="w-64 lg:w-72 h-full">{sidebarContent}</div>
      </aside>

      {/* 2. Mobile Slide-over Drawer & Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />

          {/* Drawer Panel */}
          <aside className="relative z-50 flex w-full max-w-xs flex-col border-r border-line bg-ink-950 shadow-2xl transition-transform">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
