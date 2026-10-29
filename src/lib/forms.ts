import type { z } from "zod";

export type FieldErrors = Partial<Record<string, string>>;

/** First message per field, ready to show next to each input. */
export function firstFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !result[field]) result[field] = issue.message;
  }
  return result;
}
