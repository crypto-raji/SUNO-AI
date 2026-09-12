export interface ActionChip {
  id: string;
  label: string;
}

export default function ActionChips({
  actions,
  onSelect,
  disabled,
}: {
  actions: ActionChip[];
  onSelect: (actionId: string) => void;
  disabled?: boolean;
}) {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button key={a.id} disabled={disabled} onClick={() => onSelect(a.id)} className="action-chip disabled:opacity-50">
          {a.label}
        </button>
      ))}
    </div>
  );
}
