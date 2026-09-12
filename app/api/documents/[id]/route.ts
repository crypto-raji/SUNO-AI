import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectSections, type DocumentSection } from "@/lib/services/documents/sections";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, filename, file_type, file_size, status, detected_type, extracted_text, sections, created_at, session_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const sections: DocumentSection[] =
    (doc.sections as DocumentSection[] | null) ??
    (doc.extracted_text ? detectSections(doc.extracted_text) : []);

  return NextResponse.json({
    document: {
      ...doc,
      sections,
    },
  });
}
