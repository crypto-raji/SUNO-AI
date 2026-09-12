import { serviceClient } from "@/lib/supabase/server";

export type UsageService = "ai_groq" | "ai_anthropic" | "tts" | "stt_assemblyai" | "stt_groq";

export async function logUsage(params: {
  userId: string;
  service: UsageService;
  tokens?: number;
  characters?: number;
}) {
  try {
    const supabase = serviceClient();
    await supabase.from("usage").insert({
      user_id: params.userId,
      service: params.service,
      tokens: params.tokens ?? 0,
      characters: params.characters ?? 0,
    });
  } catch {
    // Usage logging must never break the user-facing request it's tracking.
    // Failures here are swallowed; add server-side alerting if this matters
    // for billing accuracy.
  }
}
