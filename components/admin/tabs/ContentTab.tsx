"use client";

import { useEffect, useState, useCallback } from "react";

interface AdminDocument {
  id: string;
  filename: string;
  file_type: string;
  file_size: number | null;
  status: string;
  detected_type: string | null;
  error_message: string | null;
  created_at: string;
  user_id: string;
  user_email: string;
}

interface AdminAudio {
  id: string;
  title: string;
  provider: string | null;
  status: string;
  duration_seconds: number | null;
  error_message: string | null;
  created_at: string;
  user_id: string;
  user_email: string;
}

export default function ContentTab() {
  const [typeFilter, setTypeFilter] = useState<"all" | "documents" | "audio">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "failed" | "ready" | "processing">("all");
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [audioFiles, setAudioFiles] = useState<AdminAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: typeFilter,
        status: statusFilter,
        limit: "40",
      });
      const res = await fetch(`/api/admin/content?${params}`);
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
        setAudioFiles(data.audioFiles || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  async function handleRetry(type: "document" | "audio", id: string) {
    setActionInProgress(id);
    try {
      const res = await fetch("/api/admin/content/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      if (res.ok) {
        fetchContent();
      }
    } catch {
      // ignore
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleDelete(type: "document" | "audio", id: string) {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    setActionInProgress(id);
    try {
      const res = await fetch("/api/admin/content/retry", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      if (res.ok) {
        fetchContent();
      }
    } catch {
      // ignore
    } finally {
      setActionInProgress(null);
    }
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Type Toggle */}
        <div className="flex rounded-xl border border-line bg-ink-900/80 p-1 text-xs">
          <button
            onClick={() => setTypeFilter("all")}
            className={`rounded-lg px-3 py-1.5 transition ${
              typeFilter === "all" ? "bg-ink-800 text-paper-100 font-semibold" : "text-paper-300/70"
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setTypeFilter("documents")}
            className={`rounded-lg px-3 py-1.5 transition ${
              typeFilter === "documents" ? "bg-ink-800 text-paper-100 font-semibold" : "text-paper-300/70"
            }`}
          >
            📄 Documents ({documents.length})
          </button>
          <button
            onClick={() => setTypeFilter("audio")}
            className={`rounded-lg px-3 py-1.5 transition ${
              typeFilter === "audio" ? "bg-ink-800 text-paper-100 font-semibold" : "text-paper-300/70"
            }`}
          >
            🎧 Audio ({audioFiles.length})
          </button>
        </div>

        {/* Status Toggle */}
        <div className="flex rounded-xl border border-line bg-ink-900/80 p-1 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 transition ${
              statusFilter === "all" ? "bg-ink-800 text-paper-100 font-semibold" : "text-paper-300/70"
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter("failed")}
            className={`rounded-lg px-3 py-1.5 transition ${
              statusFilter === "failed" ? "bg-red-500/20 text-red-300 font-semibold" : "text-paper-300/70"
            }`}
          >
            ⚠️ Failed Only
          </button>
          <button
            onClick={() => setStatusFilter("processing")}
            className={`rounded-lg px-3 py-1.5 transition ${
              statusFilter === "processing" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-paper-300/70"
            }`}
          >
            ⏳ Processing
          </button>
          <button
            onClick={() => setStatusFilter("ready")}
            className={`rounded-lg px-3 py-1.5 transition ${
              statusFilter === "ready" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-paper-300/70"
            }`}
          >
            ✓ Ready
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-paper-300 animate-pulse">Loading content & pipeline status…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Documents Section */}
          {(typeFilter === "all" || typeFilter === "documents") && (
            <div className="rounded-2xl border border-line bg-ink-900/60 p-5 backdrop-blur-glass">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-display text-sm font-semibold text-paper-100">
                  Uploaded Documents & Analysis ({documents.length})
                </h3>
              </div>

              {documents.length === 0 ? (
                <p className="py-6 text-center text-xs text-paper-300/70">No documents found matching filters.</p>
              ) : (
                <div className="mt-3 divide-y divide-line">
                  {documents.map((doc) => (
                    <div key={doc.id} className="py-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-base">📄</span>
                          <div className="min-w-0">
                            <p className="font-medium text-paper-100 truncate">{doc.filename}</p>
                            <p className="text-[11px] text-paper-300/70">
                              by {doc.user_email} · {formatBytes(doc.file_size)} ·{" "}
                              {doc.detected_type || doc.file_type} · {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={doc.status} />
                          {doc.status === "failed" && (
                            <button
                              onClick={() => handleRetry("document", doc.id)}
                              disabled={actionInProgress === doc.id}
                              className="rounded-lg border border-line bg-ink-950 px-2 py-1 text-[11px] text-amber-300 hover:bg-ink-800 disabled:opacity-50"
                            >
                              {actionInProgress === doc.id ? "Retrying…" : "Retry"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete("document", doc.id)}
                            disabled={actionInProgress === doc.id}
                            className="rounded-lg border border-red-500/20 bg-transparent px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {doc.error_message && (
                        <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-[11px] font-mono text-red-300">
                          Error: {doc.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audio Files Section */}
          {(typeFilter === "all" || typeFilter === "audio") && (
            <div className="rounded-2xl border border-line bg-ink-900/60 p-5 backdrop-blur-glass">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-display text-sm font-semibold text-paper-100">
                  Audio Speech Synthesis Jobs ({audioFiles.length})
                </h3>
              </div>

              {audioFiles.length === 0 ? (
                <p className="py-6 text-center text-xs text-paper-300/70">No audio files found matching filters.</p>
              ) : (
                <div className="mt-3 divide-y divide-line">
                  {audioFiles.map((audio) => (
                    <div key={audio.id} className="py-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-base">🎧</span>
                          <div className="min-w-0">
                            <p className="font-medium text-paper-100 truncate">{audio.title}</p>
                            <p className="text-[11px] text-paper-300/70">
                              by {audio.user_email} · {audio.provider || "TTS"} ·{" "}
                              {audio.duration_seconds ? `${Math.round(audio.duration_seconds)}s` : "—"} ·{" "}
                              {new Date(audio.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={audio.status} />
                          {audio.status === "failed" && (
                            <button
                              onClick={() => handleRetry("audio", audio.id)}
                              disabled={actionInProgress === audio.id}
                              className="rounded-lg border border-line bg-ink-950 px-2 py-1 text-[11px] text-amber-300 hover:bg-ink-800 disabled:opacity-50"
                            >
                              {actionInProgress === audio.id ? "Retrying…" : "Retry"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete("audio", audio.id)}
                            disabled={actionInProgress === audio.id}
                            className="rounded-lg border border-red-500/20 bg-transparent px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {audio.error_message && (
                        <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-[11px] font-mono text-red-300">
                          Error: {audio.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ready":
      return (
        <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          Ready
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300">
          Failed
        </span>
      );
    case "generating":
    case "extracting":
    case "uploading":
    case "analyzing":
      return (
        <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
          {status}…
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full border border-line bg-ink-950 px-2 py-0.5 text-[10px] text-paper-300">
          {status}
        </span>
      );
  }
}
