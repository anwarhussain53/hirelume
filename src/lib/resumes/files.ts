import { z } from "zod";

export const MAX_FILES_PER_UPLOAD = 50;
/** Matches the `resumes` bucket's file_size_limit and the resumes.file_size_bytes check. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const fileMetaSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
  type: z.literal("application/pdf"),
});

export const uploadRequestSchema = z
  .array(fileMetaSchema)
  .min(1, { error: "Choose at least one PDF." })
  .max(MAX_FILES_PER_UPLOAD, { error: `Upload at most ${MAX_FILES_PER_UPLOAD} files at a time.` });

export type FileMeta = z.infer<typeof fileMetaSchema>;

/** Plain-English reason a file is rejected before upload, or null if it's acceptable. */
export function fileProblem(file: { name: string; size: number; type: string }): string | null {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are supported.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_FILE_BYTES) return "Files must be 10 MB or smaller.";
  return null;
}

/**
 * True if the bytes start like a PDF. The spec allows the `%PDF-` header anywhere in
 * the first 1024 bytes. Checked on the server because file names and MIME types are
 * supplied by the browser and can be faked.
 */
export function isPdf(bytes: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  return head.includes("%PDF-");
}

/** Strips any path the browser included and keeps the name within the column limit. */
export function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop()?.trim() || "resume.pdf";
  return base.slice(0, 255);
}

/** Storage layout {org}/{candidate}/{resume}.pdf; the first segment is what RLS checks. */
export function resumeStoragePath(organizationId: string, candidateId: string, resumeId: string): string {
  return `${organizationId}/${candidateId}/${resumeId}.pdf`;
}
