import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentRecruiter } from "@/lib/auth/current-recruiter";

export const metadata: Metadata = { title: "Jobs · Hirelume" };

export default function JobsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
      <Suspense fallback={<div className="mt-2 h-5 w-64 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />}>
        <Greeting />
      </Suspense>
      <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
        <p className="font-medium">No jobs yet</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Creating jobs arrives in the next milestone.
        </p>
      </div>
    </>
  );
}

async function Greeting() {
  const recruiter = await getCurrentRecruiter();
  const firstName = recruiter.fullName.split(" ")[0] || recruiter.email;
  return (
    <p className="mt-1 text-zinc-600 dark:text-zinc-400">
      Welcome, {firstName}. You&apos;re working in {recruiter.organization.name}.
    </p>
  );
}
