"use client";

interface StatsData {
  metrics: {
    totalUsers: number;
    activeUsers7d: number;
    activeUsers30d: number;
    totalSessions: number;
    totalMessages: number;
    totalDocuments: number;
    totalAudioFiles: number;
    totalTokens: number;
    totalCharacters: number;
    totalApiCalls: number;
  };
  usageByService: Record<string, { characters: number; tokens: number; calls: number }>;
  modeDistribution: Record<string, number>;
  documentStatuses: Record<string, number>;
  audioStatuses: Record<string, number>;
  topReferrers: Array<{ id: string; name: string; count: number }>;
}

const SERVICE_INFO: Record<string, { name: string; tag: string; color: string }> = {
  ai_groq: { name: "Groq Cloud", tag: "LLM (Llama 3.3 70B)", color: "bg-signal" },
  stt_assemblyai: { name: "AssemblyAI", tag: "Speech-to-Text", color: "bg-blue-500" },
};

const MODE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  general: { label: "General Chat", icon: "💬", color: "bg-slate-400" },
  student: { label: "Student & Revision", icon: "🎓", color: "bg-purple-400" },
  business: { label: "Business & Financials", icon: "📊", color: "bg-blue-400" },
  creator: { label: "Creator & Scripts", icon: "🎙️", color: "bg-pink-400" },
  reading: { label: "Reading & Narrations", icon: "📖", color: "bg-emerald-400" },
};

export default function OverviewTab({ data }: { data: StatsData | null }) {
  if (!data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-paper-300 animate-pulse">Loading analytics overview…</p>
      </div>
    );
  }

  const { metrics, usageByService, modeDistribution, topReferrers } = data;

  const totalModeSessions = Object.values(modeDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        <KpiCard
          label="Total Registered Users"
          value={metrics.totalUsers.toLocaleString()}
          subtext={`${metrics.activeUsers7d.toLocaleString()} active (7d)`}
          icon="👥"
          badge="+Live"
          badgeColor="text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
        />
        <KpiCard
          label="Conversations"
          value={metrics.totalSessions.toLocaleString()}
          subtext={`${metrics.totalMessages.toLocaleString()} total messages`}
          icon="💬"
        />
        <KpiCard
          label="Documents Processed"
          value={metrics.totalDocuments.toLocaleString()}
          subtext={`${data.documentStatuses?.ready ?? 0} ready · ${data.documentStatuses?.failed ?? 0} failed`}
          icon="📄"
        />
        <KpiCard
          label="Audio Synthesized"
          value={metrics.totalAudioFiles.toLocaleString()}
          subtext={`${data.audioStatuses?.ready ?? 0} ready · ${data.audioStatuses?.failed ?? 0} failed`}
          icon="🎧"
        />
        <KpiCard
          label="Total AI Tokens Used"
          value={metrics.totalTokens.toLocaleString()}
          subtext="30-day LLM consumption"
          icon="🧠"
        />
        <KpiCard
          label="TTS Characters"
          value={metrics.totalCharacters.toLocaleString()}
          subtext="Synthesized voice audio"
          icon="🔊"
        />
        <KpiCard
          label="Total API Calls"
          value={metrics.totalApiCalls.toLocaleString()}
          subtext="Tracked microservice calls"
          icon="⚡"
        />
        <KpiCard
          label="Active Users (30d)"
          value={metrics.activeUsers30d.toLocaleString()}
          subtext={`${Math.round((metrics.activeUsers30d / (metrics.totalUsers || 1)) * 100)}% 30d retention rate`}
          icon="📈"
          badge="Monthly"
          badgeColor="text-signal border-signal/20 bg-signal/10"
        />
      </div>

      {/* Two Column Layout: Service Usage & Mode Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Service Usage Breakdown */}
        <div className="rounded-2xl border border-line bg-ink-900/60 p-6 backdrop-blur-glass">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-paper-100">Service Consumption</h2>
              <p className="text-xs text-paper-300/70">API volume & tokens over the last 30 days</p>
            </div>
            <span className="rounded-md border border-line bg-ink-950 px-2 py-1 text-[11px] font-mono text-paper-300">
              30 Days
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {Object.entries(usageByService).map(([serviceKey, usage]) => {
              const info = SERVICE_INFO[serviceKey] ?? {
                name: serviceKey,
                tag: "Service",
                color: "bg-signal",
              };
              return (
                <div key={serviceKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${info.color}`} />
                      <span className="font-medium text-paper-100">{info.name}</span>
                      <span className="text-[11px] text-paper-300/60">({info.tag})</span>
                    </div>
                    <span className="font-mono text-paper-200">
                      {usage.calls} calls
                      {usage.tokens > 0 && ` · ${usage.tokens.toLocaleString()} tokens`}
                      {usage.characters > 0 && ` · ${usage.characters.toLocaleString()} chars`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-950">
                    <div
                      className={`h-full ${info.color}`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, (usage.calls / (metrics.totalApiCalls || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mode Distribution */}
        <div className="rounded-2xl border border-line bg-ink-900/60 p-6 backdrop-blur-glass">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-paper-100">Assistant Modes Usage</h2>
              <p className="text-xs text-paper-300/70">Session creation distribution by persona</p>
            </div>
            <span className="rounded-md border border-line bg-ink-950 px-2 py-1 text-[11px] font-mono text-paper-300">
              {metrics.totalSessions} sessions
            </span>
          </div>

          <div className="mt-5 space-y-3.5">
            {Object.entries(modeDistribution).map(([modeKey, count]) => {
              const mode = MODE_LABELS[modeKey] ?? {
                label: modeKey,
                icon: "✨",
                color: "bg-signal",
              };
              const percentage = Math.round((count / totalModeSessions) * 100);
              return (
                <div key={modeKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span>{mode.icon}</span>
                      <span className="font-medium text-paper-100">{mode.label}</span>
                    </div>
                    <span className="font-mono text-paper-200">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-950">
                    <div className={`h-full ${mode.color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Referrals Leaderboard & System Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Referrers */}
        <div className="rounded-2xl border border-line bg-ink-900/60 p-6 backdrop-blur-glass">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-paper-100">Top Growth Champions</h2>
              <p className="text-xs text-paper-300/70">Highest performing referral invitations</p>
            </div>
            <span className="text-base">🏆</span>
          </div>

          {topReferrers.length === 0 ? (
            <p className="mt-4 text-xs text-paper-300/70">No referral invites claimed yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-line">
              {topReferrers.map((ref, idx) => (
                <div key={ref.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        idx === 0
                          ? "bg-amber-400 text-ink-950"
                          : idx === 1
                          ? "bg-slate-300 text-ink-950"
                          : idx === 2
                          ? "bg-amber-700 text-paper-100"
                          : "bg-ink-800 text-paper-300"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-medium text-paper-100">{ref.name}</span>
                  </div>
                  <span className="rounded-full border border-signal/20 bg-signal/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-signal">
                    {ref.count} referral{ref.count === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline Health Overview */}
        <div className="rounded-2xl border border-line bg-ink-900/60 p-6 backdrop-blur-glass">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-paper-100">Pipeline Quality Health</h2>
              <p className="text-xs text-paper-300/70">Processing success rates</p>
            </div>
            <span className="text-base">🛡️</span>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            <div className="rounded-xl border border-line bg-ink-950/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-paper-200">Document Processing</span>
                <span className="font-mono text-emerald-400">
                  {Math.round(
                    ((data.documentStatuses?.ready ?? 0) /
                      (metrics.totalDocuments || 1)) *
                      100
                  )}
                  % success
                </span>
              </div>
              <div className="mt-2 flex gap-4 text-[11px] text-paper-300/70">
                <span>✓ Ready: {data.documentStatuses?.ready ?? 0}</span>
                <span>⏳ Processing: {(data.documentStatuses?.extracting ?? 0) + (data.documentStatuses?.uploading ?? 0)}</span>
                <span className="text-red-400">✕ Failed: {data.documentStatuses?.failed ?? 0}</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-ink-950/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-paper-200">Audio Speech Synthesis</span>
                <span className="font-mono text-emerald-400">
                  {Math.round(
                    ((data.audioStatuses?.ready ?? 0) /
                      (metrics.totalAudioFiles || 1)) *
                      100
                  )}
                  % success
                </span>
              </div>
              <div className="mt-2 flex gap-4 text-[11px] text-paper-300/70">
                <span>✓ Ready: {data.audioStatuses?.ready ?? 0}</span>
                <span>⏳ Generating: {data.audioStatuses?.generating ?? 0}</span>
                <span className="text-red-400">✕ Failed: {data.audioStatuses?.failed ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtext,
  icon,
  badge,
  badgeColor,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-900/70 p-4 backdrop-blur-glass transition hover:border-paper-300/20">
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        {badge && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight text-paper-100">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-paper-200">{label}</p>
      <p className="mt-1 text-[11px] text-paper-300/60">{subtext}</p>
    </div>
  );
}
