"use client";

import { type KeyboardEvent, useId, useState } from "react";
import { MAX_SKILLS, parseSkillList } from "@/lib/jobs/schema";
import { FieldShell, describedBy } from "./form";

type SkillInputProps = {
  label: string;
  name: string;
  defaultSkills: string[];
  hint?: string;
  error?: string;
};

/**
 * Chip-style skill entry. Enter or comma adds a skill, Backspace on an empty
 * input removes the last one, and pasting a list adds every item. The value is
 * submitted as newline-separated text and re-validated on the server.
 */
export function SkillInput({ label, name, defaultSkills, hint, error }: SkillInputProps) {
  const [skills, setSkills] = useState(defaultSkills);
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const shell = { label, hint, error };

  function add(text: string) {
    const next = parseSkillList([...skills, ...parseSkillList(text)].join("\n")).slice(0, MAX_SKILLS);
    setSkills(next);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Enter") {
      // Don't submit the whole form from an empty skill box.
      event.preventDefault();
    } else if (event.key === "Backspace" && !draft && skills.length) {
      setSkills(skills.slice(0, -1));
    }
  }

  return (
    <FieldShell id={inputId} {...shell}>
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 focus-within:ring-2 dark:bg-zinc-900 ${
          error
            ? "border-red-500"
            : "border-zinc-300 focus-within:border-zinc-900 focus-within:ring-zinc-900/10 dark:border-zinc-700 dark:focus-within:border-zinc-100 dark:focus-within:ring-zinc-100/10"
        }`}
      >
        <ul className="contents" aria-label={`${label} added`}>
          {skills.map((skill) => (
            <li
              key={skill.toLowerCase()}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-0.5 pr-1 pl-2 text-sm dark:bg-zinc-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => setSkills(skills.filter((s) => s !== skill))}
                aria-label={`Remove ${skill}`}
                className="rounded px-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (/[\n,]/.test(text)) {
              event.preventDefault();
              add(text);
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, shell)}
          placeholder={skills.length ? "" : "Type a skill and press Enter"}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-base outline-none"
        />
      </div>
      <input type="hidden" name={name} value={skills.join("\n")} />
    </FieldShell>
  );
}
