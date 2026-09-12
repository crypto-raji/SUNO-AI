import { completeWithAI } from "@/lib/services/ai";
import type { Mode } from "@/lib/types/database";

export interface ClassificationResult {
  detectedType: string; // e.g. "lecture_notes", "financial_report", "narration_script", "article"
  summary: string; // one-sentence description of what the document is
  hasFinancialData: boolean;
  suggestedActions: SuggestedAction[];
}

export interface SuggestedAction {
  id: string;
  label: string;
}

const ACTIONS_BY_MODE: Record<Mode, SuggestedAction[]> = {
  student: [
    { id: "lecture_audio", label: "Create Lecture Audio" },
    { id: "summarize", label: "Summarize" },
    { id: "explain", label: "Explain Material" },
    { id: "revision_notes", label: "Create Revision Notes" },
    { id: "quiz", label: "Generate Quiz" },
    { id: "ask", label: "Ask Questions" },
  ],
  business: [
    { id: "analyze_all", label: "Analyze Everything" },
    { id: "summarize", label: "Summarize" },
    { id: "financial_breakdown", label: "Financial Breakdown" },
    { id: "extract_data", label: "Extract Important Data" },
    { id: "audio_briefing", label: "Create Audio Briefing" },
    { id: "ask", label: "Ask Questions" },
  ],
  creator: [
    { id: "improve_narration", label: "Improve for Voice" },
    { id: "shorten", label: "Shorten Script" },
    { id: "audio", label: "Create Audio" },
    { id: "summarize", label: "Summarize" },
    { id: "analyze_script", label: "Analyze Script" },
  ],
  reading: [
    { id: "full_reading", label: "Full Reading" },
    { id: "short_summary", label: "Short Summary" },
    { id: "detailed_summary", label: "Detailed Summary" },
    { id: "audio", label: "Audio" },
    { id: "explain", label: "Explain" },
  ],
  general: [
    { id: "summarize", label: "Summarize" },
    { id: "explain", label: "Explain" },
    { id: "audio", label: "Turn Into Audio" },
  ],
};

/**
 * Classifies a document's content and narrows the full action set for the
 * current mode down to only what's actually relevant — e.g. a document
 * with no numbers in it never gets "Financial Breakdown".
 */
export async function classifyDocument(
  text: string,
  mode: Mode,
  userId: string
): Promise<ClassificationResult> {
  const excerpt = text.slice(0, 4000);

  const result = await completeWithAI(
    {
      system:
        "You classify uploaded documents for Sona AI, an app that helps people " +
        "understand and consume written information. Be conservative: only mark " +
        "hasFinancialData true if there are actual figures (revenue, expenses, " +
        "amounts) in the text, not just business language.",
      messages: [
        {
          role: "user",
          content:
            `Mode: ${mode}\n\nDocument excerpt:\n"""${excerpt}"""\n\n` +
            `Return JSON: {"detectedType": string, "summary": string, "hasFinancialData": boolean}`,
        },
      ],
      jsonMode: true,
      maxTokens: 300,
    },
    { userId }
  );

  let parsed: { detectedType: string; summary: string; hasFinancialData: boolean };
  try {
    parsed = JSON.parse(result.text);
  } catch {
    parsed = { detectedType: "document", summary: "An uploaded document.", hasFinancialData: false };
  }

  let actions = ACTIONS_BY_MODE[mode];

  if (mode === "business" && !parsed.hasFinancialData) {
    actions = actions.filter((a) => a.id !== "financial_breakdown");
  }

  return {
    detectedType: parsed.detectedType,
    summary: parsed.summary,
    hasFinancialData: parsed.hasFinancialData,
    suggestedActions: actions,
  };
}
