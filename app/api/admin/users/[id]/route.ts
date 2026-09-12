import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/services/admin/getAdminUser";
import { serviceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/services/admin/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAdminUser();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = params.id;
  const supabase = serviceClient();

  const [
    { data: profile, error: profileError },
    { count: sessionCount },
    { count: documentCount },
    { count: audioCount },
    { count: referralCount },
    { data: recentSessions },
    { data: userUsage },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("audio_files").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", userId),
    supabase.from("sessions").select("id, title, mode, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(5),
    supabase.from("usage").select("service, tokens, characters").eq("user_id", userId),
  ]);

  if (profileError || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const usageByService = (userUsage ?? []).reduce<Record<string, { tokens: number; characters: number; calls: number }>>(
    (acc, row) => {
      if (!acc[row.service]) acc[row.service] = { tokens: 0, characters: 0, calls: 0 };
      acc[row.service].tokens += row.tokens ?? 0;
      acc[row.service].characters += row.characters ?? 0;
      acc[row.service].calls += 1;
      return acc;
    },
    {}
  );

  return NextResponse.json({
    profile,
    stats: {
      sessionCount: sessionCount ?? 0,
      documentCount: documentCount ?? 0,
      audioCount: audioCount ?? 0,
      referralCount: referralCount ?? 0,
    },
    recentSessions: recentSessions ?? [],
    usageByService,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAdminUser();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = params.id;
  const body = await req.json();
  const { is_admin, default_mode } = body as { is_admin?: boolean; default_mode?: string };

  const supabase = serviceClient();

  // Protect against demoting self
  if (userId === auth.user.id && is_admin === false) {
    return NextResponse.json({ error: "You cannot remove your own admin privileges." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof is_admin === "boolean") updates.is_admin = is_admin;
  if (default_mode) updates.default_mode = default_mode;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await logAdminAction({
    adminId: auth.user.id,
    action: "update_user_role",
    targetId: userId,
    details: { changes: updates, updatedUserEmail: updatedProfile.email },
  });

  return NextResponse.json({ profile: updatedProfile });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAdminUser();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = params.id;

  if (userId === auth.user.id) {
    return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
  }

  const supabase = serviceClient();

  // Get user details for audit
  const { data: targetUser } = await supabase.from("profiles").select("email, username").eq("id", userId).single();

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    // If auth admin delete isn't available, delete profile cascade
    const { error: profileDeleteErr } = await supabase.from("profiles").delete().eq("id", userId);
    if (profileDeleteErr) {
      return NextResponse.json({ error: profileDeleteErr.message }, { status: 500 });
    }
  }

  await logAdminAction({
    adminId: auth.user.id,
    action: "delete_user",
    targetId: userId,
    details: { deletedEmail: targetUser?.email, deletedUsername: targetUser?.username },
  });

  return NextResponse.json({ ok: true });
}
