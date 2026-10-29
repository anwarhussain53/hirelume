"use client";

import Link from "next/link";
import { type FormEvent, startTransition, useActionState } from "react";
import { Field, FormMessage, SelectField, SubmitButton, TextAreaField } from "@/components/form";
import { SkillInput } from "@/components/skill-input";
import type { JobFormState } from "@/lib/jobs/actions";
import { WORK_MODE_LABELS } from "@/lib/jobs/format";

export type JobFormDefaults = {
  title: string;
  description: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  minYearsExperience: number;
  location: string;
  workMode: string;
  status: string;
};

const EMPTY: JobFormDefaults = {
  title: "",
  description: "",
  mustHaveSkills: [],
  niceToHaveSkills: [],
  minYearsExperience: 0,
  location: "",
  workMode: "onsite",
  status: "open",
};

type JobFormProps = {
  action: (state: JobFormState, formData: FormData) => Promise<JobFormState>;
  defaults?: JobFormDefaults;
  submitLabel: string;
  cancelHref: string;
  showStatus?: boolean;
};

export function JobForm({ action, defaults = EMPTY, submitLabel, cancelHref, showStatus = false }: JobFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  // Submitting through onSubmit (not <form action>) opts out of React's automatic form
  // reset, which would otherwise snap selects back to their first-render values after a
  // failed save. Every field keeps exactly what the user entered.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5" noValidate>
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <Field label="Job title" name="title" required defaultValue={defaults.title} error={errors.title} />
      <TextAreaField
        label="Job description"
        name="description"
        required
        rows={10}
        defaultValue={defaults.description}
        hint="Paste the full description. It's used to explain scores and write outreach emails."
        error={errors.description}
      />
      <SkillInput
        label="Must-have skills"
        name="mustHaveSkills"
        defaultSkills={defaults.mustHaveSkills}
        hint="Worth 50% of the match score. Press Enter after each skill."
        error={errors.mustHaveSkills}
      />
      <SkillInput
        label="Nice-to-have skills"
        name="niceToHaveSkills"
        defaultSkills={defaults.niceToHaveSkills}
        hint="Worth 10% of the match score. Optional."
        error={errors.niceToHaveSkills}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Minimum years of experience"
          name="minYearsExperience"
          type="number"
          inputMode="decimal"
          min={0}
          max={60}
          step={0.5}
          defaultValue={defaults.minYearsExperience}
          error={errors.minYearsExperience}
        />
        <Field
          label="Location"
          name="location"
          placeholder="e.g. Dallas, TX"
          defaultValue={defaults.location}
          error={errors.location}
        />
        <SelectField
          label="Work mode"
          name="workMode"
          options={WORK_MODE_LABELS}
          defaultValue={defaults.workMode}
          error={errors.workMode}
        />
      </div>
      {showStatus && (
        <div className="sm:w-1/3">
          <SelectField
            label="Status"
            name="status"
            options={{ open: "Open", closed: "Closed" }}
            defaultValue={defaults.status}
            hint="Closed jobs keep their candidates but leave the active list."
            error={errors.status}
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending} pendingLabel="Saving…">
          {submitLabel}
        </SubmitButton>
        <Link
          href={cancelHref}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
