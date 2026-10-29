import Link from "next/link";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <Logo />
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Rank resumes with reasons you can check.
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Hirelume scores candidates against a job, quotes the resume evidence behind every score, flags missing
        skills, and moves people through your hiring pipeline.
      </p>
      <div>
        <Link
          href="/sign-in"
          className="inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
