import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTTSConfigured, synthesizeSpeech, TTSNotConfiguredError } from "@/lib/services/tts";
import { logUsage } from "@/lib/services/usage";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, title, sessionId, documentId, section, voice } = (await req.json()) as {
    text: string;
    title: string;
    sessionId?: string;
    documentId?: string;
    section?: string;
    voice?: string;
  };

  if (!text?.trim()) return NextResponse.json({ error: "Nothing to turn into audio yet." }, { status: 400 });

  if (!isTTSConfigured()) {
    // Record the attempt so it's visible in the audio library / history,
    // clearly marked rather than silently missing.
    const { data: audioRow } = await supabase
      .from("audio_files")
      .insert({
        user_id: user.id,
        session_id: sessionId ?? null,
        document_id: documentId ?? null,
        title,
        section,
        status: "not_configured",
      })
      .select()
      .single();

    return NextResponse.json({ audio: audioRow, status: "not_configured" }, { status: 200 });
  }

  const { data: audioRow } = await supabase
    .from("audio_files")
    .insert({
      user_id: user.id,
      session_id: sessionId ?? null,
      document_id: documentId ?? null,
      title,
      section,
      status: "generating",
    })
    .select()
    .single();

  try {
    const speech = await synthesizeSpeech({ text, voice });

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

    await logUsage({ userId: user.id, service: "tts", characters: text.length }).catch(() => {});

    return NextResponse.json({
      audio: { ...(audioRow || {}), status: "ready", audio_url: speech.audioUrl },
      status: "ready",
    });
  } catch (err) {
    if (err instanceof TTSNotConfiguredError) {
      if (audioRow?.id) {
        await supabase.from("audio_files").update({ status: "not_configured" }).eq("id", audioRow.id);
      }
      return NextResponse.json({ audio: audioRow, status: "not_configured" });
    }

    if (audioRow?.id) {
      await supabase
        .from("audio_files")
        .update({ status: "failed", error_message: "generation_failed" })
        .eq("id", audioRow.id);
    }

    return NextResponse.json({ error: "The audio generation failed. Please try again." }, { status: 500 });
  }
}
