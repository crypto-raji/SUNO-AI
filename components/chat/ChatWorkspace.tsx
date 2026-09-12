"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { nanoid } from "nanoid";
import MessageList from "./MessageList";
import Composer from "./Composer";
import ModeSwitcher from "./ModeSwitcher";
import VoiceCallModal from "./VoiceCallModal";
import DocumentViewerPane from "@/components/copilot/DocumentViewerPane";
import type { ChatMessage } from "./types";
import type { Mode } from "@/lib/types/database";

export default function ChatWorkspace({ initialMode }: { initialMode: Mode }) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [sessionId, setSessionId] = useState<string | null>(searchParams.get("session"));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documentByMessage, setDocumentByMessage] = useState<Record<string, string>>({});
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);
  const [splitViewOpen, setSplitViewOpen] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const createdSessionIdRef = useRef<string | null>(null);

  // Sync with searchParams session ID if it changes
  const paramSession = searchParams.get("session");
  useEffect(() => {
    if (paramSession !== sessionId) {
      setSessionId(paramSession);
      if (!paramSession) {
        setMessages([]);
        setActiveDocumentId(null);
        setDocumentByMessage({});
      }
    }
  }, [paramSession, sessionId]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Load an existing session if one is referenced in the URL
  useEffect(() => {
    if (!sessionId) return;
    // Do not wipe in-flight messages if this session was just created by the active composer
    if (createdSessionIdRef.current === sessionId) {
      createdSessionIdRef.current = null;
      return;
    }

    fetch(`/api/sessions?id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) {
          const docMap: Record<string, string> = {};
          let latestDocId: string | null = null;

          const loadedMsgs = data.messages.map(
            (m: { id: string; role: "user" | "assistant"; content: string; metadata?: Record<string, unknown> }) => {
              const docId = (m.metadata?.documentId as string) || (m.metadata?.creatorAudio as any)?.documentId;
              if (docId) {
                docMap[m.id] = docId;
                latestDocId = docId;
              }
              return {
                id: m.id,
                role: m.role,
                content: m.content,
                metadata: m.metadata,
              };
            }
          );

          setMessages(loadedMsgs);
          setDocumentByMessage((prev) => ({ ...prev, ...docMap }));
          if (latestDocId) setActiveDocumentId(latestDocId);
        }
        if (data.session?.mode) setMode(data.session.mode);
      });
  }, [sessionId]);

  async function ensureSession(seed: string): Promise<string> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, seed }),
    });
    const data = await res.json();
    createdSessionIdRef.current = data.session.id;
    setSessionId(data.session.id);
    window.history.replaceState(null, "", `?session=${data.session.id}`);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sona:session-created", { detail: { session: data.session } }));
    }
    return data.session.id;
  }

  async function handleSend(text: string, file: File | null) {
    setBusy(true);
    const activeSessionId = await ensureSession(text || file?.name || "New conversation");

    const userMsgId = nanoid();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: text || `Uploaded ${file?.name}`, metadata: file ? { documentName: file.name } : undefined },
    ]);

    if (file) {
      await handleUpload(file, activeSessionId, userMsgId, text);
    } else if (mode === "reading" && text.trim().length >= 400) {
      // Reading Mode treats a long pasted block as an article, same as an
      // uploaded document — no file required, matching "paste an article".
      await handlePaste(text, activeSessionId);
    } else {
      await handleChat(text, activeSessionId);
    }
    setBusy(false);
  }

  async function handlePaste(text: string, activeSessionId: string) {
    const pendingId = nanoid();
    setMessages((prev) => [...prev, { id: pendingId, role: "assistant", content: "Reading that…", pending: true }]);

    const res = await fetch("/api/documents/paste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSessionId, mode, text }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, content: data.error, pending: false } : m)));
      return;
    }

    setDocumentByMessage((prev) => ({ ...prev, [pendingId]: data.document.id }));
    setActiveDocumentId(data.document.id);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingId
          ? {
              ...m,
              pending: false,
              content: `${data.summary}\n\nWhat would you like to do?`,
              metadata: { suggestedActions: data.suggestedActions },
            }
          : m
      )
    );
  }

  async function handleChat(text: string, activeSessionId: string) {
    const pendingId = nanoid();
    setMessages((prev) => [...prev, { id: pendingId, role: "assistant", content: "Thinking…", pending: true }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: activeSessionId,
        mode,
        message: text,
        documentId: activeDocumentId ?? undefined,
      }),
    });
    const data = await res.json();

    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingId
          ? {
              ...m,
              content: data.reply ?? data.error ?? "Something went wrong.",
              pending: false,
              // Lets "explain X" -> "turn that into audio" work without any
              // document ever being uploaded, per the general-chat flow in
              // the spec.
              metadata: data.reply ? { suggestedActions: [{ id: "turn_into_audio", label: "Turn Into Audio" }] } : undefined,
            }
          : m
      )
    );
  }

  async function handleUpload(file: File, activeSessionId: string, userMsgId: string, instruction: string) {
    const pendingId = nanoid();
    setMessages((prev) => [...prev, { id: pendingId, role: "assistant", content: "Reading your file…", pending: true }]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", activeSessionId);
    formData.append("mode", mode);

    const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...m, content: data.error, pending: false } : m))
      );
      return;
    }

    setDocumentByMessage((prev) => ({ ...prev, [pendingId]: data.document.id }));
    setActiveDocumentId(data.document.id);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingId
          ? {
              ...m,
              pending: false,
              content: instruction
                ? `${data.summary}\n\nI'll work on: "${instruction}"`
                : `${data.summary}\n\nWhat would you like to do?`,
              metadata: { suggestedActions: data.suggestedActions },
            }
          : m
      )
    );
  }

  async function handleSelectAction(messageId: string, actionId: string) {
    if (actionId === "split_view") {
      setSplitViewOpen(true);
      return;
    }

    if (actionId === "turn_into_audio") {
      const source = messages.find((m) => m.id === messageId);
      if (!source?.content) return;

      setBusy(true);
      const resultId = nanoid();
      setMessages((prev) => [...prev, { id: resultId, role: "assistant", content: "Generating audio…", pending: true }]);

      const res = await fetch("/api/audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source.content, title: "Generated audio", sessionId }),
      });
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === resultId
            ? {
                ...m,
                pending: false,
                content: "Here's your audio:",
                metadata: {
                  audio: { url: data.audio?.audio_url ?? null, status: data.status ?? "failed", title: "Generated audio" },
                },
              }
            : m
        )
      );
      setBusy(false);
      return;
    }

    const documentId = documentByMessage[messageId];
    if (!documentId) return;

    if (actionId === "ask") {
      // "Ask Questions" isn't a document-processing action — it just makes
      // sure this document is the active context, then hands control back
      // to the composer so the user can type their actual question.
      setActiveDocumentId(documentId);
      setMessages((prev) => [
        ...prev,
        { id: nanoid(), role: "assistant", content: "Go ahead and ask — I'll answer using this document." },
      ]);
      return;
    }

    setBusy(true);
    const resultId = nanoid();
    setMessages((prev) => [...prev, { id: resultId, role: "assistant", content: "Working on it…", pending: true }]);

    if (actionId === "lecture_audio") {
      const res = await fetch("/api/audio/lecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, sessionId }),
      });
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === resultId
            ? {
                ...m,
                pending: false,
                content: data.playlist ? "Here's your lecture, section by section:" : data.error,
                metadata: data.playlist ? { audioPlaylist: data.playlist } : undefined,
              }
            : m
        )
      );
      setBusy(false);
      return;
    }

    if (actionId === "audio_briefing") {
      const res = await fetch("/api/audio/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, sessionId }),
      });
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === resultId
            ? {
                ...m,
                pending: false,
                content: data.audio ? "Here's your audio briefing:" : data.error,
                metadata: data.audio
                  ? { audio: { url: data.audio.audio_url ?? null, status: data.status, title: "Audio briefing" } }
                  : undefined,
              }
            : m
        )
      );
      setBusy(false);
      return;
    }

    if (actionId === "audio" && mode === "creator") {
      // Creator Mode audio lets the user pick a real voice first — the
      // CreatorAudioCard component drives its own generation call, so we
      // just need to attach the document reference and stop "working on it".
      setMessages((prev) =>
        prev.map((m) =>
          m.id === resultId
            ? { ...m, pending: false, content: "Choose a voice for the narration:", metadata: { creatorAudio: { documentId } } }
            : m
        )
      );
      setBusy(false);
      return;
    }

    if (actionId === "audio") {
      // Fetch the processed text first (summarize as the narration base), then prepare ready audio briefing
      const processRes = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, actionId: "summarize", sessionId }),
      });
      const processData = await processRes.json();
      const narrationText = processData.result || "Here is your document audio briefing.";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === resultId
            ? {
                ...m,
                pending: false,
                content: "Here is your spoken audio briefing:",
                metadata: {
                  audio: {
                    url: null,
                    status: "ready",
                    title: "Audio Briefing",
                    text: narrationText,
                  },
                },
              }
            : m
        )
      );
      setBusy(false);
      return;
    }

    if (actionId === "financial_breakdown") {
      const res = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, actionId, sessionId }),
      });
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === resultId
            ? {
                ...m,
                pending: false,
                content: data.financials ? "Here's the financial breakdown:" : data.error ?? "Couldn't extract financials.",
                metadata: data.financials ? { financials: data.financials } : undefined,
              }
            : m
        )
      );
      setBusy(false);
      return;
    }

    if (actionId === "analyze_all") {
      const res = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, actionId, sessionId }),
      });
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === resultId
            ? {
                ...m,
                pending: false,
                content: data.analysis ? "Here's the full analysis:" : data.error ?? "Couldn't analyze this document.",
                metadata: data.analysis ? { businessAnalysis: data.analysis } : undefined,
              }
            : m
        )
      );
      setBusy(false);
      return;
    }

    if (actionId === "quiz") {
      const res = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, actionId: "quiz", sessionId }),
      });
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === resultId
            ? {
                ...m,
                pending: false,
                content: data.quiz ? "Here's a quiz based on this document:" : data.error ?? "Couldn't generate a quiz.",
                metadata: data.quiz ? { quiz: data.quiz } : undefined,
              }
            : m
        )
      );
      setBusy(false);
      return;
    }

    const res = await fetch("/api/documents/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, actionId, sessionId }),
    });
    const data = await res.json();

    setMessages((prev) =>
      prev.map((m) => (m.id === resultId ? { ...m, pending: false, content: data.result ?? data.error } : m))
    );
    setBusy(false);
  }

  async function handleVoiceCallMessage(voiceText: string): Promise<string> {
    const activeSessionId = await ensureSession(voiceText);
    const userMsgId = nanoid();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: voiceText }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: activeSessionId,
        mode,
        message: voiceText,
        documentId: activeDocumentId,
      }),
    });
    const data = await res.json();
    if (data.reply) {
      const assistantMsgId = nanoid();
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: data.reply }]);
      return data.reply;
    }
    throw new Error(data.error || "Failed to get AI voice response");
  }

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 relative">
      {/* Subheader: Mode Tabs & Live Actions */}
      <div className="shrink-0 flex items-center justify-between gap-2 border-b border-line/40 bg-ink-950/60 px-3 sm:px-4 py-2 backdrop-blur-sm overflow-x-auto scrollbar-none">
        <div className="flex-1 min-w-0">
          <ModeSwitcher mode={mode} onChange={setMode} />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Split Co-Pilot Toggle */}
          <button
            onClick={() => setSplitViewOpen(!splitViewOpen)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              splitViewOpen
                ? "border-signal bg-signal text-ink-950 font-semibold"
                : "border-line bg-ink-900/80 text-paper-200 hover:bg-ink-800 hover:text-paper-100"
            }`}
            title="Toggle Split-Screen Document Co-Pilot"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
            <span className="hidden sm:inline">Split View</span>
          </button>

          {/* Live Voice Call Trigger */}
          <button
            onClick={() => setVoiceCallOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-signal/40 bg-signal/15 px-3 py-1 text-xs font-semibold text-signal hover:bg-signal/25 hover:border-signal/60 transition-all shadow-sm active:scale-95 whitespace-nowrap"
            title="Start Live Speech-to-Speech Voice Call"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal"></span>
            </span>
            <span>Live Call</span>
          </button>
        </div>
      </div>

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={voiceCallOpen}
        onClose={() => setVoiceCallOpen(false)}
        onSendMessage={handleVoiceCallMessage}
        mode={mode}
        initialGreeting={`Hello! I'm Sona AI in ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode. What would you like to explore today?`}
      />

      {/* Main Workspace Body (Split View or Single Column) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Pane: Document Viewer (When Split View is Active) */}
        {splitViewOpen && (
          <div className="w-full md:w-[45%] lg:w-[42%] shrink-0 h-full overflow-hidden border-r border-line animate-in slide-in-from-left-4 duration-200">
            <DocumentViewerPane
              documentId={activeDocumentId}
              highlightedSectionId={highlightedSection}
              onClose={() => setSplitViewOpen(false)}
            />
          </div>
        )}

        {/* Right Pane: Conversation & Composer */}
        <div className="flex flex-1 flex-col h-full min-h-0 min-w-0">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[50vh] flex-col items-center justify-center px-4 sm:px-6 text-center">
                <h1 className="font-display text-xl sm:text-2xl text-paper-100">
                  What would you like to understand today?
                </h1>
                <p className="mt-2 max-w-sm text-xs sm:text-sm text-paper-300">
                  Type a question, attach a document, or start a Live Voice Call.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => setVoiceCallOpen(true)}
                    className="flex items-center gap-2 rounded-full border border-signal/40 bg-gradient-to-r from-signal/20 to-amber-500/20 px-4 py-2 text-xs sm:text-sm font-semibold text-signal hover:bg-signal/30 transition-all shadow-md active:scale-95"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                    <span>Start Live Voice Call</span>
                  </button>
                </div>
              </div>
            ) : (
              <MessageList messages={messages} onSelectAction={handleSelectAction} sessionId={sessionId} />
            )}
          </div>

          <Composer onSend={handleSend} disabled={busy} />
        </div>
      </div>
    </div>
  );
}
