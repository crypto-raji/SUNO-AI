import type { SpeechRequest, SpeechResult, TTSProvider, VoiceOption } from "./types";
import { TTSNotConfiguredError } from "./types";

export * from "./types";

/**
 * Sona AI's audio-generation features (lecture audio, audio briefings,
 * narration) all call this single function. No feature talks to a TTS
 * SDK directly — this keeps the app honest about what's available and
 * means adding a real provider later is a one-file, one-env-var change.
 *
 * To enable a provider: create lib/services/tts/<provider>.ts implementing
 * TTSProvider, register it in `providers` below, then set
 * TTS_PROVIDER=<provider> and TTS_API_KEY in the environment.
 *
 * AssemblyAI does not offer text-to-speech (it's a speech-to-text
 * platform — see lib/services/stt/assemblyai.ts for that integration),
 * so it is intentionally not registered here.
 */
const providers: Record<string, TTSProvider> = {
  // elevenlabs: elevenLabsProvider,
  // openai: openaiTTSProvider,
  // google: googleTTSProvider,
  // azure: azureTTSProvider,
};

export function isTTSConfigured(): boolean {
  const selected = process.env.TTS_PROVIDER?.toLowerCase();
  if (!selected) return false;
  return Boolean(providers[selected]?.isConfigured());
}

export function getTTSProviderName(): string | null {
  return process.env.TTS_PROVIDER || null;
}

export async function synthesizeSpeech(request: SpeechRequest): Promise<SpeechResult> {
  const selected = process.env.TTS_PROVIDER?.toLowerCase();
  const provider = selected ? providers[selected] : undefined;

  if (!provider || !provider.isConfigured()) {
    throw new TTSNotConfiguredError();
  }

  return provider.synthesize(request);
}

/**
 * Returns real voices from the configured provider, or an empty list if
 * unconfigured or the provider doesn't support listing voices. Never
 * returns hard-coded placeholder voices — an empty list means "no voice
 * choice available," and callers should fall back to the provider's default.
 */
export async function listAvailableVoices(): Promise<VoiceOption[]> {
  const selected = process.env.TTS_PROVIDER?.toLowerCase();
  const provider = selected ? providers[selected] : undefined;

  if (!provider || !provider.isConfigured() || !provider.listVoices) return [];

  try {
    return await provider.listVoices();
  } catch {
    return [];
  }
}
