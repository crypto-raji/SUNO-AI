"use client";

import { useEffect, useState } from "react";
import AudioPlayer from "./AudioPlayer";
import AudioNotConfigured from "./AudioNotConfigured";

interface VoiceOption {
  id: string;
  label: string;
}

export default function CreatorAudioCard({ documentId, sessionId }: { documentId: string; sessionId: string | null }) {
  const [voices, setVoices] = useState<VoiceOption[] | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "failed" | "not_configured">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Voices come from the configured provider only — an empty list here
    // means no provider is configured yet, not that we should show fake ones.
    fetch("/api/tts/voices")
      .then((r) => r.json())
      .then((data) => {
        setVoices(data.voices ?? []);
        if (data.voices?.[0]) setSelectedVoice(data.voices[0].id);
      })
      .catch(() => setVoices([]));
  }, []);

  async function handleGenerate() {
    setStatus("generating");
    setError(null);

    const res = await fetch("/api/audio/creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, sessionId, voice: selectedVoice || undefined }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("failed");
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setStatus(data.status);
    if (data.status === "ready") setAudioUrl(data.audio?.audio_url ?? null);
  }

  if (status === "ready" && audioUrl) {
    return <AudioPlayer src={audioUrl} title="Narration" />;
  }

  if (status === "not_configured") {
    return <AudioNotConfigured />;
  }

  return (
    <div className="glass-panel w-full max-w-md space-y-3 p-4">
      {voices === null ? (
        <p className="text-sm text-paper-300">Checking available voices…</p>
      ) : voices.length > 0 ? (
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-paper-300/70">Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            disabled={status === "generating"}
            className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-sm text-paper-100"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-sm text-paper-300">No voice options are available yet — this will use the provider&apos;s default voice once one is configured.</p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button onClick={handleGenerate} disabled={status === "generating"} className="glass-button w-full">
        {status === "generating" ? "Generating…" : "Generate narration"}
      </button>
    </div>
  );
}
