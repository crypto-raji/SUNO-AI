import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSTTAvailable, transcribeAudioData, transcribeFromUrl } from "@/lib/services/stt/transcribe";
import { logUsage } from "@/lib/services/usage";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSTTAvailable()) {
    return NextResponse.json(
      { error: "Speech-to-text isn't configured yet. Add GROQ_API_KEY or ASSEMBLYAI_API_KEY to enable this." },
      { status: 503 }
    );
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    // 1. Direct audio file/blob upload via FormData
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = (formData.get("audio") || formData.get("file")) as File | null;
      const sessionId = (formData.get("sessionId") as string) || null;

      if (!audioFile) {
        return NextResponse.json({ error: "No audio file provided in form data." }, { status: 400 });
      }

      const result = await transcribeAudioData(audioFile, audioFile.name || "recording.webm");

      await logUsage({
        userId: user.id,
        service: result.provider === "groq-whisper" ? "stt_groq" : "stt_assemblyai",
        characters: result.text.length,
      }).catch(() => {});

      return NextResponse.json({
        transcript: result.text,
        provider: result.provider,
        durationSeconds: result.durationSeconds,
      });
    }

    // 2. URL-based transcription via JSON
    const { audioUrl, sessionId } = (await req.json()) as { audioUrl?: string; sessionId?: string };
    if (!audioUrl) {
      return NextResponse.json({ error: "Missing audioUrl or audio upload." }, { status: 400 });
    }

    const { data: transcriptRow } = await supabase
      .from("transcripts")
      .insert({
        user_id: user.id,
        session_id: sessionId ?? null,
        source_audio_url: audioUrl,
        provider: "assemblyai",
        status: "processing",
      })
      .select()
      .single();

    try {
      const result = await transcribeFromUrl(audioUrl);

      if (transcriptRow?.id) {
        await supabase
          .from("transcripts")
          .update({ status: "ready", transcript_text: result.text })
          .eq("id", transcriptRow.id);
      }

      await logUsage({ userId: user.id, service: "stt_assemblyai", characters: result.text.length }).catch(() => {});

      return NextResponse.json({ transcript: result.text, provider: result.provider });
    } catch {
      if (transcriptRow?.id) {
        await supabase
          .from("transcripts")
          .update({ status: "failed", error_message: "transcription_failed" })
          .eq("id", transcriptRow.id);
      }
      return NextResponse.json({ error: "We couldn't transcribe that audio. Please try again." }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[STT Route Error]", err);
    return NextResponse.json({ error: err.message || "Failed to process audio transcription." }, { status: 500 });
  }
}

