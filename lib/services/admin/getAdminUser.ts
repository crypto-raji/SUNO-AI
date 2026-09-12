import { createClient } from "@/lib/supabase/server";

export async function getAdminUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, error: "Unauthorized", status: 401 } as const;
  }

  const { data: profile } = await supabase.from("profiles").select("id, email, username, is_admin").eq("id", user.id).single();

  if (!profile?.is_admin) {
    return { user: null, profile: null, error: "Forbidden: Admin privileges required", status: 403 } as const;
  }

  return { user, profile, error: null, status: 200 } as const;
}
