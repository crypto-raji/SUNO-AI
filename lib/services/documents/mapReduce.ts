import { completeWithAI } from "@/lib/services/ai";
import type { DocumentSection } from "./sections";

const MAX_SECTIONS_MAPPED = 6; // bounds cost on very long documents
const MAP_CHARS_PER_SECTION = 3500;

/**
 * Runs `prompt` against a document. Short documents (1-2 sections) go
 * straight through in a single call. Longer documents are processed
 * section-by-section (map) and then synthesized into one cohesive result
 * (reduce), so a single request is never sent the entire document at once.
 */
export async function processDocumentAction(params: {
  prompt: string;
  filename: string;
  sections: DocumentSection[];
  userId: string;
}): Promise<string> {
  const { prompt, filename, sections, userId } = params;

  if (sections.length <= 2) {
    const combined = sections.map((s) => s.content).join("\n\n");
    const result = await completeWithAI(
      {
        system:
          "You are Sona AI, processing an uploaded document. Work only from the provided text — never invent facts, figures, or dates that aren't present.",
        messages: [
          { role: "user", content: `${prompt}\n\nDocument ("${filename}"):\n"""${combined.slice(0, 12000)}"""` },
        ],
        maxTokens: 1500,
      },
      { userId }
    );
    return result.text;
  }

  const mapped = sections.slice(0, MAX_SECTIONS_MAPPED);

  const partials = await Promise.all(
    mapped.map(async (section) => {
      try {
        const result = await completeWithAI(
          {
            system: "You are Sona AI, processing one section of a larger document. Work only from the provided text.",
            messages: [
              {
                role: "user",
                content: `${prompt}\n\nSection "${section.title}":\n"""${section.content.slice(0, MAP_CHARS_PER_SECTION)}"""`,
              },
            ],
            maxTokens: 500,
          },
          { userId }
        );
        return `## ${section.title}\n${result.text}`;
      } catch {
        return null;
      }
    })
  );

  const usable = partials.filter((p): p is string => p !== null);

  if (usable.length === 0) {
    throw new Error("AI_REQUEST_FAILED");
  }

  const truncatedNote =
    sections.length > MAX_SECTIONS_MAPPED
      ? `\n\n(Note: this document has ${sections.length} sections; the ${MAX_SECTIONS_MAPPED} most representative were processed.)`
      : "";

  const reduced = await completeWithAI(
    {
      system:
        "You are Sona AI. You'll be given per-section notes already extracted from a document. " +
        "Combine them into one cohesive, well-organized result that fulfils the original request — " +
        "don't just concatenate the sections, actually synthesize them.",
      messages: [
        {
          role: "user",
          content: `Original request: ${prompt}\n\nPer-section notes from "${filename}":\n\n${usable.join(
            "\n\n"
          )}${truncatedNote}`,
        },
      ],
      maxTokens: 1800,
    },
    { userId }
  );

  return reduced.text;
}
