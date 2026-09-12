import type { BusinessAnalysis } from "./types";
import FinancialBreakdownCard from "./FinancialBreakdownCard";

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-paper-300/70">{title}</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-paper-200">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BusinessAnalysisCard({ analysis }: { analysis: BusinessAnalysis }) {
  return (
    <div className="space-y-3">
      <div className="glass-panel w-full max-w-md space-y-4 p-4">
        <p className="text-sm text-paper-100">{analysis.executiveSummary}</p>
        <ListSection title="Risks" items={analysis.risks} />
        <ListSection title="Opportunities" items={analysis.opportunities} />
        <ListSection title="Action items" items={analysis.actionItems} />
        <ListSection title="Decisions" items={analysis.decisions} />
        <ListSection title="Important dates" items={analysis.importantDates} />
      </div>
      <FinancialBreakdownCard financials={analysis.financials} />
    </div>
  );
}
