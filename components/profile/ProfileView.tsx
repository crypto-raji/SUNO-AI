"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CopyButton from "@/components/ui/CopyButton";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  referral_code: string;
  default_mode: string;
  is_admin: boolean;
  created_at: string;
}

export default function ProfileView({
  profile: initialProfile,
  referralCount,
  siteUrl,
}: {
  profile: Profile;
  referralCount: number;
  siteUrl: string;
}) {
  const router = useRouter();
  const [profile] = useState<Profile>(initialProfile);
  const [loggingOut, setLoggingOut] = useState(false);

  const fallbackAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
    profile.username || profile.email || profile.id
  )}`;

  const currentAvatar = profile.avatar_url || fallbackAvatar;

  async function handleLogOut() {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const referralLink = `${siteUrl}/sign-up?ref=${profile.referral_code}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12 space-y-6 animate-in fade-in duration-200">
      {/* Top Bar with Title and Close / Back Button */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-paper-100">Profile & Settings</h1>
          <p className="text-xs text-paper-300/70">Manage your account identity and referral program</p>
        </div>

        <Link
          href="/app"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-ink-900 text-paper-300 hover:bg-ink-800 hover:text-paper-100 transition shadow-sm"
          title="Close profile and return to app"
        >
          ✕
        </Link>
      </div>

      {/* Avatar Card */}
      <div className="rounded-2xl border border-line bg-ink-900/60 p-5 backdrop-blur-glass">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-line bg-ink-950 shrink-0 shadow-md">
            <Image
              src={currentAvatar}
              alt="Avatar"
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="font-display text-lg font-bold text-paper-100 truncate">
                {profile.name || profile.username || "User"}
              </h2>
              {profile.is_admin && (
                <span className="rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 text-[10px] font-semibold text-signal">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-paper-300 truncate">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="space-y-3 rounded-2xl border border-line bg-ink-900/60 p-5 backdrop-blur-glass">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-paper-300/80 border-b border-line pb-2">
          Account Details
        </h3>
        <Field label="Name" value={profile.name || "—"} />
        <Field label="Username" value={profile.username ? `@${profile.username}` : "—"} />
        <Field label="Email" value={profile.email} />
        <Field label="Preferred Mode" value={profile.default_mode || "general"} />
        <Field
          label="Member since"
          value={profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
        />
        {profile.is_admin && (
          <div className="pt-2 border-t border-line flex items-center justify-between">
            <span className="text-xs text-paper-300">Admin Privileges</span>
            <Link
              href="/admin"
              className="text-xs font-semibold text-signal hover:underline flex items-center gap-1"
            >
              <span>Open Admin Dashboard →</span>
            </Link>
          </div>
        )}
      </div>

      {/* Referrals Program */}
      <div className="rounded-2xl border border-line bg-ink-900/60 p-5 backdrop-blur-glass space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-paper-300/80">
            Referrals & Growth
          </h3>
          <span className="rounded-full border border-signal/20 bg-signal/10 px-2 py-0.5 text-[11px] font-semibold text-signal font-mono">
            {referralCount} invite{referralCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-paper-300/70">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-xl border border-line bg-ink-950 px-3 py-2 font-mono text-xs font-semibold text-signal">
                {profile.referral_code}
              </code>
              <CopyButton text={profile.referral_code} label="Copy code" />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-paper-300/70">Shareable Signup Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-xl border border-line bg-ink-950 px-3 py-2 font-mono text-xs text-paper-200">
                {referralLink}
              </code>
              <CopyButton text={referralLink} label="Copy link" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions: Back & Log Out */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Link
          href="/app"
          className="w-full sm:flex-1 rounded-xl border border-line bg-ink-900/80 py-2.5 text-center text-xs font-medium text-paper-200 hover:bg-ink-800 hover:text-paper-100 transition shadow-sm"
        >
          ← Back to Workspace
        </Link>

        <button
          onClick={handleLogOut}
          disabled={loggingOut}
          className="w-full sm:flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Log Out"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="text-paper-300">{label}</span>
      <span className="font-medium text-paper-100 capitalize">{value}</span>
    </div>
  );
}
