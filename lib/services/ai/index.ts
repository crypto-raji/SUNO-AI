import { groqProvider } from "./groq";
import type { AICompletionRequest, AICompletionResult } from "./types";
import { logUsage } from "@/lib/services/usage";

export * from "./types";

/**
 * Runs completion via Groq Cloud LLM engine.
 */
export async function completeWithAI(
  request: AICompletionRequest,
  context?: { userId?: string }
): Promise<AICompletionResult> {
  if (!groqProvider.isConfigured()) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const result = await groqProvider.complete(request);

  if (context?.userId) {
    await logUsage({
      userId: context.userId,
      service: "ai_groq",
      tokens: (result.inputTokens ?? 0) + (result.outputTokens ?? 0),
    });
  }

  return result;
}
