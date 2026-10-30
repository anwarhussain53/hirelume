import "server-only";
import { getCurrentRecruiter } from "@/lib/auth/current-recruiter";
import { createClient } from "@/lib/supabase/server";

export const RESUMES_BUCKET = "resumes";

/** Candidates attached to a job, newest first. Never selects resume text. */
export async function listJobCandidates(jobId: string) {
  const recruiter = await getCurrentRecruiter();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, stage, created_at, candidate:candidates(id, full_name), resume:resumes(id, file_name, page_count, status, error, created_at)",
    )
    .eq("job_id", jobId)
    .eq("organization_id", recruiter.organization.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load candidates (${error.code})`);
  return data;
}

export type JobCandidate = Awaited<ReturnType<typeof listJobCandidates>>[number];
