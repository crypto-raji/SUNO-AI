"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/chat/Sidebar";

interface ProfileData {
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin?: boolean;
}

interface AppClientShellProps {
  user: {
    id: string;
    email?: string;
  };
  profile: ProfileData | null;
  children: React.ReactNode;
}

export default function AppClientShell({ user, profile, children }: AppClientShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const displayName =
    profile?.name || profile?.username || user.email?.split("@")[0] || "User";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-950 text-paper-100">
      {/* Background Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-8%] right-[-6%] h-[46vw] w-[46vw] max-w-[560px] opacity-[0.04] select-none"
      >
        <Image src="/logo.png" alt="" fill className="object-contain" priority={false} />
      </div>

      {/* Collapsible Session History Sidebar */}
      <Sidebar
        user={user}
        profile={profile}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        isMobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden relative z-10">
        {/* Top Header Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-ink-950/80 px-3 sm:px-4 backdrop-blur-glass z-20">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-paper-200 hover:bg-ink-800 hover:text-paper-100 md:hidden transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
              </svg>
            </button>

            {/* Desktop Expand Sidebar Button (visible when sidebar is closed) */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg border border-line text-paper-300 hover:bg-ink-800 hover:text-paper-100 transition-colors"
                title="Open sidebar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="m11 9 3 3-3 3" />
                </svg>
              </button>
            )}

            {/* Logo and App Title */}
            <Link href="/app" className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={22} height={22} className="rounded-md" />
              <span className="font-display text-sm sm:text-base font-semibold tracking-tight">
                Sona AI
              </span>
            </Link>
          </div>

          {/* Right Header: Profile Badge */}
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-line/60 bg-ink-900/60 py-1 pl-2.5 pr-1.5 sm:py-1.5 sm:pl-3 sm:pr-2 hover:border-line hover:bg-ink-800 transition-colors"
            >
              <span className="hidden text-xs text-paper-200 sm:inline max-w-[140px] truncate">
                {displayName}
              </span>
              <div className="h-6 w-6 sm:h-7 sm:w-7 overflow-hidden rounded-full border border-line bg-ink-800 shrink-0">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] sm:text-xs text-paper-300 font-medium">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable Children Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
