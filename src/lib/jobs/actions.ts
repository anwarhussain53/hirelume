"use server";

import { redirect } from "next/navigation";
import { getCurrentRecruiter } from "@/lib/auth/current-recruiter";
import { type FieldErrors, firstFieldErrors } from "@/lib/forms";
import { isJobId } from "@/lib/jobs/data";
import { jobFormSchema, toJobColumns } from "@/lib/jobs/schema";
import { createClient } from "@/lib/supabase/server";

export type JobFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
};

export async function createJob(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  // Ownership comes from the verified session, never from the form.
  const recruiter = await getCurrentRecruiter();
  const parsed = jobFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      ...toJobColumns(parsed.data),
      organization_id: recruiter.organization.id,
      created_by: recruiter.id,
    })
    .select("id")
    .single();
  if (error) return { error: "Couldn't save the job. Please try again." };

  redirect(`/jobs/${data.id}`);
}

export async function updateJob(jobId: string, _prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const recruiter = await getCurrentRecruiter();
  if (!isJobId(jobId)) return { error: "This job doesn't exist." };
  const parsed = jobFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update(toJobColumns(parsed.data))
    .eq("id", jobId)
    .eq("organization_id", recruiter.organization.id)
    .select("id")
    .maybeSingle();
  if (error) return { error: "Couldn't save the job. Please try again." };
  if (!data) return { error: "This job no longer exists or you don't have access to it." };

  redirect(`/jobs/${data.id}`);
}
