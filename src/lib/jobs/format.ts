import type { WORK_MODES } from "./schema";

export const WORK_MODE_LABELS: Record<(typeof WORK_MODES)[number], string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export function formatMinYears(years: number): string {
  if (years <= 0) return "No minimum";
  return `${years}+ ${years === 1 ? "year" : "years"}`;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}
