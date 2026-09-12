# 🚀 Sona AI — Production Deployment Guide

> **Step-by-step instructions for deploying Sona AI on Vercel and Supabase Cloud.**

---

## 1. Supabase Cloud Setup

1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Note your **Project URL**, **anon public key**, and **service_role secret key** from **Project Settings → API**.
3. Open the **SQL Editor** in your Supabase dashboard and run the migrations in sequence:
   - Run `supabase/migrations/0001_init.sql`
   - Run `supabase/migrations/0002_admin_enhancements.sql`
4. Under **Authentication → Providers**:
   - Ensure **Email** is enabled.
   - (Optional) Enable **Google OAuth** by providing your Google Client ID and Secret.
5. Under **Storage**:
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
