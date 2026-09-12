import mammoth from "mammoth";

export interface ExtractionResult {
  text: string;
  pageCount?: number;
}

const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
  "text/markdown",
] as const;

export function isSupportedFileType(mimeType: string): boolean {
  return (SUPPORTED_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Extracts plain text from an uploaded file buffer. Throws a typed error
 * (never a raw parser stack trace) that the API route maps to a friendly
 * message before it reaches the client.
 */
export async function extractText(buffer: Buffer, mimeType: string): Promise<ExtractionResult> {
  try {
    if (mimeType === "application/pdf") {
      // Lazy import: pdf-parse touches the filesystem on import in some
      // versions, so we only load it when actually handling a PDF.
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return { text: result.text, pageCount: result.numpages };
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value };
    }

    if (mimeType === "text/plain" || mimeType === "text/markdown") {
      return { text: buffer.toString("utf-8") };
    }

    throw new Error("UNSUPPORTED_FILE_TYPE");
  } catch (err) {
    if (err instanceof Error && err.message === "UNSUPPORTED_FILE_TYPE") throw err;
    throw new Error("EXTRACTION_FAILED");
  }
}

/**
 * Splits long extracted text into safe chunks for AI/TTS processing,
 * trying to break on paragraph boundaries rather than mid-sentence.
 */
export function chunkText(text: string, maxChars = 6000): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}
