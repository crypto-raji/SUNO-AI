"use client";

export interface SpeechVoiceOption {
  id: string;
  name: string;
  gender: "female" | "male" | "neutral";
  lang: string;
  voice: SpeechSynthesisVoice;
}

const PREFERRED_FEMALE_KEYWORDS = [
  "natural",
  "enhanced",
  "jenny",
  "aria",
  "samantha",
  "ava",
  "karen",
  "serena",
  "zoe",
  "google us english",
  "victoria",
  "moira",
  "fiona",
];

const PREFERRED_MALE_KEYWORDS = [
  "natural",
  "enhanced",
  "guy",
  "daniel",
  "ryan",
  "oliver",
  "google uk english male",
  "alex",
  "tom",
];

/**
 * Discovers and prioritizes premium, natural-sounding English voices
 * available in the user's browser (Edge Natural, Chrome Google, Apple Enhanced/Premium).
 */
export function getPremiumVoices(): SpeechVoiceOption[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];

  const rawVoices = window.speechSynthesis.getVoices();
  const englishVoices = rawVoices.filter((v) => v.lang.startsWith("en"));

  const results: SpeechVoiceOption[] = [];

  for (const v of englishVoices) {
    const nameLower = v.name.toLowerCase();
    const isFemale =
      PREFERRED_FEMALE_KEYWORDS.some((k) => nameLower.includes(k)) ||
      nameLower.includes("female") ||
      nameLower.includes("woman");
    const isMale =
      PREFERRED_MALE_KEYWORDS.some((k) => nameLower.includes(k)) ||
      nameLower.includes("male") ||
      nameLower.includes("man");

    results.push({
      id: v.name,
      name: v.name.replace(/Microsoft|Google|Apple/g, "").replace(/\(Enhanced\)|\(Premium\)/g, "✨").trim(),
      gender: isFemale ? "female" : isMale ? "male" : "neutral",
      lang: v.lang,
      voice: v,
    });
  }

  // Sort natural/enhanced voices to the top
  results.sort((a, b) => {
    const aName = a.voice.name.toLowerCase();
    const bName = b.voice.name.toLowerCase();

    const aScore =
      (aName.includes("natural") ? 100 : 0) +
      (aName.includes("enhanced") || aName.includes("premium") ? 80 : 0) +
      (aName.includes("google") ? 60 : 0) +
      (a.gender === "female" ? 10 : 0);

    const bScore =
      (bName.includes("natural") ? 100 : 0) +
      (bName.includes("enhanced") || bName.includes("premium") ? 80 : 0) +
      (bName.includes("google") ? 60 : 0) +
      (b.gender === "female" ? 10 : 0);

    return bScore - aScore;
  });

  return results;
}

/**
 * Returns the best available sweet, natural voice for speech synthesis.
 */
export function getBestNaturalVoice(preferredName?: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  if (preferredName) {
    const match = voices.find((v) => v.name === preferredName);
    if (match) return match;
  }

  const premium = getPremiumVoices();
  if (premium.length > 0) {
    return premium[0].voice;
  }

  return (
    voices.find((v) => v.lang.startsWith("en-US")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0]
  );
}

/**
 * Speaks text using the sweet, natural tuned voice synthesis.
 */
export function playNaturalVoice(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    voiceName?: string;
    onEnd?: () => void;
    onError?: () => void;
  }
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  // Tuned parameters for warm, sweet natural cadence
  utterance.rate = options?.rate ?? 1.02;
  utterance.pitch = options?.pitch ?? 1.05;
  utterance.lang = "en-US";

  const voice = getBestNaturalVoice(options?.voiceName);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = () => options?.onError?.();

  window.speechSynthesis.speak(utterance);
}
