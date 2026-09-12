"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState(refCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const randomAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username || randomSeed)}`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          username,
          avatar_url: randomAvatar,
          picture: randomAvatar,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message || "We couldn't create your account. Please check your details and try again.");
      setLoading(false);
      return;
    }

    if (data.user && referral) {
      // Credit the referral server-side, where RLS can be safely bypassed
      // for the one write that needs to touch another user's row.
      await fetch("/api/referrals/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, referralCode: referral }),
      });
    }

    router.push("/app");
    router.refresh();
  }

  async function handleGoogle() {
    const supabase = createClient();
    const refParam = referral ? `&ref=${encodeURIComponent(referral)}` : "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/app${refParam}` },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-paper-100">
      <div className="glass-panel w-full max-w-sm p-8">
        <h1 className="font-display text-2xl">Create your account</h1>
        <p className="mt-1 text-sm text-paper-300">Start understanding your information faster.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Name" value={name} onChange={setName} required />
          <Field label="Username" value={username} onChange={setUsername} required />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={8} />
          <Field label="Referral code (optional)" value={referral} onChange={setReferral} required={false} />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-signal py-2.5 text-sm font-medium text-ink-950 hover:bg-signal-soft disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <button
          onClick={handleGoogle}
          className="glass-button mt-3 w-full flex items-center justify-center gap-2.5 py-2.5 font-medium transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="mt-6 text-center text-sm text-paper-300">
          Already have an account?{" "}
          <Link href="/login" className="text-signal hover:text-signal-soft">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-paper-100" />}>
      <SignUpForm />
    </Suspense>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block text-sm text-paper-200">
      {props.label}
      <input
        type={props.type ?? "text"}
        value={props.value}
        required={props.required}
        minLength={props.minLength}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-ink-900 px-3 py-2 text-paper-100 outline-none focus:border-signal/50"
      />
    </label>
  );
}
