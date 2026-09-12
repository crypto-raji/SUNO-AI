# 🏆 Hackathon Judges & Evaluation Guide: Sona AI

> **A quick-reference guide designed to help judges evaluate Sona AI efficiently.**

---

## 👥 Team & Repository Metadata

- **Project Name:** Sona AI
- **Project Owner / Lead:** [Christian01-del](https://github.com/Christian01-del)
- **AI & Backend Developer:** [reactjay](https://github.com/reactjay)
- **Core Stack:** Next.js 14 (App Router), TypeScript, Groq LPU™ (`llama-3.3-70b-versatile`), AssemblyAI, Supabase (PostgreSQL + RLS + Storage)

---

## 🎯 The Problem Sona AI Solves

Modern knowledge workers and students are overwhelmed by dense documents, lengthy audio recordings, and complex research material. Most conversational AI interfaces have critical limitations:
1. **Hallucinations & Disconnect:** Standard chat tools generate answers without showing the user the underlying source paragraph.
2. **One-Size-Fits-All Tone:** Generic responses lack domain specialization (e.g. Socratic questioning for learners vs. ROI/SWOT analyses for executives).
3. **High Latency:** Traditional API calls often take 4–10 seconds per response, interrupting human thought flow.
4. **Poor Admin & Operational Control:** Many hackathon prototypes lack real production readiness (audit trails, maintenance controls, health monitoring).

---

## 💡 Key Innovations & What Makes Sona AI Special

### 1. Ultra-Low Latency Inference with Groq LPU™
By deploying `llama-3.3-70b-versatile` through Groq's Language Processing Units (LPUs), Sona AI delivers sub-second response streaming, enabling a fluid, conversational experience.

### 2. Split-Screen Document Co-Pilot with Direct Citations
- **How to test:** Upload any PDF/DOCX or ask about a document in a session. Click the Split-Screen toggle icon in the top header.
- **Why it matters:** Sona AI references specific sections of the document, and clicking on a citation badge automatically scrolls and highlights the exact paragraph in the left viewer pane.

### 3. Real-Time Conversational Voice Call
- **How to test:** Click the **Voice Call** button in the top navigation bar of `/app`.
- **Why it matters:** Voice Call provides a hands-free, bidirectional conversational experience with live audio waveform visuals and instant spoken turn-taking.

### 4. 5 Tailored Cognitive Modes
Switching modes dynamically adjusts the system prompt, formatting style, and suggested actions:
- **Student Mode:** Generates flashcards, analogies, and quizzes.
- **Business Mode:** Delivers executive summaries, memos, and cost-benefit frameworks.
- **Creator Mode:** Produces scripts, hooks, and content outlines.
- **Reading Mode:** Provides deep thematic breakdown and chapter analyses.
- **General Mode:** All-around high-speed problem solver.

### 5. Production-Ready Admin Command Center & Maintenance Mode
- **How to test:** Log in as an admin and navigate to `/admin`.
- **Features:** Live stats dashboard, real-time user management & search, platform audit logs, database/API diagnostics, and an instant Maintenance Mode toggle with Admin Bypass.

---

## 🧭 Step-by-Step Judge Walkthrough

### Step 1: Account Creation & Authentication
1. Visit the app and navigate to `/sign-up`.
2. Notice the modern UI with the official Google OAuth option and password authentication.
3. On account creation, users are permanently assigned an avatar profile without needing manual configuration.

### Step 2: Exploring the Multi-Persona Workspace (`/app`)
1. Click between the modes (**Student**, **Business**, **Creator**, **Reading**, **General**) at the top of the chat.
2. Try typing a prompt or clicking one of the dynamically tailored quick-prompt chips.
3. Observe the sub-second streaming response from the Groq LPU engine.

### Step 3: Document Upload & Split-Screen Co-Pilot
1. Upload a PDF, Word document (`.docx`), or text file using the paperclip upload button.
2. Ask Sona AI to analyze the document.
3. Switch into Split-Screen Co-Pilot mode to view your document side-by-side with citations.

### Step 4: Live Conversational Voice Call
1. Click the **Voice Call** button in the header.
2. Speak naturally to Sona AI; the system will transcribe your speech in real time, query Groq, and speak the answer back with a reactive audio waveform.

### Step 5: Admin Panel & Maintenance Verification
1. Access `/admin` (ensure your user has `is_admin = true` in Supabase).
2. Inspect the **Diagnostics** tab to run live health checks on Supabase and Groq.
3. Toggle **Maintenance Mode** in the Overview tab to test platform lockdown with administrative bypass.

---

## 📊 Judging Criteria Alignment

| Criteria | How Sona AI Excels |
|---|---|
| **Technical Execution** | Full Next.js 14 App Router implementation, Server Actions, resilient Groq fallback chains, AssemblyAI multimodal STT, strict TypeScript typing, and optimized PostgreSQL indexes. |
| **Design & UX** | Glassmorphic dark aesthetic, fluid responsive layout, official vector icons, smooth transitions, and intuitive split-screen co-pilot. |
| **Innovation & Impact** | Solves LLM hallucination through interactive direct document citations and brings conversational intelligence to life via hands-free voice calls. |
| **Scalability & Security** | Supabase Row Level Security (RLS) on all tables, server-verified admin authorization, zero console secret leaks, and maintenance mode controls. |

---

## 🔒 Security & Code Integrity Highlights

- **Zero Secret Exposure:** Verified that no API keys or service role secrets are exposed in browser bundles, network payloads, or console logs.
- **Strict Role-Based Access:** Standard users cannot access `/admin` or invoke admin API routes, even if they attempt direct POST/PATCH requests.
- **Fail-Safe AI Architecture:** The backend features automated model fallback arrays to ensure 99.9% uptime even under high traffic.
