import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function ensureUserProfile(supabase: SupabaseClient, user: User) {
  try {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User";

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? "",
          name: fullName,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          default_mode: "general",
        },
        { onConflict: "id" }
      );
    }
  } catch (err) {
    console.warn("[ensureUserProfile] Could not ensure profile:", err);
  }
}
