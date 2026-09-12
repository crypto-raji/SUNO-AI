export default function UploadPreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between rounded-lg border border-line bg-ink-800 px-3 py-2">
      <div className="flex items-center gap-2 overflow-hidden">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-signal">
          <path
            d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
        <span className="truncate text-sm text-paper-100">{file.name}</span>
        <span className="shrink-0 text-xs text-paper-300">{(file.size / 1024).toFixed(0)} KB</span>
      </div>
      <button onClick={onRemove} className="ml-2 shrink-0 text-paper-300 hover:text-paper-100" aria-label="Remove file">
        ✕
      </button>
    </div>
  );
}
