import { completeWithAI } from "@/lib/services/ai";
import type { DocumentSection } from "./sections";

export interface LineItem {
  label: string;
  amount: string; // kept as the original text (currency/formatting varies) rather than a parsed float
  period?: string;
}

export interface FinancialBreakdown {
  hasFinancialData: boolean;
  revenue: LineItem[];
  expenses: LineItem[];
  profitLoss: LineItem[];
  notes: string; // e.g. "No expense figures were found in this document."
}

const MAX_SECTIONS_SCANNED = 8;

/**
 * Extracts revenue, expenses, and profit/loss figures. Scans every section
 * (up to a cap) rather than just the first chunk, since financial figures
 * are often scattered through a report — then merges everything into one
 * deduplicated structure. Never invents a figure: sections with nothing
 * financial simply contribute nothing, and the final `notes` field says so
 * plainly if entire categories are empty.
 */
export async function extractFinancials(sections: DocumentSection[], userId: string): Promise<FinancialBreakdown> {
  const scanned = sections.slice(0, MAX_SECTIONS_SCANNED);

  const partials = await Promise.all(
    scanned.map(async (section) => {
      try {
        const result = await completeWithAI(
          {
            system:
              "You extract financial figures for Sona AI's business tools. Work ONLY from the text given — " +
              "if a category has no figures in this section, return an empty array for it. Never estimate or " +
              "invent a number. Return strict JSON only: " +
              `{"revenue":[{"label":string,"amount":string,"period":string|null}],"expenses":[...same shape...],"profitLoss":[...same shape...]}`,
            messages: [
              { role: "user", content: `Section "${section.title}":\n"""${section.content.slice(0, 3500)}"""` },
            ],
            jsonMode: true,
            maxTokens: 600,
          },
          { userId }
        );
        return parseLineItems(result.text);
      } catch {
        return { revenue: [], expenses: [], profitLoss: [] };
      }
    })
  );

  const revenue = dedupe(partials.flatMap((p) => p.revenue));
  const expenses = dedupe(partials.flatMap((p) => p.expenses));
  const profitLoss = dedupe(partials.flatMap((p) => p.profitLoss));
  const hasFinancialData = revenue.length + expenses.length + profitLoss.length > 0;

  let notes = "";
  if (!hasFinancialData) {
    notes = "No revenue, expense, or profit/loss figures were found in this document.";
  } else {
    const missing: string[] = [];
    if (revenue.length === 0) missing.push("revenue");
    if (expenses.length === 0) missing.push("expenses");
    if (profitLoss.length === 0) missing.push("profit/loss");
    if (missing.length > 0) notes = `No ${missing.join(" or ")} figures were found in this document.`;
  }

  return { hasFinancialData, revenue, expenses, profitLoss, notes };
}

function parseLineItems(raw: string): { revenue: LineItem[]; expenses: LineItem[]; profitLoss: LineItem[] } {
  try {
    const parsed = JSON.parse(raw);
    const clean = (arr: unknown): LineItem[] =>
      Array.isArray(arr)
        ? arr
            .filter((i) => i && typeof i.label === "string" && typeof i.amount === "string")
            .map((i) => ({ label: i.label, amount: i.amount, period: i.period ?? undefined }))
        : [];
    return { revenue: clean(parsed.revenue), expenses: clean(parsed.expenses), profitLoss: clean(parsed.profitLoss) };
  } catch {
    return { revenue: [], expenses: [], profitLoss: [] };
  }
}

function dedupe(items: LineItem[]): LineItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.label.toLowerCase()}|${item.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
