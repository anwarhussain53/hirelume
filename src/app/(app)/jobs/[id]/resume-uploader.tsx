"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { prepareUploads, processResume } from "@/lib/resumes/actions";
import { MAX_FILES_PER_UPLOAD, fileProblem } from "@/lib/resumes/files";
import { createClient } from "@/lib/supabase/client";

type ItemState = "queued" | "uploading" | "processing" | "ready" | "duplicate" | "failed";
type Item = { key: string; name: string; state: ItemState; message?: string };

const CONCURRENCY = 3;

const STATE_LABEL: Record<ItemState, string> = {
  queued: "Waiting",
  uploading: "Uploading…",
  processing: "Reading PDF…",
  ready: "Done",
  duplicate: "Already uploaded",
  failed: "Failed",
};

export function ResumeUploader({ jobId }: { jobId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();

  const update = (key: string, patch: Partial<Item>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  async function upload(fileList: FileList | null) {
    if (!fileList?.length || busy) return;
    setError(undefined);
    const files = Array.from(fileList).map((file, i) => ({ file, key: `${Date.now()}-${i}`, problem: fileProblem(file) }));
    const accepted = files.filter((f) => !f.problem);
    if (accepted.length > MAX_FILES_PER_UPLOAD) {
      setError(`Choose at most ${MAX_FILES_PER_UPLOAD} files at a time.`);
      return;
    }

    setItems(
      files.map(({ file, key, problem }) => ({
        key,
        name: file.name,
        state: problem ? "failed" : "queued",
        message: problem ?? undefined,
      })),
    );
    if (!accepted.length) return;

    setBusy(true);
    try {
      // Some systems report an empty MIME type for PDFs; the server checks the bytes anyway.
      const prepared = await prepareUploads(
        jobId,
        accepted.map(({ file }) => ({ name: file.name, size: file.size, type: "application/pdf" as const })),
      );
      if (!prepared.uploads) {
        setError(prepared.error);
        accepted.forEach(({ key }) => update(key, { state: "failed", message: prepared.error }));
        return;
      }

      const storage = createClient().storage.from("resumes");
      const jobs = accepted.map(({ file, key }, i) => ({ file, key, upload: prepared.uploads![i]! }));
      const worker = async () => {
        for (let job = jobs.shift(); job; job = jobs.shift()) {
          update(job.key, { state: "uploading" });
          const { error: uploadError } = await storage.uploadToSignedUrl(job.upload.path, job.upload.token, job.file, {
            contentType: "application/pdf",
          });
          if (uploadError) {
            update(job.key, { state: "failed", message: "Upload failed. Check your connection and try again." });
            continue;
          }
          update(job.key, { state: "processing" });
          try {
            const result = await processResume(jobId, { ...job.upload, fileName: job.file.name });
            update(job.key, { state: result.status, message: result.message });
          } catch {
            update(job.key, { state: "failed", message: "Something went wrong reading this file." });
          }
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
  }

  const done = items.filter((i) => ["ready", "duplicate", "failed"].includes(i.state)).length;

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event: DragEvent) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: DragEvent) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        <p className="font-medium">Drop resume PDFs here</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Up to {MAX_FILES_PER_UPLOAD} files at a time, 10 MB each.
        </p>
        <label
          className={`mt-4 inline-block cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white focus-within:ring-2 focus-within:ring-amber-500 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {busy ? "Uploading…" : "Choose PDFs"}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={busy}
            onChange={(event: ChangeEvent<HTMLInputElement>) => void upload(event.target.files)}
            className="sr-only"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <p className="border-b border-zinc-200 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-800" aria-live="polite">
            {done} of {items.length} processed
          </p>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((item) => (
              <li key={item.key} className="flex flex-col gap-0.5 px-4 py-2 text-sm sm:flex-row sm:items-center sm:gap-4">
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span
                  className={
                    item.state === "failed"
                      ? "text-red-600 dark:text-red-400"
                      : item.state === "ready" || item.state === "duplicate"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-zinc-500"
                  }
                >
                  {item.message ?? STATE_LABEL[item.state]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
