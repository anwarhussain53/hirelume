"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SAFE_SIGN_UP_ERRORS, authErrorMessage } from "@/lib/auth/errors";
import { SIGN_IN_PATH, safeRedirectPath } from "@/lib/auth/paths";
import { signInSchema, signUpSchema } from "@/lib/auth/schemas";
import { type FieldErrors, firstFieldErrors } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  notice?: string;
  fieldErrors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed (never the password). */
  values?: { email?: string; fullName?: string };
};

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error), values: { email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: authErrorMessage(error.code), values: { email } };

  redirect(safeRedirectPath(parsed.data.next));
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  const values = { email: String(formData.get("email") ?? ""), fullName: String(formData.get("fullName") ?? "") };
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error), values };

  // Supabase only follows this link if it matches the project's Redirect URLs allowlist.
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      ...(origin && { emailRedirectTo: `${origin}/auth/confirm` }),
    },
  });

  // The invite gate rejects uninvited emails inside the database. Answering the same way
  // for invited and uninvited emails stops anyone from probing who has an invitation.
  if (error && SAFE_SIGN_UP_ERRORS.has(error.code ?? "")) {
    return { error: authErrorMessage(error.code), values };
  }
  return {
    notice: "If this email has an invitation, we've sent a confirmation link. Check your inbox.",
    values,
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(SIGN_IN_PATH);
}
