import type { FinancialBreakdown, LineItem } from "./types";

function LineItems({ title, items }: { title: string; items: LineItem[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-paper-300/70">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-paper-200">
              {item.label}
              {item.period && <span className="text-paper-300/70"> · {item.period}</span>}
            </span>
            <span className="shrink-0 text-paper-100">{item.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FinancialBreakdownCard({ financials }: { financials: FinancialBreakdown }) {
  if (!financials.hasFinancialData) {
    return (
      <div className="glass-panel mt-1 w-full max-w-md p-4">
        <p className="text-sm text-paper-100">No financial figures were found in this document.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel mt-1 w-full max-w-md space-y-4 p-4">
      <LineItems title="Revenue" items={financials.revenue} />
      <LineItems title="Expenses" items={financials.expenses} />
      <LineItems title="Profit / loss" items={financials.profitLoss} />
      {financials.notes && <p className="border-t border-line pt-3 text-xs text-paper-300/70">{financials.notes}</p>}
    </div>
  );
}
