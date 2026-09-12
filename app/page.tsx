"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { playNaturalVoice } from "@/lib/services/voice";

const MODES_DATA = [
  {
    id: "student",
    title: "Student Mode",
    badge: "Academic Intelligence",
    icon: "🎓",
    headline: "Transform Lecture Slides & Textbooks into Spoken Study Briefings",
    body: "Drop in lecture PDFs, research papers, or syllabus chapters. Sona AI extracts core concepts, creates spoken revisions, and generates self-testing quizzes.",
    image: "/images/student-preview.jpg",
    features: [
      "Auto-generated spoken lecture summaries",
      "Interactive knowledge check quizzes",
      "Flashcard question & answer generation",
      "Grounded document Q&A tutor",
    ],
  },
  {
    id: "business",
    title: "Business Mode",
    badge: "Executive Briefings",
    icon: "💼",
    headline: "Extract Critical Metrics & Listen to Audio Briefings on the Go",
    body: "Upload quarterly reports, pitch decks, and financial statements. Get an executive overview, revenue breakdowns, and a spoken digest you can play before your next meeting.",
    image: "/images/business-preview.jpg",
    features: [
      "Revenue, expense, and profit breakdown",
      "Action items, risks & opportunities extraction",
      "Spoken executive morning briefings",
      "Strict data grounding — no fabricated figures",
    ],
  },
  {
    id: "creator",
    title: "Creator Mode",
    badge: "Script & Narration Studio",
    icon: "🎙️",
    headline: "Prepare, Polish & Voice Scripts with Natural Studio Flow",
    body: "Paste video scripts, podcast notes, or drafts. Sona AI shortens cuts, refines tone, and generates natural voice narration without losing your creative personality.",
    image: "/images/hero-soundwave.jpg",
    features: [
      "Natural script teleprompter formatting",
      "Voice persona & tone adjustment",
      "Studio audio playback & chapter markers",
      "Pacing and timing optimization",
    ],
  },
  {
    id: "reading",
    title: "Reading Mode",
    badge: "Digest & Audio Reader",
    icon: "📖",
    headline: "Digest Long-Form Articles & Turn Reading Lists into Podcasts",
    body: "Paste any lengthy essay, newsletter, or documentation. Choose between full spoken reads, speed digests, or deep analytical takeaways with variable speed playback.",
    image: "/images/hero-soundwave.jpg",
    features: [
      "Instant paste-to-podcast conversion",
      "Adjustable 0.75x to 2.0x playback speed",
      "Key takeaways and bulleted summaries",
      "Real-time interactive voice follow-up",
    ],
  },
];

const FEATURES_LIST = [
  {
    icon: "⚡",
    title: "Ultra-Low Latency Neural Engine",
    body: "Instant responses and fluid conversational dialogue generated in sub-second time.",
  },
  {
    icon: "🎙️",
    title: "Real-Time Voice Intelligence",
    body: "Accurate real-time speech transcription, interactive audio intelligence, and hands-free call mode.",
  },
  {
    icon: "📄",
    title: "Multi-Format Document Ingestion",
    body: "Upload PDFs, Word DOCX, Markdown, and plain text files with automatic knowledge extraction.",
  },
  {
    icon: "🔊",
    title: "Natural Voice Synthesis",
    body: "Listen to any explanation or summary with studio-tuned, natural human speech synthesis.",
  },
  {
    icon: "🔒",
    title: "Enterprise End-to-End Privacy",
    body: "Strict data isolation and security policies. Only you can read, modify, or manage your data.",
  },
  {
    icon: "💬",
    title: "Fluid Chronological Workspace",
    body: "Seamless date-grouped session navigation, instant resume, and responsive history across all devices.",
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  function handlePlayDemo() {
    if (isPlayingDemo) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingDemo(false);
      return;
    }

    const demoText =
      "Welcome to Sona AI. Upload any lecture, financial report, or script, and I will transform it into clear, spoken intelligence you can listen to anywhere.";

    setIsPlayingDemo(true);
    playNaturalVoice(demoText, {
      rate: 1.0,
      pitch: 1.05,
      onEnd: () => setIsPlayingDemo(false),
      onError: () => setIsPlayingDemo(false),
    });
  }

  const currentMode = MODES_DATA[activeTab];

  return (
    <main className="min-h-screen bg-ink-950 text-paper-100 selection:bg-signal selection:text-ink-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/85 backdrop-blur-glass">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Sona AI" width={28} height={28} className="rounded-lg shadow-sm" />
            <span className="font-heading text-lg font-bold tracking-tight text-paper-100">
              Sona AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-paper-200">
            <a href="#modes" className="hover:text-paper-100 transition-colors">Workspace Modes</a>
            <a href="#voice-live" className="hover:text-paper-100 transition-colors">Live Voice</a>
            <a href="#features" className="hover:text-paper-100 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-paper-100 transition-colors">How It Works</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-paper-200 hover:text-paper-100 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-signal px-4 py-2 text-xs sm:text-sm font-semibold text-ink-950 hover:bg-signal-soft transition-all shadow-md shadow-signal/15"
            >
              Get Started Free
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[700px] rounded-full bg-signal/10 blur-[130px]" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-4 py-1.5 text-xs font-medium text-signal shadow-sm mb-6 animate-in fade-in">
            <span className="flex h-2 w-2 rounded-full bg-signal animate-ping" />
            <span>Next-Gen Real-Time Voice & Speech Intelligence</span>
          </div>

          {/* Main Title */}
          <h1 className="mx-auto max-w-4xl font-display text-4xl leading-[1.12] sm:text-6xl sm:leading-[1.1] tracking-tight text-paper-100">
            Turn Any Information Into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-signal via-signal-soft to-amber-200 bg-clip-text text-transparent italic">
              Spoken Intelligence
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-paper-200">
            Sona AI reads lectures, executive reports, scripts, and articles — generating
            studio-quality audio briefings, instant answers, and live conversational voice calls.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app"
              className="flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-sm font-bold text-ink-950 hover:bg-signal-soft transition-all shadow-xl shadow-signal/20 hover:scale-[1.02]"
            >
              <span>Launch Sona AI Workspace</span>
              <span>→</span>
            </Link>

            <button
              onClick={handlePlayDemo}
              className={`flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-medium transition-all ${
                isPlayingDemo
                  ? "border-signal bg-signal/20 text-signal ring-2 ring-signal/30"
                  : "border-line bg-ink-900/80 text-paper-100 hover:bg-ink-800"
              }`}
            >
              <span>{isPlayingDemo ? "❚❚" : "▶"}</span>
              <span>{isPlayingDemo ? "Playing Audio Demo…" : "Listen to Voice Preview"}</span>
            </button>
          </div>

          {/* Hero Showcase Image & Wave Visualizer */}
          <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl sm:rounded-3xl border border-line bg-ink-900/60 p-2 sm:p-4 shadow-2xl backdrop-blur-glass overflow-hidden">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl sm:rounded-2xl border border-line/60">
              <Image
                src="/images/hero-soundwave.jpg"
                alt="Sona AI Voice Intelligence"
                fill
                priority
                className="object-cover"
              />

              {/* Floating Glassmorphic Audio Player Badge */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:max-w-md rounded-2xl border border-line bg-ink-950/85 p-4 backdrop-blur-md shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayDemo}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal text-ink-950 font-bold hover:bg-signal-soft transition-transform hover:scale-105"
                      aria-label="Play audio snippet"
                    >
                      {isPlayingDemo ? "❚❚" : "▶"}
                    </button>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-paper-100">Live Voice Intelligence</p>
                      <p className="text-[11px] text-paper-300">Neural Intelligence + Studio Voice</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-1 rounded-full bg-signal animate-bounce" />
                    <span className="h-5 w-1 rounded-full bg-signal animate-bounce [animation-delay:0.15s]" />
                    <span className="h-2 w-1 rounded-full bg-signal animate-bounce [animation-delay:0.3s]" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS STRIP */}
      <section className="border-y border-line bg-ink-900/40 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="font-heading text-3xl sm:text-4xl font-bold text-signal">3.5x</p>
              <p className="mt-1 text-xs sm:text-sm text-paper-300">Faster Reading & Learning</p>
            </div>
            <div>
              <p className="font-heading text-3xl sm:text-4xl font-bold text-signal">&lt; 500ms</p>
              <p className="mt-1 text-xs sm:text-sm text-paper-300">Real-Time Response Latency</p>
            </div>
            <div>
              <p className="font-heading text-3xl sm:text-4xl font-bold text-signal">99.4%</p>
              <p className="mt-1 text-xs sm:text-sm text-paper-300">Speech Transcription Accuracy</p>
            </div>
            <div>
              <p className="font-heading text-3xl sm:text-4xl font-bold text-signal">4 Modes</p>
              <p className="mt-1 text-xs sm:text-sm text-paper-300">Specialized AI Workspaces</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 WORKSPACE MODES (Interactive Tabs with Images) */}
      <section id="modes" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl text-paper-100">
              One Workspace, Tailored to How You Think
            </h2>
            <p className="mt-3 text-sm sm:text-base text-paper-300">
              Choose a dedicated mode or let Sona AI detect the right workflow automatically.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 p-1.5 rounded-2xl bg-ink-900 border border-line max-w-2xl mx-auto">
            {MODES_DATA.map((mode, i) => (
              <button
                key={mode.id}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all ${
                  activeTab === i
                    ? "bg-signal text-ink-950 font-semibold shadow-md"
                    : "text-paper-300 hover:text-paper-100 hover:bg-ink-800"
                }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.title}</span>
              </button>
            ))}
          </div>

          {/* Active Mode Card Showcase */}
          <div className="mt-10 grid gap-8 md:grid-cols-2 items-center rounded-3xl border border-line bg-ink-900/60 p-6 sm:p-10 shadow-2xl backdrop-blur-glass">
            <div>
              <span className="inline-block rounded-full bg-signal/15 px-3 py-1 text-xs font-semibold text-signal uppercase tracking-wider">
                {currentMode.badge}
              </span>
              <h3 className="mt-4 font-display text-2xl sm:text-3xl text-paper-100 leading-tight">
                {currentMode.headline}
              </h3>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-paper-300">
                {currentMode.body}
              </p>

              <div className="mt-6 space-y-2.5">
                {currentMode.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs sm:text-sm text-paper-200">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal/20 text-signal font-bold text-xs">
                      ✓
                    </span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href={`/app/${currentMode.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-xs sm:text-sm font-bold text-ink-950 hover:bg-signal-soft transition-colors shadow-md"
                >
                  <span>Open {currentMode.title}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Mode Image Preview */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line/80 shadow-2xl">
              <Image
                src={currentMode.image}
                alt={currentMode.title}
                fill
                className="object-cover transition-all duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* LIVE VOICE & CALL INTELLIGENCE BANNER */}
      <section id="voice-live" className="py-16 sm:py-24 border-y border-line bg-gradient-to-b from-ink-900/80 to-ink-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/15 px-3 py-1 text-xs font-semibold text-signal mb-4">
                <span className="h-2 w-2 rounded-full bg-signal animate-ping" />
                <span>Speech-to-Speech Engine</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-paper-100 leading-tight">
                Real-Time Voice Calls with Instant AI Response
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-paper-300">
                Experience natural voice conversations without typing. Speak directly through your microphone —
                Sona AI listens in real-time, generates intelligent replies instantly, and speaks back
                with warm, natural inflection.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-signal text-lg font-bold">01.</span>
                  <div>
                    <p className="text-sm font-semibold text-paper-100">Live Continuous Microphone Input</p>
                    <p className="text-xs text-paper-300">Hands-free voice recognition with live visual transcription.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-signal text-lg font-bold">02.</span>
                  <div>
                    <p className="text-sm font-semibold text-paper-100">Sub-Second Thinking Latency</p>
                    <p className="text-xs text-paper-300">Ultra-low latency conversational engine powered by next-generation neural intelligence.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-signal text-lg font-bold">03.</span>
                  <div>
                    <p className="text-sm font-semibold text-paper-100">Natural Multi-Voice Selector</p>
                    <p className="text-xs text-paper-300">Choose between sweet studio voices (Ava, Samantha, Jenny, Daniel).</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/app"
                  className="rounded-full bg-signal px-6 py-3 text-xs sm:text-sm font-bold text-ink-950 hover:bg-signal-soft transition-colors shadow-md"
                >
                  Try Live Voice Call in App
                </Link>
              </div>
            </div>

            {/* Glowing Voice Orb Visual Showcase */}
            <div className="flex items-center justify-center">
              <div className="relative flex h-72 w-72 sm:h-80 sm:w-80 items-center justify-center rounded-full border border-line bg-ink-900/90 shadow-2xl backdrop-blur-xl">
                <div className="absolute h-56 w-56 rounded-full bg-signal/20 blur-3xl animate-pulse" />
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-tr from-signal via-signal-soft to-amber-200 text-ink-950 shadow-2xl shadow-signal/30">
                  <div className="flex items-center gap-1.5">
                    <span className="h-6 w-2 rounded-full bg-ink-950 animate-bounce" />
                    <span className="h-10 w-2 rounded-full bg-ink-950 animate-bounce [animation-delay:0.15s]" />
                    <span className="h-8 w-2 rounded-full bg-ink-950 animate-bounce [animation-delay:0.3s]" />
                    <span className="h-4 w-2 rounded-full bg-ink-950 animate-bounce [animation-delay:0.45s]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl text-paper-100">
              Engineered for Speed, Clarity & Audio
            </h2>
            <p className="mt-3 text-sm sm:text-base text-paper-300">
              Everything you need to digest knowledge and create spoken audio effortlessly.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES_LIST.map((f) => (
              <div
                key={f.title}
                className="glass-panel p-6 sm:p-7 transition-all duration-300 hover:border-signal/40 hover:-translate-y-1"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-paper-100">{f.title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-paper-300">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-line bg-ink-900/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl text-paper-100">How It Works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {[
              { num: "01", title: "Upload or Type", desc: "Drop any PDF, document, or start speaking directly." },
              { num: "02", title: "Smart Analysis", desc: "Sona AI classifies content and suggests the best actions." },
              { num: "03", title: "Audio & Q&A", desc: "Generate spoken audio briefings, quizzes, and breakdowns." },
              { num: "04", title: "Save & Resume", desc: "Every chat is auto-titled and saved in your history drawer." },
            ].map((step) => (
              <div key={step.num} className="glass-panel p-6 text-left">
                <p className="font-heading text-2xl font-bold text-signal">{step.num}</p>
                <h4 className="mt-3 text-sm font-semibold text-paper-100">{step.title}</h4>
                <p className="mt-1 text-xs text-paper-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-signal/30 bg-gradient-to-b from-signal/15 via-ink-900 to-ink-950 p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-signal/5 blur-2xl" />
          <h2 className="font-display text-3xl sm:text-5xl text-paper-100 leading-tight relative z-10">
            Speed Up the Way You Digest Information.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm sm:text-base text-paper-200 relative z-10">
            Start using Sona AI today for free. Experience real-time speech, instant document understanding, and voice audio.
          </p>
          <div className="mt-8 relative z-10">
            <Link
              href="/sign-up"
              className="inline-block rounded-full bg-signal px-8 py-3.5 text-sm font-bold text-ink-950 hover:bg-signal-soft transition-all shadow-xl shadow-signal/25 hover:scale-105"
            >
              Get Started with Sona AI Free
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line py-10 bg-ink-950 text-paper-300 text-xs sm:text-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={22} height={22} className="rounded-md" />
            <span className="font-heading font-semibold text-paper-100">Sona AI</span>
            <span className="text-paper-300/60">— Voice & Document Intelligence</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-paper-200">
            <Link href="/app/student" className="hover:text-paper-100 transition-colors">Student Mode</Link>
            <Link href="/app/business" className="hover:text-paper-100 transition-colors">Business Mode</Link>
            <Link href="/app/creator" className="hover:text-paper-100 transition-colors">Creator Mode</Link>
            <Link href="/app/reading" className="hover:text-paper-100 transition-colors">Reading Mode</Link>
            <Link href="/login" className="hover:text-paper-100 transition-colors">Log In</Link>
          </div>

          <p className="text-xs text-paper-300/60">© {new Date().getFullYear()} Sona AI. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
