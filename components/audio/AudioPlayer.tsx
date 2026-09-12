"use client";

import { useEffect, useRef, useState } from "react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export default function AudioPlayer({
  src,
  title,
  section,
  text,
}: {
  src?: string | null;
  title: string;
  section?: string;
  text?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const synthTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hasAudioSrc = Boolean(src && !src.startsWith("synth:"));

  useEffect(() => {
    return () => {
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function togglePlay() {
    if (hasAudioSrc) {
      if (!audioRef.current) return;
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
      return;
    }

    // Speech Synthesis playback
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (playing) {
      window.speechSynthesis.cancel();
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      setPlaying(false);
      return;
    }

    const speakContent = text || section || title || "Audio playback";
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speakContent);
    utterance.rate = speed;
    utterance.lang = "en-US";

    const estDuration = Math.max(5, Math.ceil(speakContent.split(" ").length / 2.5));
    setDuration(estDuration);
    setCurrent(0);

    utterance.onend = () => {
      setPlaying(false);
      setCurrent(estDuration);
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };

    utterance.onerror = () => {
      setPlaying(false);
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };

    setPlaying(true);
    window.speechSynthesis.speak(utterance);

    synthTimerRef.current = setInterval(() => {
      setCurrent((prev) => {
        if (prev >= estDuration) {
          if (synthTimerRef.current) clearInterval(synthTimerRef.current);
          return estDuration;
        }
        return prev + 1;
      });
    }, 1000);
  }

  function changeSpeed(s: number) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function fmt(t: number) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="glass-panel w-full max-w-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-paper-100 font-medium">{title}</p>
          {section && <p className="text-xs text-paper-300 mt-0.5">{section}</p>}
        </div>
        {hasAudioSrc && src ? (
          <a href={src} download className="text-xs text-signal hover:text-signal-soft">
            Download
          </a>
        ) : (
          <span className="text-[11px] text-paper-300/70">Voice audio ready</span>
        )}
      </div>

      {hasAudioSrc && src && (
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
        />
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal text-ink-950 font-bold hover:bg-signal-soft transition-colors"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="flex-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-ink-700 overflow-hidden">
            <div
              className="h-full bg-signal transition-all duration-300"
              style={{ width: `${duration > 0 ? (current / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
        <span className="w-16 text-right text-xs text-paper-300 tabular-nums">
          {fmt(current)} / {fmt(duration || 10)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                speed === s ? "bg-signal text-ink-950 font-medium" : "bg-ink-700 text-paper-300 hover:text-paper-100"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
