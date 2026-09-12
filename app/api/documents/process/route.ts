import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectSections, type DocumentSection } from "@/lib/services/documents/sections";
import { processDocumentAction } from "@/lib/services/documents/mapReduce";
import { generateQuiz } from "@/lib/services/documents/quiz";
import { extractFinancials } from "@/lib/services/documents/financials";
import { analyzeBusinessDocument } from "@/lib/services/documents/businessAnalysis";

const ACTION_PROMPTS: Record<string, string> = {
  summarize: "Summarize this document clearly and concisely, in your own structure.",
  explain: "Explain this material in simple, plain terms, as if teaching someone new to the topic.",
  revision_notes: "Turn this material into organized revision notes with headings and bullet points.",
  extract_data: "Extract the key facts, dates, decisions, and figures from this document into a clear list.",
  improve_narration: "Rewrite this script to sound natural when read aloud, preserving the original meaning, tone, and intent.",
  shorten: "Shorten this while preserving the key meaning and structure.",
  analyze_script: "Analyze this script's structure, pacing, and tone, and suggest specific improvements.",
  full_reading: "Present this content in full, cleanly formatted for reading.",
  short_summary: "Give a short, 3-4 sentence summary of this content.",
  detailed_summary: "Give a detailed, structured summary of this content covering all major points.",
};

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, actionId, sessionId } = (await req.json()) as {
    documentId: string;
    actionId: string;
    sessionId?: string;
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

  // Sections are detected at upload time; fall back to computing them here
  // for documents uploaded before this column existed.
  const sections: DocumentSection[] =
    (doc.sections as DocumentSection[] | null) ?? detectSections(doc.extracted_text);

  if (actionId === "quiz") {
    try {
      const quiz = await generateQuiz(sections, user.id);
      if (quiz.questions.length === 0) {
        return NextResponse.json(
          { error: "We couldn't generate a quiz from this document. Please try a different action." },
          { status: 422 }
        );
      }
      if (sessionId) {
        await supabase.from("messages").insert({
          session_id: sessionId,
          user_id: user.id,
          role: "assistant",
          content: "Here's a 5-question quiz to test your understanding of this document:",
          metadata: { quiz, documentId },
        });
      }
      return NextResponse.json({ quiz });
    } catch (err) {
      return handleAIError(err);
    }
  }

  if (actionId === "financial_breakdown") {
    try {
      const financials = await extractFinancials(sections, user.id);
      if (sessionId) {
        await supabase.from("messages").insert({
          session_id: sessionId,
          user_id: user.id,
          role: "assistant",
          content: "Here's the financial breakdown:",
          metadata: { financials, documentId },
        });
      }
      return NextResponse.json({ financials });
    } catch (err) {
      return handleAIError(err);
    }
  }

  if (actionId === "analyze_all") {
    try {
      const analysis = await analyzeBusinessDocument(sections, doc.filename, user.id);
      if (sessionId) {
        await supabase.from("messages").insert({
          session_id: sessionId,
          user_id: user.id,
          role: "assistant",
          content: "Here's the full business analysis:",
          metadata: { analysis, documentId },
        });
      }
      return NextResponse.json({ analysis });
    } catch (err) {
      return handleAIError(err);
    }
  }

  const prompt = ACTION_PROMPTS[actionId];
  if (!prompt) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  try {
    const result = await processDocumentAction({
      prompt,
      filename: doc.filename,
      sections,
      userId: user.id,
    });
    if (sessionId) {
      await supabase.from("messages").insert({
        session_id: sessionId,
        user_id: user.id,
        role: "assistant",
        content: result,
        metadata: { documentId, actionId },
      });
    }
    return NextResponse.json({ result });
  } catch (err) {
    return handleAIError(err);
  }
}

function handleAIError(err: unknown) {
  if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") {
    return NextResponse.json(
      { error: "Sona AI's language model isn't configured yet. Add an API key to enable this." },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: "Something went wrong while processing your document." }, { status: 500 });
}
