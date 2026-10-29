import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Hirelume" };

export default function SignInPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Welcome back. Pick up where you left off.</p>
      {/* The form reads ?next and ?error from the URL, which is request data. */}
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Invited to Hirelume?{" "}
        <Link href="/sign-up" className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
          Create your account
        </Link>
      </p>
    </>
  );
}
