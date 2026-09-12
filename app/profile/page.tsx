import { createClient } from "@/lib/supabase/server";
import ProfileView from "@/components/profile/ProfileView";
import AuthRedirect from "@/components/auth/AuthRedirect";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AuthRedirect to="/login" />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const userProfile = profile || {
    id: user.id,
    email: user.email ?? "",
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
    avatar_url: user.user_metadata?.avatar_url ?? null,
    plan: "free" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { count: referralCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://suno-ai-production.up.railway.app";

  return (
    <ProfileView
      profile={userProfile as any}
      referralCount={referralCount ?? 0}
      siteUrl={siteUrl}
    />
  );
}
