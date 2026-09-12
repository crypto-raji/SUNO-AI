import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeWithAI } from "@/lib/services/ai";
import { detectSections, type DocumentSection } from "@/lib/services/documents/sections";
import { isTTSConfigured, synthesizeSpeech, TTSNotConfiguredError } from "@/lib/services/tts";
import { logUsage } from "@/lib/services/usage";

const MAX_SECTIONS = 6; // bounds cost/time for very long lectures

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

  const allSections: DocumentSection[] =
    (doc.sections as DocumentSection[] | null) ?? detectSections(doc.extracted_text);
  const sections = allSections.slice(0, MAX_SECTIONS);

  // Narrate every section first (fast to fail here if the AI provider isn't
  // configured, before touching the TTS provider or writing any audio rows).
  let narrations: string[];
  try {
    narrations = await Promise.all(
      sections.map(async (section) => {
        const result = await completeWithAI(
          {
            system:
              "You are Sona AI narrating study material aloud, like a good teacher explaining it out loud — " +
              "not reading it verbatim. Restructure for natural spoken delivery while preserving factual meaning. " +
              "Work only from the provided text.",
            messages: [
              { role: "user", content: `Section "${section.title}":\n"""${section.content.slice(0, 3500)}"""` },
            ],
            maxTokens: 600,
          },
          { userId: user.id }
        );
        return result.text;
      })
    );
  } catch (err) {
    if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Sona AI's language model isn't configured yet. Add an API key to enable this." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "We couldn't prepare this material for narration. Please try again." }, { status: 500 });
  }

  if (!isTTSConfigured()) {
    // Record one row per section so the state is honest and visible in the
    // audio library, rather than silently doing nothing.
    await Promise.all(
      sections.map((section) =>
        supabase.from("audio_files").insert({
          user_id: user.id,
          session_id: sessionId ?? null,
          document_id: documentId,
          title: `${doc.filename} — ${section.title}`,
          section: section.title,
          status: "not_configured",
        })
      )
    );
    return NextResponse.json({
      playlist: sections.map((s) => ({ section: s.title, url: null, status: "not_configured" as const })),
    });
  }

  const playlist = await Promise.all(
    sections.map(async (section, i) => {
      const { data: audioRow } = await supabase
        .from("audio_files")
        .insert({
          user_id: user.id,
          session_id: sessionId ?? null,
          document_id: documentId,
          title: `${doc.filename} — ${section.title}`,
          section: section.title,
          status: "generating",
        })
        .select()
        .single();

      try {
        const speech = await synthesizeSpeech({ text: narrations[i] });

        await supabase
          .from("audio_files")
          .update({
            status: "ready",
            audio_url: speech.audioUrl,
            provider: speech.provider,
            duration_seconds: speech.durationSeconds ?? null,
          })
          .eq("id", audioRow!.id);

        await logUsage({ userId: user.id, service: "tts", characters: narrations[i].length });

        return { section: section.title, url: speech.audioUrl, status: "ready" as const };
      } catch (err) {
        const status = err instanceof TTSNotConfiguredError ? "not_configured" : "failed";
        await supabase.from("audio_files").update({ status }).eq("id", audioRow!.id);
        return { section: section.title, url: null, status: status === "not_configured" ? ("not_configured" as const) : ("failed" as const) };
      }
    })
  );

  return NextResponse.json({ playlist });
}
