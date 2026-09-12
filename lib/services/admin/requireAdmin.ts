import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the current user is an admin (profiles.is_admin = true).
 * Redirects non-admins away rather than rendering anything — never trust
 * a frontend-only check for the admin surface.
 */
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();

  if (!profile?.is_admin) redirect("/app");

  return user;
}
