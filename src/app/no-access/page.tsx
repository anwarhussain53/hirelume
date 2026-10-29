import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "No access · Hirelume" };

// Reached when a valid login has no recruiter row, e.g. the account was removed from its org.
export default function NoAccessPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <Logo />
      <div className="max-w-sm">
        <h1 className="text-xl font-semibold">Your account isn&apos;t linked to an organization</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Ask your Hirelume admin to invite you again, then sign in with the invited email.
        </p>
      </div>
      <form action={signOut}>
        <button type="submit" className="text-sm font-medium underline underline-offset-4">
          Sign out
        </button>
      </form>
    </main>
  );
}
