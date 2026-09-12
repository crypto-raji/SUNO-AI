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
  const type = searchParams.get("type") || "all"; // 'all' | 'documents' | 'audio'
  const status = searchParams.get("status") || "all"; // 'all' | 'failed' | 'ready' | 'processing'
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));

  const supabase = serviceClient();

  let documents: Array<{
    id: string;
    filename: string;
    file_type: string;
    file_size: number | null;
    status: string;
    detected_type: string | null;
    error_message: string | null;
    created_at: string;
    user_id: string;
    user_email?: string;
  }> = [];

  let audioFiles: Array<{
    id: string;
    title: string;
    provider: string | null;
    status: string;
    duration_seconds: number | null;
    error_message: string | null;
    created_at: string;
    user_id: string;
    user_email?: string;
  }> = [];

  if (type === "all" || type === "documents") {
    let docQuery = supabase
      .from("documents")
      .select("id, filename, file_type, file_size, status, detected_type, error_message, created_at, user_id, profiles!documents_user_id_fkey(email, username)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status === "failed") {
      docQuery = docQuery.eq("status", "failed");
    } else if (status === "ready") {
      docQuery = docQuery.eq("status", "ready");
    } else if (status === "processing") {
      docQuery = docQuery.in("status", ["uploading", "uploaded", "extracting", "analyzing"]);
    }

    const { data: docData } = await docQuery;
    documents = (docData ?? []).map((d) => {
      const p = (d as unknown as { profiles: { email?: string; username?: string } | null }).profiles;
      return {
        id: d.id,
        filename: d.filename,
        file_type: d.file_type,
        file_size: d.file_size,
        status: d.status,
        detected_type: d.detected_type,
        error_message: d.error_message,
        created_at: d.created_at,
        user_id: d.user_id,
        user_email: p?.username ? `@${p.username}` : p?.email ?? "Unknown",
      };
    });
  }

  if (type === "all" || type === "audio") {
    let audioQuery = supabase
      .from("audio_files")
      .select("id, title, provider, status, duration_seconds, error_message, created_at, user_id, profiles!audio_files_user_id_fkey(email, username)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status === "failed") {
      audioQuery = audioQuery.eq("status", "failed");
    } else if (status === "ready") {
      audioQuery = audioQuery.eq("status", "ready");
    } else if (status === "processing") {
      audioQuery = audioQuery.in("status", ["pending", "generating"]);
    }

    const { data: aData } = await audioQuery;
    audioFiles = (aData ?? []).map((a) => {
      const p = (a as unknown as { profiles: { email?: string; username?: string } | null }).profiles;
      return {
        id: a.id,
        title: a.title,
        provider: a.provider,
        status: a.status,
        duration_seconds: a.duration_seconds,
        error_message: a.error_message,
        created_at: a.created_at,
        user_id: a.user_id,
        user_email: p?.username ? `@${p.username}` : p?.email ?? "Unknown",
      };
    });
  }

  return NextResponse.json({
    documents,
    audioFiles,
  });
}
