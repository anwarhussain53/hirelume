import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password." }),
  next: z.string().optional(),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { error: "Enter your name." })
    .max(200, { error: "Use at most 200 characters." }),
  email,
  // 72 is bcrypt's input limit; anything longer is silently truncated by Supabase Auth.
  password: z
    .string()
    .min(12, { error: "Use at least 12 characters." })
    .max(72, { error: "Use at most 72 characters." }),
});
