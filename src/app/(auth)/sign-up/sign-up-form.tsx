"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { type AuthFormState, signUp } from "@/lib/auth/actions";

export function SignUpForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signUp, {});

  if (state.notice) {
    return (
      <div className="mt-6">
        <FormMessage tone="notice">{state.notice}</FormMessage>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <Field
        label="Full name"
        name="fullName"
        autoComplete="name"
        required
        defaultValue={state.values?.fullName}
        error={state.fieldErrors?.fullName}
      />
      <Field
        label="Work email"
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
        autoComplete="new-password"
        minLength={12}
        required
        hint="At least 12 characters."
        error={state.fieldErrors?.password}
      />
      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}
