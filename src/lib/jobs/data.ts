import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getCurrentRecruiter } from "@/lib/auth/current-recruiter";
import { createClient } from "@/lib/supabase/server";

const JOB_LIST_COLUMNS = "id, title, status, work_mode, location, must_have_skills, min_years_experience, created_at";
const JOB_DETAIL_COLUMNS = `${JOB_LIST_COLUMNS}, description, nice_to_have_skills, updated_at`;

export const isJobId = (value: string) => z.uuid().safeParse(value).success;

// RLS already limits rows to the caller's organization; the explicit filter is
// defense in depth and lets Postgres use the (organization_id, created_at) index.
export async function listJobs() {
  const recruiter = await getCurrentRecruiter();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_LIST_COLUMNS)
    .eq("organization_id", recruiter.organization.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load jobs (${error.code})`);
  return data;
}

export async function getJob(id: string) {
  if (!isJobId(id)) notFound();
  const recruiter = await getCurrentRecruiter();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_DETAIL_COLUMNS)
    .eq("id", id)
    .eq("organization_id", recruiter.organization.id)
    .maybeSingle();
  if (error) throw new Error(`Could not load job (${error.code})`);
  if (!data) notFound();
  return data;
}

export type JobListItem = Awaited<ReturnType<typeof listJobs>>[number];
export type JobDetail = Awaited<ReturnType<typeof getJob>>;
