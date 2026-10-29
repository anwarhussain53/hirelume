import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SkillChips, StatusBadge } from "@/components/badges";
import { WORK_MODE_LABELS, formatDate, formatMinYears } from "@/lib/jobs/format";
import { getJob } from "@/lib/jobs/data";

export const metadata: Metadata = { title: "Job · Hirelume" };

// Not async: params are request data, so they're read inside the Suspense boundary.
export default function JobPage({ params }: PageProps<"/jobs/[id]">) {
  return (
    <>
      <Link href="/jobs" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← All jobs
      </Link>
      <Suspense fallback={<div className="mt-4 h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />}>
        {params.then(({ id }) => (
          <JobDetail id={id} />
        ))}
      </Suspense>
    </>
  );
}

async function JobDetail({ id }: { id: string }) {
  const job = await getJob(id);

  return (
    <article className="mt-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {[WORK_MODE_LABELS[job.work_mode], job.location, formatMinYears(job.min_years_experience)]
              .filter(Boolean)
              .join(" · ")}{" "}
            · Created {formatDate(job.created_at)}
          </p>
        </div>
        <Link
          href={`/jobs/${job.id}/edit`}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Edit job
        </Link>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="text-sm font-medium text-zinc-500">Description</h2>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </section>
        <aside className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-medium text-zinc-500">Must-have skills</h2>
            <SkillChips skills={job.must_have_skills} />
          </section>
          {job.nice_to_have_skills.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-zinc-500">Nice-to-have skills</h2>
              <SkillChips skills={job.nice_to_have_skills} tone="muted" />
            </section>
          )}
        </aside>
      </div>

      <section className="mt-10 rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
        <p className="font-medium">Candidates</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Resume upload and ranking arrive in the next milestones.</p>
      </section>
    </article>
  );
}
