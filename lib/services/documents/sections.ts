export interface DocumentSection {
  index: number;
  title: string;
  content: string;
}

const HEADING_PATTERNS = [
  /^#{1,3}\s+(.+)$/, // Markdown headings
  /^(chapter|section|part|lecture)\s+\d+[:.\-]?\s*(.*)$/i, // "Chapter 3: ..."
  /^\d+(\.\d+)*[.\)]\s+[A-Z].{2,80}$/, // "1. Introduction", "2.1) Cell structure"
  /^[A-Z][A-Z\s\d&\-]{3,60}$/, // ALL CAPS short heading line
];

function looksLikeHeading(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 90) return null;

  for (const pattern of HEADING_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      // Prefer a captured group if the pattern has one, otherwise the whole line
      const captured = match[2] ?? match[1];
      return (captured && captured.trim().length > 0 ? captured : trimmed).trim();
    }
  }
  return null;
}

/**
 * Detects structural sections in extracted document text using heading
 * heuristics (markdown headings, "Chapter N", numbered headings, ALL CAPS
 * lines). Falls back to even-sized chunks labeled "Section N" for documents
 * with no detectable structure (e.g. a wall of prose), so downstream
 * features (lecture audio, revision notes) always have something to work
 * section-by-section against.
 */
export function detectSections(text: string, fallbackChunkChars = 4000): DocumentSection[] {
  const lines = text.split(/\r?\n/);
  const rawSections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const heading = looksLikeHeading(line);
    if (heading) {
      if (current && current.lines.join("").trim().length > 0) rawSections.push(current);
      current = { title: heading.slice(0, 80), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      // Content before the first detected heading — keep it as an
      // "Introduction" section rather than discarding it.
      current = { title: "Introduction", lines: [line] };
    }
  }
  if (current && current.lines.join("").trim().length > 0) rawSections.push(current);

  const meaningful = rawSections.filter((s) => s.lines.join("\n").trim().length > 40);

  if (meaningful.length >= 2) {
    return meaningful.map((s, i) => ({
      index: i,
      title: s.title,
      content: s.lines.join("\n").trim(),
    }));
  }

  // Not enough structure detected — fall back to even chunks.
  const sections: DocumentSection[] = [];
  for (let i = 0, idx = 0; i < text.length; i += fallbackChunkChars, idx++) {
    const content = text.slice(i, i + fallbackChunkChars).trim();
    if (content) sections.push({ index: idx, title: `Section ${idx + 1}`, content });
  }
  return sections.length > 0 ? sections : [{ index: 0, title: "Document", content: text.trim() }];
}
