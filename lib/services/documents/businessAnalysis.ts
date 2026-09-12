import { completeWithAI } from "@/lib/services/ai";
import type { DocumentSection } from "./sections";
import { extractFinancials, type FinancialBreakdown } from "./financials";

export interface BusinessAnalysis {
  executiveSummary: string;
  risks: string[];
  opportunities: string[];
  actionItems: string[];
  decisions: string[];
  importantDates: string[];
  financials: FinancialBreakdown;
}

const MAX_SECTIONS_SCANNED = 6;

/**
 * Full business-document analysis. Runs financial extraction and a
 * per-section scan for qualitative signals (risks, opportunities, action
 * items, decisions, dates) in parallel, then synthesizes one executive
 * summary from everything gathered — never from the raw text alone, so the
 * summary can't drift from what was actually found.
 */
export async function analyzeBusinessDocument(
  sections: DocumentSection[],
  filename: string,
  userId: string
): Promise<BusinessAnalysis> {
  const scanned = sections.slice(0, MAX_SECTIONS_SCANNED);

  const [financials, qualitativeBatches] = await Promise.all([
    extractFinancials(sections, userId),
    Promise.all(
      scanned.map(async (section) => {
        try {
          const result = await completeWithAI(
            {
              system:
                "You extract business signals for Sona AI. Work ONLY from the text given. If a category has " +
                "nothing in this section, return an empty array for it — never invent an item. Return strict JSON only: " +
                `{"risks":string[],"opportunities":string[],"actionItems":string[],"decisions":string[],"importantDates":string[]}`,
              messages: [
                { role: "user", content: `Section "${section.title}":\n"""${section.content.slice(0, 3500)}"""` },
              ],
              jsonMode: true,
              maxTokens: 500,
            },
            { userId }
          );
          return parseQualitative(result.text);
        } catch {
          return emptyQualitative();
        }
      })
    ),
  ]);

  const merged = qualitativeBatches.reduce(
    (acc, batch) => ({
      risks: dedupe([...acc.risks, ...batch.risks]),
      opportunities: dedupe([...acc.opportunities, ...batch.opportunities]),
      actionItems: dedupe([...acc.actionItems, ...batch.actionItems]),
      decisions: dedupe([...acc.decisions, ...batch.decisions]),
      importantDates: dedupe([...acc.importantDates, ...batch.importantDates]),
    }),
    emptyQualitative()
  );

  const executiveSummary = await synthesizeSummary(filename, merged, financials, userId);

  return { executiveSummary, ...merged, financials };
}

async function synthesizeSummary(
  filename: string,
  merged: ReturnType<typeof emptyQualitative>,
  financials: FinancialBreakdown,
  userId: string
): Promise<string> {
  try {
    const result = await completeWithAI(
      {
        system:
          "You write a short executive summary (3-5 sentences) for Sona AI's business tools, based only on " +
          "the structured findings given — don't add anything not reflected in them.",
        messages: [
          {
            role: "user",
            content: `Document: "${filename}"\n\nFindings:\n${JSON.stringify(
              { ...merged, financials },
              null,
              2
            )}`,
          },
        ],
        maxTokens: 300,
      },
      { userId }
    );
    return result.text;
  } catch {
    return "We couldn't generate an executive summary, but the findings below were extracted successfully.";
  }
}

function parseQualitative(raw: string): ReturnType<typeof emptyQualitative> {
  try {
    const parsed = JSON.parse(raw);
    const clean = (arr: unknown): string[] => (Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
    return {
      risks: clean(parsed.risks),
      opportunities: clean(parsed.opportunities),
      actionItems: clean(parsed.actionItems),
      decisions: clean(parsed.decisions),
      importantDates: clean(parsed.importantDates),
    };
  } catch {
    return emptyQualitative();
  }
}

function emptyQualitative() {
  return { risks: [] as string[], opportunities: [] as string[], actionItems: [] as string[], decisions: [] as string[], importantDates: [] as string[] };
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items.map((i) => i.trim()))).filter(Boolean);
}
