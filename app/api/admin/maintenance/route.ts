import { NextRequest, NextResponse } from "next/server";
import { createClient, serviceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/services/admin/audit";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Never trust a client-supplied "isAdmin" flag — re-check server-side against the DB.
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { enabled, message } = (await req.json()) as { enabled: boolean; message?: string };

  const admin = serviceClient();
  const { error } = await admin
    .from("app_settings")
    .update({
      maintenance_mode: enabled,
      ...(message !== undefined ? { maintenance_message: message } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: "Couldn't update maintenance mode. Please try again." }, { status: 500 });
  }

  await logAdminAction({
    adminId: user.id,
    action: "toggle_maintenance",
    details: { enabled, message },
  });

  return NextResponse.json({ ok: true });
}

