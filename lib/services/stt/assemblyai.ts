import { AssemblyAI } from "assemblyai";

export interface TranscriptionResult {
  text: string;
  provider: "assemblyai";
  durationSeconds?: number;
  words?: { text: string; start: number; end: number }[];
  chapters?: { summary: string; headline: string; start: number; end: number }[];
}

export function isSTTConfigured(): boolean {
  return Boolean(process.env.ASSEMBLYAI_API_KEY);
}

function getClient(): AssemblyAI {
  if (!isSTTConfigured()) {
    throw new Error("STT_NOT_CONFIGURED");
  }
  return new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });
}

/**
 * Transcribes an audio/video file (given a publicly-fetchable or signed URL,
 * or a local file path) into text using AssemblyAI with high-accuracy models.
 */
export async function transcribeAudio(
  audioUrl: string,
  options?: { autoChapters?: boolean; speakerLabels?: boolean }
): Promise<TranscriptionResult> {
  const client = getClient();

  const transcript = await client.transcripts.transcribe({
    audio: audioUrl,
    speech_model: "best",
    punctuate: true,
    format_text: true,
    auto_chapters: options?.autoChapters ?? false,
    speaker_labels: options?.speakerLabels ?? false,
  });

  if (transcript.status === "error") {
    throw new Error(transcript.error ?? "STT_TRANSCRIPTION_FAILED");
  }

  return {
    text: transcript.text ?? "",
    provider: "assemblyai",
    durationSeconds: transcript.audio_duration ?? undefined,
    words: transcript.words?.map((w) => ({
      text: w.text,
      start: w.start,
      end: w.end,
    })),
    chapters: transcript.chapters?.map((c) => ({
      summary: c.summary,
      headline: c.headline,
      start: c.start,
      end: c.end,
    })),
  };
}

/**
 * Creates a temporary token for browser-side real-time streaming STT,
 * keeping the master ASSEMBLYAI_API_KEY secure on the server.
 */
export async function createStreamingToken(expiresInSeconds = 480): Promise<string> {
  const client = getClient();
  const token = await client.realtime.createTemporaryToken({ expires_in: expiresInSeconds });
  return token;
}


