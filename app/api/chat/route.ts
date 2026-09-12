import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeWithAI } from "@/lib/services/ai";
import { isMaintenanceMode } from "@/lib/services/maintenance";
import type { Mode } from "@/lib/types/database";

const SYSTEM_PROMPTS: Record<Mode, string> = {
  general:
    "You are Sona AI, a warm, intelligent, helpful, and articulate AI voice and chat assistant. Always communicate in natural, fluent English with a friendly, positive, and clear tone. Always format your responses in pure, clean text without markdown symbols such as asterisks (* or **), hashes (# or ##), underscores, or markdown tags. Be concise and helpful.",
  student:
    "You are Sona AI in Student Mode, a friendly and knowledgeable tutor. Explain concepts clearly, intuitively, and concisely in pure, clean text without markdown symbols like * or #.",
  business:
    "You are Sona AI in Business Mode, a sharp and professional executive assistant. Provide concise, high-value summaries and data-backed analysis in pure, clean text without markdown symbols like * or #.",
  creator:
    "You are Sona AI in Creator Mode, an engaging creative voice and scriptwriting specialist. Help craft punchy, natural narration in pure, clean text without markdown symbols like * or #.",
  reading:
    "You are Sona AI in Reading Mode, a thoughtful reading guide. Help summarize, analyze, and explain articles with clarity and precision in pure, clean text without markdown symbols like * or #.",
};

function formatCleanPlainText(raw: string): string {
  if (!raw) return "";
  let clean = raw;
  clean = clean.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "");
  clean = clean.replace(/^#{1,6}\s+/gm, "");
  clean = clean.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
  clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");
  clean = clean.replace(/\*([^*]+)\*/g, "$1");
  clean = clean.replace(/___([^_]+)___/g, "$1");
  clean = clean.replace(/__([^_]+)__/g, "$1");
  clean = clean.replace(/_([^_]+)_/g, "$1");
  clean = clean.replace(/^\s*\*\s+/gm, "• ");
  clean = clean.replace(/^\s*-\s+/gm, "• ");
  clean = clean.replace(/^>\s+/gm, "");
  clean = clean.replace(/~~([^~]+)~~/g, "$1");
  clean = clean.replace(/\n{3,}/g, "\n\n");
  return clean.trim();
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

  const { sessionId, mode, message, documentId } = (await req.json()) as {
    sessionId: string;
    mode: Mode;
    message: string;
    documentId?: string;
  };

  if (!sessionId || !message?.trim()) {
    return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400 });
  }

  // If a document is active for this session, ground the answer in it so
  // follow-ups like "explain the second section" or "what's the main
  // argument here" actually work against the uploaded material.
  let documentContext = "";
  if (documentId) {
    const { data: doc } = await supabase
      .from("documents")
      .select("filename, extracted_text")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (doc?.extracted_text) {
      documentContext =
        `\n\nThe user has an uploaded document open: "${doc.filename}". Answer questions about it using ` +
        `only the text below — if the answer isn't in it, say so rather than guessing.\n\n"""${doc.extracted_text.slice(
          0,
          14000
        )}"""`;
    }
  }

  // Save the user message
  const { error: userMsgError } = await supabase.from("messages").insert({
    session_id: sessionId,
    user_id: user.id,
    role: "user",
    content: message,
  });
  if (userMsgError) {
    console.error("[/api/chat] User message insert error:", userMsgError);
  }

  // Pull recent context for this session so follow-ups like "make that shorter" work
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(20);

  try {
    const result = await completeWithAI(
      {
        system: (SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.general) + documentContext,
        messages: (history ?? []).map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        maxTokens: 500,
      },
      { userId: user.id }
    );

    const cleanReply = formatCleanPlainText(result.text);

    const { error: assistantMsgError } = await supabase.from("messages").insert({
      session_id: sessionId,
      user_id: user.id,
      role: "assistant",
      content: cleanReply,
    });
    if (assistantMsgError) {
      console.error("[/api/chat] Assistant message insert error:", assistantMsgError);
    }

    return NextResponse.json({ reply: cleanReply });
  } catch (err: unknown) {
    console.error("[/api/chat Error]:", err);
    if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Sona AI's language model isn't configured yet. Please add a GROQ_API_KEY in your .env file." },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : "Something went wrong while processing your message.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
