export function StatusBadge({ status }: { status: "open" | "closed" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "open"
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${status === "open" ? "bg-emerald-500" : "bg-zinc-400"}`} />
      {status === "open" ? "Open" : "Closed"}
    </span>
  );
}

export function SkillChips({ skills, tone = "default" }: { skills: string[]; tone?: "default" | "muted" }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <li
          key={skill}
          className={`rounded-md px-2 py-0.5 text-sm ${
            tone === "default"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {skill}
        </li>
      ))}
    </ul>
  );
}
