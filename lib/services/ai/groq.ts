import Groq from "groq-sdk";
import type { AIProvider, AICompletionRequest, AICompletionResult } from "./types";

let cachedModels: { models: string[]; timestamp: number } | null = null;

// Verified active, fast, and free production models on Groq
const VERIFIED_MODELS = [
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "groq/compound",
  "openai/gpt-oss-120b",
];

const NON_CHAT_PATTERNS = [
  "whisper",
  "guard",
  "safeguard",
  "orpheus",
  "vision",
  "audio",
  "tts",
];

async function getActiveGroqModels(groq: Groq): Promise<string[]> {
  const now = Date.now();
  if (cachedModels && now - cachedModels.timestamp < 5 * 60 * 1000) {
    return cachedModels.models;
  }

  try {
    const list = await groq.models.list();
    const availableIds = new Set(list.data.map((m) => m.id));

    // First, match verified top models
    const matched = VERIFIED_MODELS.filter((id) => availableIds.has(id));

    // Then, append any other available chat models that aren't safeguard/whisper
    for (const m of list.data) {
      const id = m.id.toLowerCase();
      const isNonChat = NON_CHAT_PATTERNS.some((pattern) => id.includes(pattern));
      if (!isNonChat && !matched.includes(m.id)) {
        matched.push(m.id);
      }
    }

    if (matched.length > 0) {
      cachedModels = { models: matched, timestamp: now };
      return matched;
    }
  } catch (err) {
    console.warn("[Groq] Could not fetch models list dynamically:", err);
  }

  return VERIFIED_MODELS;
}

export const groqProvider: AIProvider = {
  name: "groq",

  isConfigured() {
    return Boolean(process.env.GROQ_API_KEY);
  },

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_NOT_CONFIGURED");
    }

    const groq = new Groq({ apiKey });

    const messages = [
      ...(request.system ? [{ role: "system" as const, content: request.system }] : []),
      ...request.messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
    ];

    const candidateModels = process.env.GROQ_MODEL
      ? [process.env.GROQ_MODEL, ...(await getActiveGroqModels(groq))]
      : await getActiveGroqModels(groq);

    // Deduplicate models while keeping order
    const uniqueModels = Array.from(new Set(candidateModels));

    let lastError: unknown;

    for (const model of uniqueModels) {
      try {
        const response = await groq.chat.completions.create({
          model,
          max_tokens: request.maxTokens ?? 2048,
          messages,
          temperature: 0.7,
          ...(request.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
        });

        const text = response.choices[0]?.message?.content ?? "";

        return {
          text,
          provider: "groq",
          model,
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Groq] Model ${model} failed, trying next candidate. Reason:`, err?.message || err);
      }
    }

    const errorMsg = lastError instanceof Error ? lastError.message : "GROQ_REQUEST_FAILED";
    throw new Error(errorMsg);
  },
};
