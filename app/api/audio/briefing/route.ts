import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeWithAI } from "@/lib/services/ai";
import { detectSections, type DocumentSection } from "@/lib/services/documents/sections";
import { analyzeBusinessDocument } from "@/lib/services/documents/businessAnalysis";
import { isTTSConfigured, synthesizeSpeech, TTSNotConfiguredError } from "@/lib/services/tts";
import { logUsage } from "@/lib/services/usage";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, sessionId } = (await req.json()) as { documentId: string; sessionId?: string };

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
    const analysis = await analyzeBusinessDocument(sections, doc.filename, user.id);

    const result = await completeWithAI(
      {
        system:
          "You write a spoken business briefing script for Sona AI, to be read aloud. Follow this exact " +
          "structure and order: Business overview, then important numbers, then major findings, then " +
          "problems, then opportunities, then recommended actions. Speak naturally, like briefing an executive " +
          "out loud — not a bullet list read verbatim. If a section has nothing to report (e.g. no financial " +
          "data was found), say so briefly and move on rather than skipping it silently or inventing content.",
        messages: [
          {
            role: "user",
            content: `Document: "${doc.filename}"\n\nExtracted findings:\n${JSON.stringify(analysis, null, 2)}`,
          },
        ],
        maxTokens: 900,
      },
      { userId: user.id }
    );
    narration = result.text;
  } catch (err) {
    if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Sona AI's language model isn't configured yet. Add an API key to enable this." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "We couldn't prepare this briefing. Please try again." }, { status: 500 });
  }

  if (!isTTSConfigured()) {
    const { data: audioRow } = await supabase
      .from("audio_files")
      .insert({
        user_id: user.id,
        session_id: sessionId ?? null,
        document_id: documentId,
        title: `${doc.filename} — audio briefing`,
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
      title: `${doc.filename} — audio briefing`,
      status: "generating",
    })
    .select()
    .single();

  try {
    const speech = await synthesizeSpeech({ text: narration });

    if (audioRow?.id) {
      await supabase
        .from("audio_files")
        .update({
          status: "ready",
          audio_url: speech.audioUrl,
          provider: speech.provider,
          duration_seconds: speech.durationSeconds ?? null,
        })
        .eq("id", audioRow.id);
    }

    await logUsage({ userId: user.id, service: "tts", characters: narration.length }).catch(() => {});

    return NextResponse.json({ audio: { ...(audioRow || {}), status: "ready", audio_url: speech.audioUrl }, status: "ready" });
  } catch (err) {
    const status = err instanceof TTSNotConfiguredError ? "not_configured" : "failed";
    if (audioRow?.id) {
      await supabase.from("audio_files").update({ status }).eq("id", audioRow.id);
    }
    return NextResponse.json({ audio: audioRow, status });
  }
}
