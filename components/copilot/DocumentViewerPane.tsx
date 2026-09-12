"use client";

import { useEffect, useState, useRef } from "react";
import type { DocumentSection } from "@/lib/services/documents/sections";

interface DocumentDetail {
  id: string;
  filename: string;
  file_type: string;
  file_size: number | null;
  detected_type: string | null;
  extracted_text: string | null;
  sections: DocumentSection[];
}

export default function DocumentViewerPane({
  documentId,
  highlightedSectionId,
  onClose,
}: {
  documentId: string | null;
  highlightedSectionId?: number | null;
  onClose: () => void;
}) {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!documentId) {
      setDoc(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/documents/${documentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.document) {
          setDoc(data.document);
        }
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  // Auto-scroll to highlighted section when citation is triggered
  useEffect(() => {
    if (highlightedSectionId !== undefined && highlightedSectionId !== null) {
      const el = sectionRefs.current[highlightedSectionId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightedSectionId]);

  if (!documentId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center border-r border-line bg-ink-950/70">
        <p className="text-xs text-paper-300/70">Attach or upload a document to view it side-by-side.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-r border-line/60 bg-ink-950/80 backdrop-blur-md">
      {/* Pane Top Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-3.5 py-2.5 bg-ink-900/70">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-paper-300 shrink-0">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <div className="min-w-0">
            <h3 className="font-display text-xs font-bold text-paper-100 truncate">
              {doc?.filename || "Document Viewer"}
            </h3>
            <p className="text-[10px] text-paper-300/70 capitalize">
              {doc?.detected_type?.replace("_", " ") || "Source Document"} ·{" "}
              {doc?.sections?.length ?? 1} sections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-line p-1 text-xs text-paper-300 hover:bg-ink-800 hover:text-paper-100"
            title="Close Split View"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Search within document */}
      <div className="border-b border-line/40 px-3 py-2 bg-ink-950/50">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter document text…"
          className="w-full rounded-lg border border-line bg-ink-900 px-3 py-1 text-xs text-paper-100 placeholder-paper-300/40 outline-none focus:border-signal/50"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-paper-300 animate-pulse">Loading document sections…</p>
          </div>
        ) : !doc ? (
          <p className="text-xs text-paper-300/70 text-center py-8">Document content unavailable.</p>
        ) : doc.sections && doc.sections.length > 0 ? (
          doc.sections.map((section, idx) => {
            const isHighlighted = highlightedSectionId === section.index || highlightedSectionId === idx;
            const matchesSearch =
              !search ||
              section.title.toLowerCase().includes(search.toLowerCase()) ||
              section.content.toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return null;

            return (
              <div
                key={section.index ?? idx}
                ref={(el) => {
                  sectionRefs.current[section.index ?? idx] = el;
                }}
                className={`rounded-xl border p-3.5 transition-all duration-300 text-xs ${
                  isHighlighted
                    ? "border-signal bg-signal/10 shadow-[0_0_20px_rgba(232,163,61,0.25)] ring-1 ring-signal"
                    : "border-line bg-ink-900/50 hover:border-paper-300/20"
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-line/40">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md border border-signal/30 bg-signal/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-signal">
                      § {idx + 1}
                    </span>
                    <h4 className="font-semibold text-paper-100 truncate">{section.title}</h4>
                  </div>
                </div>
                <p className="mt-2.5 text-paper-200 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-line bg-ink-900/50 p-4 text-xs leading-relaxed text-paper-200 whitespace-pre-wrap">
            {doc.extracted_text}
          </div>
        )}
      </div>
    </div>
  );
}
