import { serviceClient } from "@/lib/supabase/server";

export interface LogAdminActionParams {
  adminId: string;
  action: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function logAdminAction({
  adminId,
  action,
  targetId = null,
  details = {},
  ipAddress = null,
}: LogAdminActionParams) {
  try {
    const admin = serviceClient();
    await admin.from("admin_audit_logs").insert({
      admin_id: adminId,
      action,
      target_id: targetId,
      details,
      ip_address: ipAddress,
    });
  } catch (err) {
    // Non-blocking: failures to log audit actions should not bring down the main admin operation
    console.error("Failed to log admin action:", err);
  }
}
