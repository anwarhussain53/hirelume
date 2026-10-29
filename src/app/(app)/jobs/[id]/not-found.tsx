import Link from "next/link";

export default function JobNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold">Job not found</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        It may have been removed, or it belongs to a different organization.
      </p>
      <Link href="/jobs" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
        Back to jobs
      </Link>
    </div>
  );
}
