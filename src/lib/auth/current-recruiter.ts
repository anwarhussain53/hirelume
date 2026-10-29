import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { NO_ACCESS_PATH, SIGN_IN_PATH } from "@/lib/auth/paths";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type CurrentRecruiter = {
  id: string;
  email: string;
  fullName: string;
  role: Database["public"]["Enums"]["recruiter_role"];
  organization: { id: string; name: string };
};

/**
 * Data access layer entry point: the verified, signed-in recruiter and their org.
 * Redirects instead of returning null, so callers can't forget the check.
 * Memoized per request; never wrap in "use cache" (results are per user).
 */
export const getCurrentRecruiter = cache(async (): Promise<CurrentRecruiter> => {
  // Identity is always resolved at request time, never prerendered or prefetched
  // (token expiry checks also read the clock, which prerendering forbids).
  await connection();
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (claimsError || !userId) redirect(SIGN_IN_PATH);

  // RLS limits this to the caller's own row and organization.
  const { data: recruiter, error } = await supabase
    .from("recruiters")
    .select("id, email, full_name, role, organization:organizations(id, name)")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load recruiter (${error.code})`);
  if (!recruiter?.organization) redirect(NO_ACCESS_PATH);

  return {
    id: recruiter.id,
    email: recruiter.email,
    fullName: recruiter.full_name,
    role: recruiter.role,
    organization: recruiter.organization,
  };
});
