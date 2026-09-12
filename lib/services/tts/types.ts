export interface SpeechRequest {
  text: string;
  voice?: string;
  speed?: number;
}

export interface SpeechResult {
  audioUrl: string;
  provider: string;
  durationSeconds?: number;
}

export class TTSNotConfiguredError extends Error {
  constructor() {
    super(
      "TTS_NOT_CONFIGURED: no text-to-speech provider is set up yet. " +
        "Set TTS_PROVIDER and TTS_API_KEY to enable audio generation."
    );
    this.name = "TTSNotConfiguredError";
  }
}

export interface VoiceOption {
  id: string;
  label: string;
}

export interface TTSProvider {
  name: string;
  isConfigured(): boolean;
  synthesize(request: SpeechRequest): Promise<SpeechResult>;
  /** Optional — only implement if the provider has a real, queryable voice list. */
  listVoices?(): Promise<VoiceOption[]>;
}
