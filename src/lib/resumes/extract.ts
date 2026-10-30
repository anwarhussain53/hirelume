import { extractText } from "unpdf";

/** Below this, a "resume" is almost certainly a scanned image with no text layer. */
export const MIN_TEXT_CHARS = 200;
/** Generous for any real resume; caps storage and future LLM input. */
export const MAX_TEXT_CHARS = 100_000;

export class NoTextError extends Error {
  constructor() {
    super("This PDF has no selectable text. It may be a scanned image.");
    this.name = "NoTextError";
  }
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfText(bytes: Uint8Array): Promise<{ text: string; pageCount: number }> {
  // Given raw bytes, unpdf opens and destroys the document itself. pdf.js may detach
  // the buffer it's handed, so pass a copy and keep the caller's bytes intact.
  const { totalPages, text } = await extractText(new Uint8Array(bytes), { mergePages: true });
  const normalized = normalizeText(text).slice(0, MAX_TEXT_CHARS);
  if (normalized.length < MIN_TEXT_CHARS) throw new NoTextError();
  return { text: normalized, pageCount: totalPages };
}
