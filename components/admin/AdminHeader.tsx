"use client";

export type AdminTab = "overview" | "users" | "content" | "diagnostics" | "audit";

interface AdminHeaderProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  maintenanceMode: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function AdminHeader({
  currentTab,
  onSelectTab,
  maintenanceMode,
  onRefresh,
  isRefreshing,
}: AdminHeaderProps) {
  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users & Roles", icon: "👥" },
    { id: "content", label: "Content & Processing", icon: "⚡" },
    { id: "diagnostics", label: "API & Diagnostics", icon: "🔌" },
    { id: "audit", label: "Audit Logs", icon: "📜" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-paper-100 sm:text-3xl">
              Admin Command Center
            </h1>
            {maintenanceMode ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Maintenance Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                System Online
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-paper-300/70 sm:text-sm">
            Real-time analytics, user moderation, processing pipelines, and system configuration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-ink-900/80 px-3.5 py-2 text-xs font-medium text-paper-200 backdrop-blur transition hover:border-paper-300/30 hover:bg-ink-800 disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-signal" : "text-paper-300"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex space-x-1 overflow-x-auto rounded-2xl border border-line bg-ink-900/70 p-1.5 backdrop-blur-glass scrollbar-none">
        {tabs.map((tab) => {
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition sm:text-sm ${
                active
                  ? "bg-signal text-ink-950 font-semibold shadow-sm"
                  : "text-paper-300/80 hover:bg-ink-800/80 hover:text-paper-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
