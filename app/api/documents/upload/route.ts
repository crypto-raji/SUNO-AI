import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractText, isSupportedFileType } from "@/lib/services/documents/extract";
import { classifyDocument } from "@/lib/services/documents/classify";
import { detectSections } from "@/lib/services/documents/sections";
import { isMaintenanceMode } from "@/lib/services/maintenance";
import type { Mode } from "@/lib/types/database";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const sessionId = formData.get("sessionId") as string | null;
  const mode = (formData.get("mode") as Mode) || "general";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "This file is too large. Please upload something under 25MB." }, { status: 400 });
  }

  if (!isSupportedFileType(file.type)) {
    return NextResponse.json(
      { error: "We couldn't process this file. Please upload a PDF, DOCX, TXT, or Markdown file." },
      { status: 400 }
    );
  }

  // Create the document record in "uploading" state immediately so the UI
  // can show progress even before extraction finishes.
  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      session_id: sessionId,
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
      status: "uploading",
    })
    .select()
    .single();

  if (insertError || !doc) {
    return NextResponse.json({ error: "We couldn't process this file. Please try again." }, { status: 500 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Store the original file privately, under a path scoped to this user
    // (enforced again by the storage RLS policy, not just this path choice).
    const storagePath = `${user.id}/${doc.id}/${file.name}`;
    const { error: storageError } = await supabase.storage.from("documents").upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (storageError) throw new Error("STORAGE_FAILED");

    await supabase.from("documents").update({ status: "extracting", file_url: storagePath }).eq("id", doc.id);

    const { text } = await extractText(buffer, file.type);

    await supabase.from("documents").update({ status: "analyzing", extracted_text: text }).eq("id", doc.id);

    const sections = detectSections(text);
    const classification = await classifyDocument(text, mode, user.id);

    if (sessionId) {
      // Persist user upload message
      await supabase.from("messages").insert({
        session_id: sessionId,
        user_id: user.id,
        role: "user",
        content: `Uploaded ${file.name}`,
        metadata: { documentName: file.name, documentId: doc.id },
      });

      // Persist assistant initial summary and suggested actions
      const assistantSummary = classification.summary
        ? `${classification.summary}\n\nWhat would you like to do?`
        : "What would you like to do with this document?";

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
    await supabase
      .from("documents")
      .update({ status: "failed", error_message: "processing_failed" })
      .eq("id", doc.id);

    return NextResponse.json({ error: "We couldn't process this file. Please try again." }, { status: 500 });
  }
}
