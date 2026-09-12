export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  system?: string;
  maxTokens?: number;
  /** JSON schema-ish instruction — provider implementations should force JSON-only output */
  jsonMode?: boolean;
}

export interface AICompletionResult {
  text: string;
  provider: "groq";
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIProvider {
  name: "groq";
  isConfigured(): boolean;
  complete(request: AICompletionRequest): Promise<AICompletionResult>;
}
