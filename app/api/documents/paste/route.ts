import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyDocument } from "@/lib/services/documents/classify";
import { detectSections } from "@/lib/services/documents/sections";
import { isMaintenanceMode } from "@/lib/services/maintenance";
import type { Mode } from "@/lib/types/database";

const MIN_PASTE_LENGTH = 400; // below this, it's a normal chat message, not an "article"

function deriveTitle(text: string): string {
  const firstLine = text.split(/\r?\n/)[0]?.trim() ?? "";
  if (firstLine.length > 0 && firstLine.length <= 80) return firstLine;
  return `${text.slice(0, 60).trim()}…`;
}

export async function POST(req: NextRequest) {
  const { enabled } = await isMaintenanceMode();
  if (enabled) {
    return NextResponse.json(
      { error: "Sona AI is currently under maintenance. Please try again shortly." },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, mode, text } = (await req.json()) as { sessionId: string; mode: Mode; text: string };

  if (!text || text.trim().length < MIN_PASTE_LENGTH) {
    return NextResponse.json({ error: "That's too short to treat as an article — just ask normally instead." }, { status: 400 });
  }

  const filename = deriveTitle(text);
  const sections = detectSections(text);

  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      session_id: sessionId,
      filename,
      file_type: "text/plain",
      file_size: text.length,
      status: "analyzing",
      extracted_text: text,
      sections,
    })
    .select()
    .single();

  if (insertError || !doc) {
    return NextResponse.json({ error: "We couldn't process that text. Please try again." }, { status: 500 });
  }

  try {
    const classification = await classifyDocument(text, mode, user.id);

    await supabase.from("documents").update({ status: "ready", detected_type: classification.detectedType }).eq("id", doc.id);

    if (sessionId) {
      await supabase.from("messages").insert({
        session_id: sessionId,
        user_id: user.id,
        role: "user",
        content: `Pasted: ${filename}`,
        metadata: { documentName: filename, documentId: doc.id },
      });

      const assistantSummary = classification.summary
        ? `${classification.summary}\n\nWhat would you like to do?`
        : "What would you like to do with this text?";

      await supabase.from("messages").insert({
        session_id: sessionId,
        user_id: user.id,
        role: "assistant",
        content: assistantSummary,
        metadata: { suggestedActions: classification.suggestedActions, documentId: doc.id },
      });
    }

    return NextResponse.json({
      document: { id: doc.id, filename: doc.filename, status: "ready" },
      summary: classification.summary,
      suggestedActions: classification.suggestedActions,
    });
  } catch {
    await supabase.from("documents").update({ status: "failed", error_message: "processing_failed" }).eq("id", doc.id);
    return NextResponse.json({ error: "We couldn't process that text. Please try again." }, { status: 500 });
  }
}
