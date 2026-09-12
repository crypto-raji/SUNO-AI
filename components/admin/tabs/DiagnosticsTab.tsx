"use client";

import MaintenanceToggle from "@/components/admin/MaintenanceToggle";
import TestConnectionButton from "@/components/admin/TestConnectionButton";

interface ApiKeyStatus {
  name: string;
  provider: "groq" | "assemblyai" | null;
  configured: boolean;
  hint: string;
  description: string;
}

export default function DiagnosticsTab({
  keys,
  maintenanceMode,
  maintenanceMessage,
}: {
  keys: Record<string, { configured: boolean; hint: string; provider: "groq" | "assemblyai" | null }>;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}) {
  const providerList: ApiKeyStatus[] = [
    {
      name: "Groq Cloud API",
      provider: "groq",
      configured: keys["Groq"]?.configured ?? false,
      hint: keys["Groq"]?.hint ?? "not set",
      description: "Ultra-fast LLM inference for chat, analysis, and personas (Llama 3.3 70B)",
    },
    {
      name: "AssemblyAI Speech-to-Text",
      provider: "assemblyai",
      configured: keys["AssemblyAI"]?.configured ?? false,
      hint: keys["AssemblyAI"]?.hint ?? "not set",
      description: "Voice input & audio transcription pipeline",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Maintenance Mode Controller */}
      <div className="rounded-2xl border border-line bg-ink-900/60 p-6 backdrop-blur-glass">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-paper-100">Maintenance Mode & Broadcast</h3>
            <p className="text-xs text-paper-300/70">
              When active, users can access the homepage but AI chat, document uploads, and audio generation are blocked server-side.
            </p>
          </div>
          <span className="text-lg">🛠️</span>
        </div>

        <MaintenanceToggle initialEnabled={maintenanceMode} initialMessage={maintenanceMessage} />
      </div>

      {/* API Integrations & Diagnostics */}
      <div className="rounded-2xl border border-line bg-ink-900/60 p-6 backdrop-blur-glass">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-paper-100">API Credentials & Provider Health</h3>
            <p className="text-xs text-paper-300/70">
              API secrets are masked for security. Click &quot;Test&quot; to perform an end-to-end diagnostic roundtrip.
            </p>
          </div>
          <span className="text-lg">🔌</span>
        </div>

        <div className="mt-4 divide-y divide-line">
          {providerList.map((p) => (
            <div key={p.name} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-paper-100 text-xs sm:text-sm">{p.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      p.configured
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border border-line bg-ink-950 text-paper-300/60"
                    }`}
                  >
                    {p.configured ? `Configured (${p.hint})` : "Not Configured"}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-paper-300/70">{p.description}</p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {p.configured && p.provider && <TestConnectionButton provider={p.provider} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Environment Summary */}
      <div className="rounded-2xl border border-line bg-ink-900/60 p-6 backdrop-blur-glass">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-paper-100">System Environment & Runtime</h3>
            <p className="text-xs text-paper-300/70">Server configuration and platform status</p>
          </div>
          <span className="text-lg">⚙️</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-line bg-ink-950/60 p-3.5">
            <span className="text-[11px] text-paper-300/70">Framework</span>
            <p className="mt-1 font-mono font-medium text-paper-100">Next.js 14 (App Router)</p>
          </div>
          <div className="rounded-xl border border-line bg-ink-950/60 p-3.5">
            <span className="text-[11px] text-paper-300/70">Database & Auth</span>
            <p className="mt-1 font-mono font-medium text-paper-100">Supabase (PostgreSQL + RLS)</p>
          </div>
          <div className="rounded-xl border border-line bg-ink-950/60 p-3.5">
            <span className="text-[11px] text-paper-300/70">Deployment Platform</span>
            <p className="mt-1 font-mono font-medium text-paper-100">Vercel / Edge & Serverless</p>
          </div>
        </div>
      </div>
    </div>
  );
}
