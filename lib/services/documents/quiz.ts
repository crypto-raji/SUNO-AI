import { completeWithAI } from "@/lib/services/ai";
import type { DocumentSection } from "./sections";

export type QuizQuestionType = "multiple_choice" | "true_false" | "short_answer";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[]; // multiple_choice only
  correctAnswer: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

const MAX_SECTIONS_SAMPLED = 4;
const MAX_QUESTIONS = 8;

/**
 * Generates quiz questions grounded only in the uploaded material. Samples
 * a spread of sections (rather than just the first chunk) so a quiz on a
 * multi-section lecture doesn't only test the introduction, then asks each
 * sampled section for a couple of questions and merges the results.
 */
export async function generateQuiz(sections: DocumentSection[], userId: string): Promise<Quiz> {
  const sampled = sampleSections(sections, MAX_SECTIONS_SAMPLED);
  const perSection = Math.max(1, Math.ceil(MAX_QUESTIONS / sampled.length));

  const batches = await Promise.all(
    sampled.map(async (section) => {
      try {
        const result = await completeWithAI(
          {
            system:
              "You write quiz questions for Sona AI's study tools. Work ONLY from the provided text — " +
              "never invent facts not present in it. Return strict JSON only, no prose, matching exactly: " +
              `{"questions":[{"type":"multiple_choice"|"true_false"|"short_answer","question":string,"options":string[]|null,"correctAnswer":string}]}`,
            messages: [
              {
                role: "user",
                content:
                  `Section: "${section.title}"\n\n"""${section.content.slice(0, 3000)}"""\n\n` +
                  `Write exactly ${perSection} question(s) based only on this section. Mix question types when possible.`,
              },
            ],
            jsonMode: true,
            maxTokens: 700,
          },
          { userId }
        );
        return parseQuestions(result.text);
      } catch {
        // One section failing shouldn't kill the whole quiz.
        return [];
      }
    })
  );

  const questions = batches.flat().slice(0, MAX_QUESTIONS);
  return { questions };
}

function sampleSections(sections: DocumentSection[], max: number): DocumentSection[] {
  if (sections.length <= max) return sections;
  // Evenly spread picks across the document instead of just the first N.
  const step = sections.length / max;
  const picked: DocumentSection[] = [];
  for (let i = 0; i < max; i++) picked.push(sections[Math.floor(i * step)]);
  return picked;
}

function parseQuestions(raw: string): QuizQuestion[] {
  try {
    const parsed = JSON.parse(raw) as { questions: Omit<QuizQuestion, "id">[] };
    return (parsed.questions ?? [])
      .filter((q) => q.question && q.correctAnswer)
      .map((q, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        type: q.type,
        question: q.question,
        options: q.options ?? undefined,
        correctAnswer: q.correctAnswer,
      }));
  } catch {
    return [];
  }
}
