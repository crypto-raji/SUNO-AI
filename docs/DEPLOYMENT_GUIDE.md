# 🚀 Sona AI — Production Deployment Guide

> **Deploy Sona AI to Railway (Recommended for AI Speech-to-Speech & WebSockets) or Vercel & Supabase Cloud.**
>
> 💡 *For persistent Node.js runtime with full speech-to-speech audio streaming and zero serverless execution timeouts, follow the [Railway Deployment Guide](file:///Users/japheth/Documents/sona-ai/docs/RAILWAY_DEPLOYMENT_GUIDE.md).*

---

## 1. Supabase Cloud Setup

1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Note your **Project URL**, **anon public key**, and **service_role secret key** from **Project Settings → API**.
3. Open the **SQL Editor** in your Supabase dashboard and run the migrations in sequence:
   - Run `supabase/migrations/0001_init.sql`
   - Run `supabase/migrations/0002_admin_enhancements.sql`
4. Under **Authentication → URL Configuration**:
   - **Site URL**: `https://your-production-domain.vercel.app` (or your custom domain)
   - **Redirect URLs (Allow list)**:
     - `https://your-production-domain.vercel.app/**`
     - `https://your-production-domain.vercel.app/auth/callback`
     - `http://localhost:3000/**` (for local development)
5. Under **Authentication → Providers**:
   - Ensure **Email** is enabled.
   - For **Google OAuth**:
     - In **Google Cloud Console** (Credentials → OAuth 2.0 Client IDs), set **Authorized redirect URI** to Supabase's callback URL:
       `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
     - In **Supabase Dashboard** (Authentication → Providers → Google), paste your **Google Client ID** and **Google Client Secret**.
6. Under **Storage**:
   - Verify the `documents` and `audio` buckets are created as private buckets.

---

## 2. Vercel Deployment

1. Push your repository to GitHub (e.g. `orbit-flow-labs/SUNO-AI`).
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import the `SUNO-AI` repository.
4. Set the **Framework Preset** to **Next.js**.
5. Configure the **Environment Variables** in Vercel:

| Environment Variable | Description | Example / Note |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret | `eyJhbGciOi...` (Server-only) |
| `GROQ_API_KEY` | Groq Cloud API Key | `gsk_...` (Server-only) |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API Key | Optional for Audio STT |
| `NEXT_PUBLIC_APP_URL` | Public Production Domain | `https://sona-ai.vercel.app` |

6. Click **Deploy**. Vercel will build and launch your production instance.

---

## 3. Creating Your First Administrator Account

1. Sign up for a user account on your live deployed app (or via `/sign-up`).
2. Open your **Supabase SQL Editor** and run:
   ```sql
   UPDATE profiles 
   SET is_admin = true 
   WHERE email = 'your-email@domain.com';
   ```
3. Refresh your session on the app and visit `/admin`. You will now have access to the Admin Command Center.

---

## 4. Testing Maintenance Mode with Admin Bypass

1. In `/admin`, toggle **Maintenance Mode** to **ON**.
2. Open an Incognito window (unauthenticated or regular user) and navigate to `/app`.
3. Verify that the regular user is redirected to `/maintenance`.
4. In your admin window, refresh `/app` and verify you can continue using the application with full admin bypass.
