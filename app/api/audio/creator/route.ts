import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectSections, type DocumentSection } from "@/lib/services/documents/sections";
import { processDocumentAction } from "@/lib/services/documents/mapReduce";
import { isTTSConfigured, synthesizeSpeech, TTSNotConfiguredError } from "@/lib/services/tts";
import { logUsage } from "@/lib/services/usage";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, sessionId, voice } = (await req.json()) as {
    documentId: string;
    sessionId?: string;
    voice?: string;
  };

  const { data: doc } = await supabase
    .from("documents")
    .select("extracted_text, filename, sections")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!doc?.extracted_text) {
    return NextResponse.json({ error: "We couldn't find that document. Please try uploading it again." }, { status: 404 });
  }

  const sections: DocumentSection[] =
    (doc.sections as DocumentSection[] | null) ?? detectSections(doc.extracted_text);

  let narration: string;
  try {
    narration = await processDocumentAction({
      prompt:
        "Rewrite this script to sound natural when read aloud by a narrator, preserving the original meaning, " +
        "tone, and creative intent — this is preparation for voice narration, not a summary.",
      filename: doc.filename,
      sections,
      userId: user.id,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Sona AI's language model isn't configured yet. Add an API key to enable this." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "We couldn't prepare this script for narration. Please try again." }, { status: 500 });
  }

  if (!isTTSConfigured()) {
    const { data: audioRow } = await supabase
      .from("audio_files")
      .insert({
        user_id: user.id,
        session_id: sessionId ?? null,
        document_id: documentId,
        title: `${doc.filename} — narration`,
        status: "not_configured",
      })
      .select()
      .single();

    return NextResponse.json({ audio: audioRow, status: "not_configured" });
  }

  const { data: audioRow } = await supabase
    .from("audio_files")
    .insert({
      user_id: user.id,
      session_id: sessionId ?? null,
      document_id: documentId,
      title: `${doc.filename} — narration`,
      status: "generating",
    })
    .select()
    .single();

  try {
    const speech = await synthesizeSpeech({ text: narration, voice });

    await supabase
      .from("audio_files")
      .update({
        status: "ready",
        audio_url: speech.audioUrl,
        provider: speech.provider,
        duration_seconds: speech.durationSeconds ?? null,
      })
      .eq("id", audioRow!.id);

    await logUsage({ userId: user.id, service: "tts", characters: narration.length });

    return NextResponse.json({ audio: { ...audioRow, status: "ready", audio_url: speech.audioUrl }, status: "ready" });
  } catch (err) {
    const status = err instanceof TTSNotConfiguredError ? "not_configured" : "failed";
    await supabase.from("audio_files").update({ status }).eq("id", audioRow!.id);
    return NextResponse.json({ audio: audioRow, status });
  }
}
