"use server";

import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { getCurrentRecruiter } from "@/lib/auth/current-recruiter";
import { RESUMES_BUCKET } from "@/lib/resumes/data";
import { NoTextError, extractPdfText } from "@/lib/resumes/extract";
import {
  type FileMeta,
  MAX_FILE_BYTES,
  cleanFileName,
  isPdf,
  resumeStoragePath,
  uploadRequestSchema,
} from "@/lib/resumes/files";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
const isUuid = (value: string) => z.uuid().safeParse(value).success;

export type PreparedUpload = { candidateId: string; resumeId: string; path: string; token: string };

/**
 * Step 1: the server picks every storage path and hands out one signed upload URL per
 * file, so browsers upload straight to Storage without being able to choose where.
 */
export async function prepareUploads(
  jobId: string,
  files: FileMeta[],
): Promise<{ uploads?: PreparedUpload[]; error?: string }> {
  const recruiter = await getCurrentRecruiter();
  const orgId = recruiter.organization.id;
  if (!isUuid(jobId)) return { error: "This job doesn't exist." };
  const parsed = uploadRequestSchema.safeParse(files);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Those files can't be uploaded." };

  const supabase = await createClient();
  if (!(await jobExists(supabase, jobId, orgId))) return { error: "This job doesn't exist." };

  try {
    const uploads = await Promise.all(
      parsed.data.map(async () => {
        const candidateId = randomUUID();
        const resumeId = randomUUID();
        const path = resumeStoragePath(orgId, candidateId, resumeId);
        const { data, error } = await supabase.storage.from(RESUMES_BUCKET).createSignedUploadUrl(path);
        if (error) throw error;
        return { candidateId, resumeId, path, token: data.token };
      }),
    );
    return { uploads };
  } catch {
    return { error: "Couldn't start the upload. Please try again." };
  }
}

export type ProcessResult = { status: "ready" | "duplicate" | "failed"; message: string };

/**
 * Step 2, after the browser finishes uploading: verify the file, detect duplicates,
 * create the candidate and extract text. The path is rebuilt from the session's org,
 * never taken from the client.
 */
export async function processResume(
  jobId: string,
  upload: { candidateId: string; resumeId: string; fileName: string },
): Promise<ProcessResult> {
  const recruiter = await getCurrentRecruiter();
  const orgId = recruiter.organization.id;
  const { candidateId, resumeId } = upload;
  if (![jobId, candidateId, resumeId].every(isUuid)) return failed("This upload is invalid.");

  const supabase = await createClient();
  if (!(await jobExists(supabase, jobId, orgId))) return failed("This job doesn't exist.");

  const path = resumeStoragePath(orgId, candidateId, resumeId);
  const storage = supabase.storage.from(RESUMES_BUCKET);
  const discardUpload = () => storage.remove([path]);

  const { data: blob, error: downloadError } = await storage.download(path);
  if (downloadError || !blob) return failed("The upload didn't finish. Please try again.");
  const bytes = new Uint8Array(await blob.arrayBuffer());

  if (bytes.length > MAX_FILE_BYTES) {
    await discardUpload();
    return failed("Files must be 10 MB or smaller.");
  }
  if (!isPdf(bytes)) {
    await discardUpload();
    return failed("This file isn't a valid PDF.");
  }

  // Hashed on the server so the same resume is parsed and embedded once per org.
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const existing = await findResumeByHash(supabase, orgId, sha256);
  if (existing) {
    await discardUpload();
    return linkExisting(supabase, orgId, jobId, existing);
  }

  const { error: candidateError } = await supabase
    .from("candidates")
    .insert({ id: candidateId, organization_id: orgId });
  if (candidateError) return failed("Couldn't save this candidate. Please try again.");

  const { error: resumeError } = await supabase.from("resumes").insert({
    id: resumeId,
    organization_id: orgId,
    candidate_id: candidateId,
    storage_path: path,
    file_name: cleanFileName(upload.fileName),
    file_sha256: sha256,
    file_size_bytes: bytes.length,
    status: "extracting",
  });
  if (resumeError) {
    await supabase.from("candidates").delete().eq("id", candidateId);
    await discardUpload();
    // Two copies of the same file in one batch race to insert; the loser links to the winner.
    const winner = resumeError.code === "23505" ? await findResumeByHash(supabase, orgId, sha256) : null;
    return winner ? linkExisting(supabase, orgId, jobId, winner) : failed("Couldn't save this resume. Please try again.");
  }

  const { error: matchError } = await supabase
    .from("matches")
    .insert({ organization_id: orgId, job_id: jobId, candidate_id: candidateId, resume_id: resumeId });
  if (matchError) return failed("Saved the resume but couldn't add it to this job.");

  try {
    const { text, pageCount } = await extractPdfText(bytes);
    // "parsing" = text extracted and queued for AI parsing (Milestone 6).
    await supabase
      .from("resumes")
      .update({ raw_text: text, page_count: pageCount, status: "parsing", error: null })
      .eq("id", resumeId);
    return { status: "ready", message: `Text extracted from ${pageCount} ${pageCount === 1 ? "page" : "pages"}.` };
  } catch (error) {
    const message =
      error instanceof NoTextError ? error.message : "Couldn't read this PDF. It may be damaged or password-protected.";
    await supabase.from("resumes").update({ status: "failed", error: message }).eq("id", resumeId);
    return failed(message);
  }
}

/** A short-lived link to view one resume PDF; the bucket itself stays private. */
export async function getResumeUrl(resumeId: string): Promise<{ url?: string; error?: string }> {
  const recruiter = await getCurrentRecruiter();
  if (!isUuid(resumeId)) return { error: "Resume not found." };
  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("storage_path")
    .eq("id", resumeId)
    .eq("organization_id", recruiter.organization.id)
    .maybeSingle();
  if (!resume) return { error: "Resume not found." };

  const { data, error } = await supabase.storage.from(RESUMES_BUCKET).createSignedUrl(resume.storage_path, 60);
  if (error) return { error: "Couldn't open this resume. Please try again." };
  return { url: data.signedUrl };
}

/**
 * Removes a candidate's PDFs from Storage, then the candidate row. The database cascades
 * to resumes, chunks (with embeddings), matches and outreach emails.
 */
export async function deleteCandidate(candidateId: string): Promise<{ error?: string }> {
  const recruiter = await getCurrentRecruiter();
  const orgId = recruiter.organization.id;
  if (!isUuid(candidateId)) return { error: "Candidate not found." };
  const supabase = await createClient();

  const { data: resumes, error: resumesError } = await supabase
    .from("resumes")
    .select("id, storage_path")
    .eq("candidate_id", candidateId)
    .eq("organization_id", orgId);
  if (resumesError) return { error: "Couldn't delete this candidate. Please try again." };

  // Checked up front so we never delete files and then fail on the database row.
  if (resumes.length) {
    const { count } = await supabase
      .from("eval_pairs")
      .select("id", { count: "exact", head: true })
      .in("resume_id", resumes.map((r) => r.id));
    if (count) return { error: "This candidate is in the evaluation set. Remove them from it first." };

    // Files first: if this fails, nothing is deleted and no PDF is left without a record.
    const { error: storageError } = await supabase.storage
      .from(RESUMES_BUCKET)
      .remove(resumes.map((r) => r.storage_path));
    if (storageError) return { error: "Couldn't delete the resume file. Nothing was deleted." };
  }

  const { data: deleted, error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", candidateId)
    .eq("organization_id", orgId)
    .select("id");
  if (error) return { error: "Couldn't delete this candidate. Please try again." };
  if (!deleted.length) return { error: "Candidate not found." };
  return {};
}

function failed(message: string): ProcessResult {
  return { status: "failed", message };
}

async function jobExists(supabase: Supabase, jobId: string, orgId: string) {
  const { data } = await supabase.from("jobs").select("id").eq("id", jobId).eq("organization_id", orgId).maybeSingle();
  return Boolean(data);
}

async function findResumeByHash(supabase: Supabase, orgId: string, sha256: string) {
  const { data } = await supabase
    .from("resumes")
    .select("id, candidate_id, file_name")
    .eq("organization_id", orgId)
    .eq("file_sha256", sha256)
    .maybeSingle();
  return data;
}

async function linkExisting(
  supabase: Supabase,
  orgId: string,
  jobId: string,
  resume: { id: string; candidate_id: string; file_name: string },
): Promise<ProcessResult> {
  const { error } = await supabase
    .from("matches")
    .upsert(
      { organization_id: orgId, job_id: jobId, candidate_id: resume.candidate_id, resume_id: resume.id },
      { onConflict: "job_id,candidate_id", ignoreDuplicates: true },
    );
  if (error) return failed("This resume was already uploaded, but couldn't be added to this job.");
  return { status: "duplicate", message: `Already uploaded as "${resume.file_name}". Linked to this job.` };
}
