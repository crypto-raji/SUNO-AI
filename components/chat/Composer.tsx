"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import UploadPreview from "@/components/upload/UploadPreview";

const ACCEPTED = ".pdf,.docx,.txt,.md";

export default function Composer({
  onSend,
  disabled,
}: {
  onSend: (text: string, file: File | null) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardware and recorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  function stopRecordingCleanup() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
    e.target.value = "";
  }

  function handleSend() {
    if (!text.trim() && !file) return;
    if (isListening) {
      stopVoiceInput();
    }
    onSend(text.trim(), file);
    setText("");
    setFile(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Transcribe recorded audio chunk via ultra-fast server route
  const transcribeAudioBlob = async (audioBlob: Blob) => {
    if (audioBlob.size < 200) return; // ignore accidental empty tap

    setIsTranscribing(true);
    try {
      const mimeType = audioBlob.type || "audio/webm";
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const formData = new FormData();
      formData.append("audio", audioBlob, `voice_input.${ext}`);

      const res = await fetch("/api/stt/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Transcription request failed");
      }

      const data = await res.json();
      if (data.transcript && data.transcript.trim()) {
        const clean = data.transcript.trim();
        setText((prev) => (prev ? `${prev} ${clean}` : clean));
      }
    } catch (err) {
      console.warn("[Composer Voice] Server STT notice:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const stopVoiceInput = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  }, []);

  const startVoiceInput = async () => {
    if (typeof window === "undefined") return;

    audioChunksRef.current = [];

    // 1. Request microphone stream (universal across iOS, Android, Desktop)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        audioChunksRef.current = [];
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        transcribeAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      console.warn("[Composer] getUserMedia / MediaRecorder notice:", err);
      // Fallback: If Web Speech is available, attempt it
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
          recognition.onerror = () => setIsListening(false);

          recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript + " ";
              }
            }
            if (transcript) {
              setText((prev) => (prev ? prev + " " + transcript.trim() : transcript.trim()));
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch {}
      }

      alert("Please allow microphone access in your browser settings to use voice typing.");
      setIsListening(false);
    }
  };

  function toggleVoiceInput() {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  }

  return (
    <div className="sticky bottom-0 z-20 w-full border-t border-line/60 bg-ink-950/95 backdrop-blur-glass px-3 py-3 sm:px-4">
      <div className="mx-auto max-w-3xl">
        {file && <UploadPreview file={file} onRemove={() => setFile(null)} />}

        <div className="glass-panel flex items-end gap-2 p-1.5 sm:p-2">
          {/* File Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label="Upload file"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line hover:bg-ink-700 disabled:opacity-50 text-paper-200 transition-colors"
            title="Attach document"
          >
            +
          </button>
          <input ref={fileInputRef} type="file" accept={ACCEPTED} onChange={handleFilePick} className="hidden" />

          {/* Voice Microphone Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={disabled || isTranscribing}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            title={
              isTranscribing
                ? "Transcribing..."
                : isListening
                ? "Listening... (tap to finish)"
                : "Voice typing"
            }
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all ${
              isListening
                ? "border-red-500 bg-red-500/20 text-red-400 animate-pulse ring-2 ring-red-500/30"
                : isTranscribing
                ? "border-amber-500/50 bg-amber-500/20 text-amber-400 animate-spin"
                : "border-line text-paper-200 hover:bg-ink-700 hover:text-paper-100"
            } disabled:opacity-50`}
          >
            {isTranscribing ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </button>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={
              isTranscribing
                ? "Transcribing your voice..."
                : isListening
                ? "Listening... (tap mic icon when done speaking)"
                : "What would you like to understand today?"
            }
            className="max-h-36 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-paper-100 outline-none placeholder:text-paper-300/60"
          />

          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && !file) || isTranscribing}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal text-ink-950 disabled:opacity-40 hover:bg-signal-soft transition-colors font-bold"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

