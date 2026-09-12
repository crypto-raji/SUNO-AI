import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSTTConfigured, transcribeAudio } from "@/lib/services/stt/assemblyai";
import { logUsage } from "@/lib/services/usage";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSTTConfigured()) {
    return NextResponse.json(
      { error: "Speech-to-text isn't configured yet. Add ASSEMBLYAI_API_KEY to enable this." },
      { status: 503 }
    );
  }

  const { audioUrl, sessionId } = (await req.json()) as { audioUrl: string; sessionId?: string };
  if (!audioUrl) return NextResponse.json({ error: "Missing audioUrl" }, { status: 400 });

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
    const result = await transcribeAudio(audioUrl);

    await supabase
      .from("transcripts")
      .update({ status: "ready", transcript_text: result.text })
      .eq("id", transcriptRow!.id);

    await logUsage({ userId: user.id, service: "stt_assemblyai", characters: result.text.length });

    return NextResponse.json({ transcript: result.text });
  } catch {
    await supabase
      .from("transcripts")
      .update({ status: "failed", error_message: "transcription_failed" })
      .eq("id", transcriptRow!.id);

    return NextResponse.json({ error: "We couldn't transcribe that audio. Please try again." }, { status: 500 });
  }
}
