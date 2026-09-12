# 🚂 Sona AI — Railway Production Deployment Guide

> **Deploy Sona AI as a long-lived Node.js container on Railway with full support for AI Speech-to-Speech, Audio Streaming, and WebSockets.**

---

## Why Railway for Sona AI?
- **No Serverless Timeouts**: Unlike Vercel's strict 10s–15s function execution limit, Railway runs a persistent Node.js / Docker container with unlimited execution duration.
- **Full Streaming & WebSockets**: Enables unbroken bidirectional speech-to-speech, real-time AI audio streaming, and high-throughput document processing.
- **Automatic SSL & Custom Domains**: Railway automatically provisions HTTPS certificates for your `.up.railway.app` or custom domains.

---

## 1. Quick Deploy Steps on Railway

1. **Log in to Railway**: Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **Create New Project**:
   - Click **+ New Project** ➔ **Deploy from GitHub repo**.
   - Select your repository (`orbit-flow-labs/SUNO-AI` or your fork).
3. **Configure Build Settings**:
   - Railway will automatically detect the **`Dockerfile`** or **`railway.json`** created in the repository.
   - Set **Root Directory** to `/`.

---

## 2. Environment Variables on Railway

In your Railway project dashboard, go to the **Variables** tab and add the following:

| Environment Variable | Description | Example / Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://znxoktfzeprragrgkmtj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Anon Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret | `eyJhbGciOi...` |
| `GROQ_API_KEY` | Groq API Key (for LLM inference) | `gsk_...` |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API Key (Speech-to-Text) | `...` |
| `NEXT_PUBLIC_APP_URL` | Your Railway Domain (see Step 3) | `https://your-app.up.railway.app` |
| `NODE_ENV` | Production Environment | `production` |
| `PORT` | Container Port | `3000` |

---

## 3. Generate Domain & Networking

1. In your Railway service settings, go to the **Networking** tab.
2. Under **Public Networking**, click **Generate Domain** (e.g. `sona-ai-production.up.railway.app`) or attach your custom domain.
3. Copy this URL and set it as `NEXT_PUBLIC_APP_URL` in your Railway Variables.

---

## 4. Update Supabase Authentication & Google OAuth

Now connect your live Railway domain to Supabase:

### In Supabase Dashboard:
1. Go to **Authentication ➔ URL Configuration**:
   - **Site URL**: `https://your-app.up.railway.app`
   - **Redirect URLs (Allow list)**:
     - `https://your-app.up.railway.app/**`
     - `https://your-app.up.railway.app/auth/callback`
     - `http://localhost:3000/**`

### In Google Cloud Console (if using Google OAuth):
1. Go to **APIs & Services ➔ Credentials ➔ OAuth 2.0 Client IDs**.
2. Under **Authorized JavaScript origins**:
   - Add `https://your-app.up.railway.app`
3. Under **Authorized redirect URIs**:
   - Ensure Supabase's callback URL is present:
     `https://znxoktfzeprragrgkmtj.supabase.co/auth/v1/callback`

---

## 5. Verify Speech-to-Speech & Voice Calls
1. Open your live Railway deployment (`https://your-app.up.railway.app/app`).
2. Click the **Voice Call** / **Speech-to-Speech** button in the chat composer.
3. Speak into your microphone:
   - Voice transcription and audio streaming will stream continuously without serverless timeout interruptions.
