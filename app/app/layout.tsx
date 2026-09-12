import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isMaintenanceMode } from "@/lib/services/maintenance";
import MaintenanceScreen from "@/components/ui/MaintenanceScreen";
import AppClientShell from "@/components/layout/AppClientShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, username, avatar_url, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const { enabled, message } = await isMaintenanceMode();
  if (enabled && !profile?.is_admin) {
    return <MaintenanceScreen message={message} />;
  }

  return (
    <AppClientShell
      user={{ id: user.id, email: user.email }}
      profile={profile}
    >
      {children}
    </AppClientShell>
  );
}
