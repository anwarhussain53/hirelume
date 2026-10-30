import { describe, expect, it } from "vitest";
import { SAMPLE_RESUME_LINES, makePdf } from "../../../tests/fixtures/make-pdf";
import { MAX_TEXT_CHARS, NoTextError, extractPdfText, normalizeText } from "./extract";

describe("extractPdfText", () => {
  it("extracts text and page count from a text PDF", async () => {
    const { text, pageCount } = await extractPdfText(makePdf([SAMPLE_RESUME_LINES, ["Page two: certifications"]]));
    expect(pageCount).toBe(2);
    expect(text).toContain("Spring Boot");
    expect(text).toContain("Page two: certifications");
  });

  it("treats a PDF without a text layer as a scanned image", async () => {
    await expect(extractPdfText(makePdf([[]]))).rejects.toBeInstanceOf(NoTextError);
  });

  it("rejects text too short to be a resume", async () => {
    await expect(extractPdfText(makePdf([["Jordan Rivera"]]))).rejects.toBeInstanceOf(NoTextError);
  });

  it("throws on bytes that aren't a parsable PDF", async () => {
    await expect(extractPdfText(new TextEncoder().encode("%PDF-1.4 garbage"))).rejects.toThrow();
  });

  it("caps very long documents", async () => {
    const line = "Experienced engineer delivering reliable distributed systems at scale. ".repeat(4);
    const pages = Array.from({ length: 400 }, () => Array(50).fill(line));
    const { text } = await extractPdfText(makePdf(pages));
    expect(text.length).toBe(MAX_TEXT_CHARS);
  });
});

describe("normalizeText", () => {
  it("collapses spaces and blank lines but keeps paragraph breaks", () => {
    expect(normalizeText("  Java \t  Spring\r\n\r\n\r\n\nKafka  ")).toBe("Java Spring\n\nKafka");
  });
});
