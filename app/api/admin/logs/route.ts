import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/services/admin/getAdminUser";
import { serviceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await getAdminUser();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));

  const supabase = serviceClient();

  const { data: logs, error } = await supabase
    .from("admin_audit_logs")
    .select("id, admin_id, action, target_id, details, ip_address, created_at, profiles!admin_audit_logs_admin_id_fkey(email, username)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // If the table was just created and not migrated yet or query fails, return empty gracefully
    return NextResponse.json({ logs: [] });
  }

  const enrichedLogs = (logs ?? []).map((l) => {
    const p = (l as unknown as { profiles: { email?: string; username?: string } | null }).profiles;
    return {
      id: l.id,
      adminId: l.admin_id,
      adminName: p?.username ? `@${p.username}` : p?.email ?? "Admin",
      action: l.action,
      targetId: l.target_id,
      details: l.details,
      ipAddress: l.ip_address,
      createdAt: l.created_at,
    };
  });

  return NextResponse.json({ logs: enrichedLogs });
}
