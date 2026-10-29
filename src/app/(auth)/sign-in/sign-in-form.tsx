"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { type AuthFormState, signIn } from "@/lib/auth/actions";

const URL_ERRORS: Record<string, string> = {
  confirmation: "That confirmation link is invalid or has expired. Sign in, or sign up again for a new link.",
};

export function SignInForm() {
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState<AuthFormState, FormData>(signIn, {});
  const urlError = URL_ERRORS[searchParams.get("error") ?? ""];
  const error = state.error ?? urlError;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
