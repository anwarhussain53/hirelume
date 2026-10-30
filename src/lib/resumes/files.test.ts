import { describe, expect, it } from "vitest";
import { makePdf } from "../../../tests/fixtures/make-pdf";
import {
  MAX_FILE_BYTES,
  MAX_FILES_PER_UPLOAD,
  cleanFileName,
  fileProblem,
  isPdf,
  resumeStoragePath,
  uploadRequestSchema,
} from "./files";

const pdfMeta = { name: "resume.pdf", size: 1000, type: "application/pdf" };

describe("uploadRequestSchema", () => {
  it("accepts 1 to 50 PDFs", () => {
    expect(uploadRequestSchema.safeParse([pdfMeta]).success).toBe(true);
    expect(uploadRequestSchema.safeParse(Array(MAX_FILES_PER_UPLOAD).fill(pdfMeta)).success).toBe(true);
  });

  it.each([
    ["no files", []],
    ["51 files", Array(MAX_FILES_PER_UPLOAD + 1).fill(pdfMeta)],
    ["a non-PDF type", [{ ...pdfMeta, type: "image/png" }]],
    ["an oversized file", [{ ...pdfMeta, size: MAX_FILE_BYTES + 1 }]],
    ["an empty file", [{ ...pdfMeta, size: 0 }]],
  ])("rejects %s", (_label, files) => {
    expect(uploadRequestSchema.safeParse(files).success).toBe(false);
  });
});

describe("fileProblem", () => {
  it("accepts a normal PDF", () => {
    expect(fileProblem(pdfMeta)).toBeNull();
  });

  it("explains each rejection", () => {
    expect(fileProblem({ ...pdfMeta, name: "photo.png", type: "image/png" })).toBe("Only PDF files are supported.");
    expect(fileProblem({ ...pdfMeta, size: 0 })).toBe("This file is empty.");
    expect(fileProblem({ ...pdfMeta, size: MAX_FILE_BYTES + 1 })).toBe("Files must be 10 MB or smaller.");
  });
});

describe("isPdf", () => {
  it("recognizes a real PDF", () => {
    expect(isPdf(makePdf([["hello"]]))).toBe(true);
  });

  it("finds the header after leading junk within 1 KB", () => {
    const bytes = new Uint8Array([...new TextEncoder().encode("junk\n"), ...makePdf([["x"]])]);
    expect(isPdf(bytes)).toBe(true);
  });

  it("rejects a non-PDF renamed to .pdf", () => {
    expect(isPdf(new TextEncoder().encode("<html>not a pdf</html>"))).toBe(false);
    expect(isPdf(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false); // PNG signature
  });
});

describe("cleanFileName", () => {
  it("drops any directory path the browser sent", () => {
    expect(cleanFileName("C:\\Users\\me\\Jordan Resume.pdf")).toBe("Jordan Resume.pdf");
    expect(cleanFileName("../../etc/passwd.pdf")).toBe("passwd.pdf");
  });

  it("caps the length and handles blanks", () => {
    expect(cleanFileName(`${"a".repeat(300)}.pdf`)).toHaveLength(255);
    expect(cleanFileName("   ")).toBe("resume.pdf");
  });
});

describe("resumeStoragePath", () => {
  it("puts the organization first so storage RLS can check it", () => {
    expect(resumeStoragePath("org", "cand", "res")).toBe("org/cand/res.pdf");
  });
});
