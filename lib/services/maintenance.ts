import { serviceClient } from "@/lib/supabase/server";

export async function isMaintenanceMode(): Promise<{ enabled: boolean; message: string }> {
  const supabase = serviceClient();
  const { data } = await supabase
    .from("app_settings")
    .select("maintenance_mode, maintenance_message")
    .eq("id", 1)
    .maybeSingle();

  return {
    enabled: data?.maintenance_mode ?? false,
    message:
      data?.maintenance_message ??
      "Sona AI is currently under maintenance. We're working on improvements and will be back shortly.",
  };
}
