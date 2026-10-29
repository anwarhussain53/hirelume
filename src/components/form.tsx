"use client";

import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, useId } from "react";
import { useFormStatus } from "react-dom";

export const controlClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10";

type ShellProps = { label: string; hint?: string; error?: string };

// Ids come from useId, not the field name: Next keeps recently visited pages mounted
// but hidden, so two forms with the same field names can be in the DOM at once.

/** Ids that link a control to its hint and error text for screen readers. */
export function describedBy(id: string, { hint, error }: ShellProps) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

export function FieldShell({ id, label, hint, error, children }: ShellProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-zinc-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

type Native<T> = Omit<T, "aria-describedby" | "id" | "name"> & { name: string };

export function Field({ label, name, hint, error, ...input }: ShellProps & Native<InputHTMLAttributes<HTMLInputElement>>) {
  const id = useId();
  const shell = { label, hint, error };
  return (
    <FieldShell id={id} {...shell}>
      <input
        {...input}
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, shell)}
        className={controlClass}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  name,
  hint,
  error,
  ...textarea
}: ShellProps & Native<TextareaHTMLAttributes<HTMLTextAreaElement>>) {
  const id = useId();
  const shell = { label, hint, error };
  return (
    <FieldShell id={id} {...shell}>
      <textarea
        {...textarea}
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, shell)}
        className={`${controlClass} min-h-40 resize-y`}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  hint,
  error,
  options,
  ...select
}: ShellProps & Native<SelectHTMLAttributes<HTMLSelectElement>> & { options: Record<string, string> }) {
  const id = useId();
  const shell = { label, hint, error };
  return (
    <FieldShell id={id} {...shell}>
      <select
        {...select}
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, shell)}
        className={controlClass}
      >
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** `pending` is for forms submitted via onSubmit, where useFormStatus doesn't apply. */
export function SubmitButton({
  children,
  pendingLabel,
  pending: pendingProp,
}: {
  children: string;
  pendingLabel: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "notice"; children: string }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
          : "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
      }
    >
      {children}
    </p>
  );
}
