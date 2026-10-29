// Creates the Techvist organization and its first admin recruiter. Safe to re-run.
// Usage: npm run db:seed   (reads .env.local)
//
// The admin is created the same way every recruiter is: an invitation row, then
// an Auth user, which the on_auth_user_created trigger turns into a recruiter.
import { createClient } from "@supabase/supabase-js";

const ORG = { name: "Techvist", slug: "techvist" };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. See .env.example.`);
  return value;
}

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = requireEnv("SUPABASE_SECRET_KEY");
const email = requireEnv("SEED_ADMIN_EMAIL").trim().toLowerCase();
const password = requireEnv("SEED_ADMIN_PASSWORD");
const fullName = process.env.SEED_ADMIN_NAME ?? "";

if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: org, error: orgError } = await admin
  .from("organizations")
  .upsert(ORG, { onConflict: "slug" })
  .select("id")
  .single();
if (orgError) throw orgError;
console.log(`Organization "${ORG.name}" ready.`);

const { data: existing, error: lookupError } = await admin
  .from("recruiters")
  .select("id")
  .eq("email", email)
  .maybeSingle();
if (lookupError) throw lookupError;

if (existing) {
  console.log(`Recruiter ${email} already exists; nothing to do.`);
} else {
  // Replace any stale pending invite so the trigger picks up the right org.
  const { error: deleteError } = await admin
    .from("invitations")
    .delete()
    .eq("email", email)
    .is("accepted_at", null);
  if (deleteError) throw deleteError;

  const { error: inviteError } = await admin
    .from("invitations")
    .insert({ organization_id: org.id, email, role: "admin" });
  if (inviteError) throw inviteError;

  const { error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (userError) throw new Error(`Could not create ${email}: ${userError.message}`);
  console.log(`Admin recruiter ${email} created.`);
}
