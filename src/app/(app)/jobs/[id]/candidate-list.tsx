import { formatDate } from "@/lib/jobs/format";
import { listJobCandidates } from "@/lib/resumes/data";
import { CandidateActions } from "./candidate-actions";

const RESUME_STATUS: Record<string, { label: string; className: string }> = {
  uploaded: { label: "Uploaded", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  extracting: { label: "Reading PDF", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  parsing: { label: "Awaiting analysis", className: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
  embedding: { label: "Analyzing", className: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
  ready: { label: "Ready", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
};

export async function CandidateList({ jobId }: { jobId: string }) {
  const candidates = await listJobCandidates(jobId);

  if (candidates.length === 0) {
    return <p className="text-sm text-zinc-500">No candidates yet. Upload resumes to get started.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {candidates.map(({ id, candidate, resume }) => {
        if (!candidate || !resume) return null;
        const status = RESUME_STATUS[resume.status] ?? RESUME_STATUS.uploaded!;
        const label = candidate.full_name || resume.file_name;
        return (
          <li key={id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{label}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-zinc-500">
                {[
                  candidate.full_name ? resume.file_name : null,
                  resume.page_count ? `${resume.page_count} ${resume.page_count === 1 ? "page" : "pages"}` : null,
                  `Uploaded ${formatDate(resume.created_at)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {resume.status === "failed" && resume.error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{resume.error}</p>
              )}
            </div>
            <CandidateActions candidateId={candidate.id} resumeId={resume.id} label={label} />
          </li>
        );
      })}
    </ul>
  );
}
