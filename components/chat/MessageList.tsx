"use client";

import { useState } from "react";
import AudioPlayer from "@/components/audio/AudioPlayer";
import AudioNotConfigured from "@/components/audio/AudioNotConfigured";
import AudioPlaylist from "@/components/audio/AudioPlaylist";
import CreatorAudioCard from "@/components/audio/CreatorAudioCard";
import QuizCard from "./QuizCard";
import FinancialBreakdownCard from "./FinancialBreakdownCard";
import BusinessAnalysisCard from "./BusinessAnalysisCard";
import ActionChips from "./ActionChips";
import { playNaturalVoice } from "@/lib/services/voice";
import type { ChatMessage } from "./types";

function formatCleanText(raw: string): string {
  if (!raw) return "";
  let clean = raw;
  clean = clean.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "");
  clean = clean.replace(/^#{1,6}\s+/gm, "");
  clean = clean.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
  clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");
  clean = clean.replace(/\*([^*]+)\*/g, "$1");
  clean = clean.replace(/___([^_]+)___/g, "$1");
  clean = clean.replace(/__([^_]+)__/g, "$1");
  clean = clean.replace(/_([^_]+)_/g, "$1");
  clean = clean.replace(/^\s*\*\s+/gm, "• ");
  clean = clean.replace(/^\s*-\s+/gm, "• ");
  clean = clean.replace(/^>\s+/gm, "");
  clean = clean.replace(/~~([^~]+)~~/g, "$1");
  clean = clean.replace(/\n{3,}/g, "\n\n");
  return clean.trim();
}

export default function MessageList({
  messages,
  onSelectAction,
  sessionId,
}: {
  messages: ChatMessage[];
  onSelectAction: (messageId: string, actionId: string) => void;
  sessionId: string | null;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSpeak(id: string, text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(id);
    playNaturalVoice(text, {
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-3 sm:px-4 pb-6 pt-4">
      {messages.map((m) => (
        <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
          <div
            className={
              m.role === "user"
                ? "group relative max-w-[88%] sm:max-w-[80%] rounded-2xl rounded-br-sm bg-signal px-4 py-3 text-ink-950 shadow-sm"
                : "group relative max-w-[88%] sm:max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-ink-800/90 px-4 py-3 text-paper-100 shadow-sm"
            }
          >
            {m.metadata?.documentName && (
              <p className="mb-1 text-xs font-medium opacity-75">📎 {m.metadata.documentName}</p>
            )}

            <p className={m.pending ? "animate-pulse whitespace-pre-wrap leading-relaxed text-sm sm:text-base" : "whitespace-pre-wrap leading-relaxed text-sm sm:text-base"}>
              {formatCleanText(m.content)}
            </p>

            {/* Message Action Toolbar (Copy & Voice Listen) */}
            {!m.pending && m.content && (
              <div className="mt-2.5 flex items-center gap-2 pt-1">
                {/* Voice Listen Button (for Assistant) */}
                {m.role === "assistant" && (
                  <button
                    onClick={() => handleSpeak(m.id, m.content)}
                    aria-label={speakingId === m.id ? "Stop voice" : "Listen to voice"}
                    title={speakingId === m.id ? "Stop reading" : "Read aloud"}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
                      speakingId === m.id
                        ? "bg-signal text-ink-950 font-medium"
                        : "text-paper-300 hover:bg-ink-700 hover:text-paper-100"
                    }`}
                  >
                    {speakingId === m.id ? (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-ink-950 animate-ping" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                )}

                {/* Copy Text Button */}
                <button
                  onClick={() => handleCopy(m.id, m.content)}
                  aria-label="Copy text"
                  title="Copy message"
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
                    m.role === "user"
                      ? "text-ink-950/70 hover:bg-black/10 hover:text-ink-950"
                      : "text-paper-300 hover:bg-ink-700 hover:text-paper-100"
                  }`}
                >
                  {copiedId === m.id ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {m.metadata?.audio && (
              <div className="mt-3">
                {m.metadata.audio.status === "ready" && (m.metadata.audio.url || m.metadata.audio.text) ? (
                  <AudioPlayer
                    src={m.metadata.audio.url}
                    title={m.metadata.audio.title}
                    section={m.metadata.audio.section}
                    text={m.metadata.audio.text}
                  />
                ) : m.metadata.audio.status === "failed" ? (
                  <p className="text-sm text-red-300">The audio generation failed. Please try again.</p>
                ) : (
                  <p className="text-sm opacity-70">Generating audio…</p>
                )}
              </div>
            )}

            {m.metadata?.audioPlaylist && (
              <div className="mt-3">
                <AudioPlaylist items={m.metadata.audioPlaylist} />
              </div>
            )}

            {m.metadata?.quiz && (
              <div className="mt-3">
                <QuizCard quiz={m.metadata.quiz} />
              </div>
            )}

            {m.metadata?.financials && (
              <div className="mt-3">
                <FinancialBreakdownCard financials={m.metadata.financials} />
              </div>
            )}

            {m.metadata?.creatorAudio && (
              <div className="mt-3">
                <CreatorAudioCard documentId={m.metadata.creatorAudio.documentId} sessionId={sessionId} />
              </div>
            )}

            {m.metadata?.businessAnalysis && (
              <div className="mt-3">
                <BusinessAnalysisCard analysis={m.metadata.businessAnalysis} />
              </div>
            )}

            {m.metadata?.suggestedActions && m.metadata.suggestedActions.length > 0 && (
              <div className="mt-3">
                <ActionChips
                  actions={m.metadata.suggestedActions}
                  onSelect={(actionId) => onSelectAction(m.id, actionId)}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
