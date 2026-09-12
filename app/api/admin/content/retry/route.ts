import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/services/admin/getAdminUser";
import { serviceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/services/admin/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await getAdminUser();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { type, id } = (await req.json()) as { type: "document" | "audio"; id: string };

  if (!id || !type) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  const supabase = serviceClient();

  if (type === "document") {
    const { error } = await supabase
      .from("documents")
      .update({
        status: "extracting",
        error_message: null,
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (type === "audio") {
    const { error } = await supabase
      .from("audio_files")
      .update({
        status: "pending",
        error_message: null,
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: auth.user.id,
    action: "retry_job",
    targetId: id,
    details: { type, id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminUser();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { type, id } = (await req.json()) as { type: "document" | "audio"; id: string };

  if (!id || !type) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  const supabase = serviceClient();

  if (type === "document") {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (type === "audio") {
    const { error } = await supabase.from("audio_files").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: auth.user.id,
    action: "delete_content",
    targetId: id,
    details: { type, id },
  });

  return NextResponse.json({ ok: true });
}
