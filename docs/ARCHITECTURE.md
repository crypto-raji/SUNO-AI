# 🏛️ Sona AI — System Architecture & Technical Specifications

> **Comprehensive architectural overview of Sona AI's frontend, backend, AI orchestration layer, and database schema.**

---

## 1. High-Level Architecture

Sona AI is built as a cloud-native, serverless-ready full-stack application using **Next.js 14 App Router** and **Supabase**.

```
+-------------------------------------------------------------------------+
|                               Client Layer                              |
|  - Next.js App Router (React Server Components + Client Hydration)      |
|  - Split-Screen Co-Pilot Document Viewer                                |
|  - Real-Time Voice Call Interface (Web Speech + AudioContext)           |
|  - Admin Command Center Dashboard                                       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                          Edge & Middleware Layer                        |
|  - Next.js middleware.ts (Session validation & Maintenance Guard)       |
|  - Admin Bypass validation on protected routes                          |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                          API & Backend Services                         |
|  - /api/chat: Multi-turn streaming with persona system prompts          |
|  - /api/upload: Document extraction (pdf-parse, mammoth) & AssemblyAI   |
|  - /api/admin/*: Stats, user management, audit logging & maintenance    |
|  - AI Orchestrator: Groq LPU API with automated model fallback chain    |
+-------------------+--------------------------------+--------------------+
                    |                                |
                    v                                v
+------------------------------------+   +--------------------------------+
|         AI Inference Layer         |   |     Persistence & Storage      |
|  - Groq Cloud LPU Engine           |   |  - Supabase PostgreSQL (RLS)   |
|    - llama-3.3-70b-versatile       |   |  - Private Document Buckets    |
|    - qwen/qwen-2.5-coder-32b       |   |  - Admin Audit Log Tables      |
|    - llama-3.1-8b-instant          |   |  - Optimized Composite Indexes |
+------------------------------------+   +--------------------------------+
```

---

## 2. AI Orchestration Engine (`lib/services/ai/groq.ts`)

### Model Selection & Fallback Mechanism
To ensure zero downtime during peak usage or unexpected provider rate limits, Sona AI implements a resilient candidate fallback chain:

1. **Primary Model:** `llama-3.3-70b-versatile` (Exceptional reasoning, synthesis, and structured citations)
2. **Secondary Model:** `qwen/qwen-2.5-coder-32b` or `llama-3.1-70b-versatile`
3. **Tertiary Model:** `llama-3.1-8b-instant` (Ultra-fast response recovery)

### Streaming & Context Injection
- Context from uploaded documents is sliced into semantic chunks and dynamically injected into the system prompt with citation tags (e.g. `[1]`, `[2]`).
- The response is streamed token-by-token directly to the client via `ReadableStream`.

---

## 3. Speech & Multimodal Processing

### Speech-to-Text (STT) via AssemblyAI (`lib/services/stt/assemblyai.ts`)
- Audio files (`.mp3`, `.wav`, `.m4a`, `.mp4`) uploaded by the user are sent to AssemblyAI for asynchronous transcription.
- The returned transcript is parsed into the active session context, allowing the user to immediately ask questions about lecture recordings or meetings.

### Real-Time Voice Call (`components/chat/VoiceCallModal.tsx`)
- Bi-directional voice conversation utilizes the browser's native `SpeechRecognition` / `webkitSpeechRecognition` for instant local voice capture.
- Real-time audio waveform visualizer runs via `AudioContext` and `AnalyserNode`.
- Responses are synthesized seamlessly using the browser's `SpeechSynthesis` engine.

---

## 4. Database Schema & Security Architecture

### Tables
- **`profiles`:** User metadata, referral codes, default mode, avatar URLs, and `is_admin` boolean flag.
- **`sessions`:** Chat sessions mapped to specific users and cognitive modes.
- **`messages`:** Chat history with role (`user` / `assistant`), text, audio status, and citations.
- **`documents`:** Uploaded files with extracted text content and storage file paths.
- **`app_settings`:** Key-value store for global settings such as `maintenance_mode`.
- **`admin_audit_logs`:** Secure audit trail for administrative actions (maintenance toggles, role updates, data removals).

### Row Level Security (RLS)
All tables enforce Row Level Security:
- Users can only read/write records where `user_id = auth.uid()`.
- Admin-level actions are authenticated on the server side using the `SUPABASE_SERVICE_ROLE_KEY` after verifying the user's admin role via `profiles`.

### Performance Indexes
Composite indexes are applied for high-concurrency efficiency:
- `idx_sessions_user_updated`: `(user_id, updated_at DESC)`
- `idx_messages_session_created`: `(session_id, created_at ASC)`
- `idx_documents_session`: `(session_id, created_at DESC)`
- `idx_admin_audit_logs_created`: `(created_at DESC)`
