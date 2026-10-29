import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { updateJob } from "@/lib/jobs/actions";
import { getJob } from "@/lib/jobs/data";
import { JobForm } from "../../job-form";

export const metadata: Metadata = { title: "Edit job · Hirelume" };

export default function EditJobPage({ params }: PageProps<"/jobs/[id]/edit">) {
  return (
    <Suspense fallback={<div className="h-96 max-w-2xl animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />}>
      {params.then(({ id }) => (
        <EditJob id={id} />
      ))}
    </Suspense>
  );
}

async function EditJob({ id }: { id: string }) {
  const job = await getJob(id);

  return (
    <>
      <Link href={`/jobs/${job.id}`} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← {job.title}
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-semibold tracking-tight">Edit job</h1>
      <JobForm
        action={updateJob.bind(null, job.id)}
        defaults={{
          title: job.title,
          description: job.description,
          mustHaveSkills: job.must_have_skills,
          niceToHaveSkills: job.nice_to_have_skills,
          minYearsExperience: job.min_years_experience,
          location: job.location ?? "",
          workMode: job.work_mode,
          status: job.status,
        }}
        submitLabel="Save changes"
        cancelHref={`/jobs/${job.id}`}
        showStatus
      />
    </>
  );
}
