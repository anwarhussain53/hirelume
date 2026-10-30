"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCandidate, getResumeUrl } from "@/lib/resumes/actions";

export function CandidateActions({ candidateId, resumeId, label }: { candidateId: string; resumeId: string; label: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function viewPdf() {
    setError(undefined);
    // Open the tab during the click so popup blockers allow it, then point it at the
    // short-lived signed URL once the server returns it.
    const tab = window.open("about:blank", "_blank");
    startTransition(async () => {
      const { url, error } = await getResumeUrl(resumeId);
      if (url && tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        tab?.close();
        setError(error ?? "Couldn't open this resume.");
      }
    });
  }

  function remove() {
    setError(undefined);
    startTransition(async () => {
      const { error } = await deleteCandidate(candidateId);
      if (error) {
        setError(error);
        setConfirming(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2 text-sm">
        {confirming ? (
          <>
            <span className="text-zinc-600 dark:text-zinc-400">Delete permanently?</span>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="rounded-lg bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="px-2 py-1 font-medium">
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={viewPdf}
              disabled={pending}
              className="rounded-lg border border-zinc-300 px-3 py-1 font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              View PDF
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${label}`}
              className="rounded-lg px-3 py-1 font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Delete
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
