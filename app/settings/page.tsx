import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/settings/SettingsForm";
import AuthRedirect from "@/components/auth/AuthRedirect";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AuthRedirect to="/login" />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_mode")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-2xl text-paper-100">Settings</h1>
      <p className="mt-1 text-sm text-paper-300">Keep this simple — just what you actually need to change.</p>

      <SettingsForm initialDefaultMode={profile?.default_mode ?? "general"} />
    </div>
  );
}
