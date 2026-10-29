import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { signOut } from "@/lib/auth/actions";
import { getCurrentRecruiter } from "@/lib/auth/current-recruiter";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <Logo href="/jobs" />
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/jobs" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Jobs
            </Link>
          </nav>
          {/* The session is request data, so it streams in without holding up the shell. */}
          <Suspense fallback={<div className="ml-auto h-8 w-40 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />}>
            <AccountMenu />
          </Suspense>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}

async function AccountMenu() {
  const recruiter = await getCurrentRecruiter();
  return (
    <div className="ml-auto flex items-center gap-3 text-sm">
      <div className="hidden text-right leading-tight sm:block">
        <div className="font-medium">{recruiter.fullName || recruiter.email}</div>
        <div className="text-xs text-zinc-500">{recruiter.organization.name}</div>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
