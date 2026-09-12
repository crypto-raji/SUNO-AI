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
    .single();

  if (!profile) return <AuthRedirect to="/login" />;

  const { count: referralCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <ProfileView
      profile={profile}
      referralCount={referralCount ?? 0}
      siteUrl={siteUrl}
    />
  );
}
