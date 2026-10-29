import { z } from "zod";

export const WORK_MODES = ["onsite", "hybrid", "remote"] as const;
export const JOB_STATUSES = ["open", "closed"] as const;
export const MAX_SKILLS = 30;
export const MAX_SKILL_LENGTH = 60;

/**
 * Splits a newline- or comma-separated skill list, trims it, collapses inner
 * whitespace and drops case-insensitive duplicates ("React" and "react").
 */
export function parseSkillList(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const part of raw.split(/[\n,]/)) {
    const skill = part.trim().replace(/\s+/g, " ");
    const key = skill.toLowerCase();
    if (!skill || seen.has(key)) continue;
    seen.add(key);
    skills.push(skill);
  }
  return skills;
}

const skillList = (label: string) =>
  z.preprocess(
    parseSkillList,
    z
      .array(z.string().max(MAX_SKILL_LENGTH, { error: `Keep each skill under ${MAX_SKILL_LENGTH} characters.` }))
      .max(MAX_SKILLS, { error: `Add at most ${MAX_SKILLS} ${label}.` }),
  );

const years = z.preprocess(
  (value) => (value === "" || value == null ? 0 : Number(value)),
  z
    .number({ error: "Enter a number of years." })
    .min(0, { error: "Years can't be negative." })
    .max(60, { error: "Enter 60 years or fewer." })
    // Stored as numeric(4,1).
    .transform((value) => Math.round(value * 10) / 10),
);

export const jobFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: "Enter a job title." })
      .max(200, { error: "Keep the title under 200 characters." }),
    description: z
      .string()
      .trim()
      .min(1, { error: "Paste the job description." })
      .max(20000, { error: "Keep the description under 20,000 characters." }),
    mustHaveSkills: skillList("must-have skills").refine((skills) => skills.length > 0, {
      error: "Add at least one must-have skill.",
    }),
    niceToHaveSkills: skillList("nice-to-have skills"),
    minYearsExperience: years,
    location: z
      .string()
      .trim()
      .max(200, { error: "Keep the location under 200 characters." })
      .optional()
      .transform((value) => value || null),
    workMode: z.enum(WORK_MODES, { error: "Choose a work mode." }),
    status: z.enum(JOB_STATUSES, { error: "Choose a status." }).default("open"),
  })
  .superRefine((job, ctx) => {
    // A skill listed as both would be double-counted by the scoring rubric.
    const mustHave = new Set(job.mustHaveSkills.map((skill) => skill.toLowerCase()));
    const overlap = job.niceToHaveSkills.find((skill) => mustHave.has(skill.toLowerCase()));
    if (overlap) {
      ctx.addIssue({
        code: "custom",
        path: ["niceToHaveSkills"],
        message: `"${overlap}" is already a must-have skill.`,
      });
    }
  });

export type JobFormInput = z.output<typeof jobFormSchema>;

/** Maps validated form input to `jobs` table columns. Ownership columns are set by the caller. */
export function toJobColumns(input: JobFormInput) {
  return {
    title: input.title,
    description: input.description,
    must_have_skills: input.mustHaveSkills,
    nice_to_have_skills: input.niceToHaveSkills,
    min_years_experience: input.minYearsExperience,
    location: input.location,
    work_mode: input.workMode,
    status: input.status,
  };
}
