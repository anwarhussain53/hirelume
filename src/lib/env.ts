import { z } from "zod";

// Public vars are inlined into the client bundle at build time, so each one
// must be referenced as a literal `process.env.NEXT_PUBLIC_*` expression.
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const result = publicEnvSchema.safeParse(source);
  if (!result.success) {
    // Report variable names only; values may be secrets.
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${missing}. See .env.example.`);
  }
  return result.data;
}

let cached: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  cached ??= parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return cached;
}
