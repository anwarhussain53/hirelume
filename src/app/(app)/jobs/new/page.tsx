import type { Metadata } from "next";
import { createJob } from "@/lib/jobs/actions";
import { JobForm } from "../job-form";

export const metadata: Metadata = { title: "New job · Hirelume" };

export default function NewJobPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New job</h1>
      <JobForm action={createJob} submitLabel="Create job" cancelHref="/jobs" />
    </>
  );
}
