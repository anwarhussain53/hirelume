import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/badges";
import { WORK_MODE_LABELS, formatDate, formatMinYears } from "@/lib/jobs/format";
import { listJobs } from "@/lib/jobs/data";

export const metadata: Metadata = { title: "Jobs · Hirelume" };

export default function JobsPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <Link
          href="/jobs/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          New job
        </Link>
      </div>
      <Suspense fallback={<JobListSkeleton />}>
        <JobList />
      </Suspense>
    </>
  );
}

async function JobList() {
  const jobs = await listJobs();

  if (jobs.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
        <p className="font-medium">No jobs yet</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create a job, then upload resumes to rank candidates against it.
        </p>
        <Link href="/jobs/new" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
          Create your first job
        </Link>
      </div>
    );
  }

  const open = jobs.filter((job) => job.status === "open");
  const closed = jobs.filter((job) => job.status === "closed");

  return (
    <div className="mt-6 flex flex-col gap-8">
      <JobSection title={`Open (${open.length})`} jobs={open} empty="No open jobs." />
      {closed.length > 0 && <JobSection title={`Closed (${closed.length})`} jobs={closed} />}
    </div>
  );
}

function JobSection({ title, jobs, empty }: { title: string; jobs: Awaited<ReturnType<typeof listJobs>>; empty?: string }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-zinc-500">{title}</h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className="flex flex-col gap-1 px-4 py-4 hover:bg-zinc-50 sm:flex-row sm:items-center sm:gap-4 dark:hover:bg-zinc-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{job.title}</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">
                    {[WORK_MODE_LABELS[job.work_mode], job.location, formatMinYears(job.min_years_experience)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <span>
                    {job.must_have_skills.length} must-have {job.must_have_skills.length === 1 ? "skill" : "skills"}
                  </span>
                  <span className="hidden sm:inline">{formatDate(job.created_at)}</span>
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function JobListSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-2" aria-busy="true" aria-label="Loading jobs">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-18 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
