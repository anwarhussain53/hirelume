// Row-level security tests against a real Supabase stack (Postgres + Auth + Storage).
// Run with `npm run test:db`. CI points TEST_SUPABASE_* at `supabase start`.
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}; DB tests need a Supabase stack.`);
  return value;
}

const url = requireEnv("TEST_SUPABASE_URL");
const publishableKey = requireEnv("TEST_SUPABASE_PUBLISHABLE_KEY");
const secretKey = requireEnv("TEST_SUPABASE_SECRET_KEY");

// These tests create and delete orgs and users, so refuse anything but a local
// stack unless a remote test project is explicitly allowed.
const { hostname } = new URL(url);
if (!["127.0.0.1", "localhost"].includes(hostname) && process.env.TEST_ALLOW_REMOTE_DB !== "1") {
  throw new Error(
    `Refusing to run DB tests against ${hostname}. Use a local stack, or set ` +
      "TEST_ALLOW_REMOTE_DB=1 for a dedicated test project (never production).",
  );
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, secretKey, clientOptions);
const run = randomUUID().slice(0, 8);
const userIds: string[] = [];
const storagePaths: string[] = [];

async function must<T>(query: PromiseLike<{ data: T; error: unknown }>): Promise<NonNullable<T>> {
  const { data, error } = await query;
  if (error) throw error;
  if (data == null) throw new Error("Query returned no data");
  return data;
}

async function createOrg(label: string): Promise<string> {
  const org = await must(
    admin.from("organizations").insert({ name: `RLS ${label}`, slug: `rls-${run}-${label}` }).select("id").single(),
  );
  return org.id;
}

async function createRecruiter(organizationId: string, role: "admin" | "recruiter") {
  const email = `rls-${run}-${randomUUID().slice(0, 8)}@example.com`;
  const password = randomUUID();
  const { error: inviteError } = await admin
    .from("invitations")
    .insert({ organization_id: organizationId, email, role });
  if (inviteError) throw inviteError;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  userIds.push(data.user.id);

  const client = createClient(url, publishableKey, clientOptions);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { client, userId: data.user.id };
}

const pdf = () => new Blob(["%PDF-1.4\n%%EOF\n"], { type: "application/pdf" });

let orgA: string;
let orgB: string;
let recruiterA: { client: SupabaseClient; userId: string };
let adminB: { client: SupabaseClient; userId: string };
let jobB: string;

beforeAll(async () => {
  orgA = await createOrg("a");
  orgB = await createOrg("b");
  recruiterA = await createRecruiter(orgA, "recruiter");
  adminB = await createRecruiter(orgB, "admin");
  const job = await must(
    admin
      .from("jobs")
      .insert({ organization_id: orgB, title: "B job", description: "B only", must_have_skills: ["java"] })
      .select("id")
      .single(),
  );
  jobB = job.id;
});

afterAll(async () => {
  if (storagePaths.length) await admin.storage.from("resumes").remove(storagePaths);
  await admin.from("organizations").delete().in("id", [orgA, orgB].filter(Boolean));
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
});

describe("tenant isolation", () => {
  it("reads only the recruiter's own organization", async () => {
    const jobs = await must(recruiterA.client.from("jobs").select("id"));
    expect(jobs).toEqual([]);

    const orgs = await must(recruiterA.client.from("organizations").select("id"));
    expect(orgs.map((o) => o.id)).toEqual([orgA]);
  });

  it("cannot insert rows into another organization", async () => {
    const { error } = await recruiterA.client
      .from("jobs")
      .insert({ organization_id: orgB, title: "x", description: "x", must_have_skills: ["x"] });
    expect(error?.code).toBe("42501");
  });

  it("cannot update or delete another organization's rows", async () => {
    const updated = await must(recruiterA.client.from("jobs").update({ title: "pwned" }).eq("id", jobB).select());
    const deleted = await must(recruiterA.client.from("jobs").delete().eq("id", jobB).select());
    expect(updated).toEqual([]);
    expect(deleted).toEqual([]);

    const job = await must(admin.from("jobs").select("title").eq("id", jobB).single());
    expect(job.title).toBe("B job");
  });

  it("cannot link its own rows to another organization's job", async () => {
    const candidate = await must(
      recruiterA.client.from("candidates").insert({ organization_id: orgA }).select("id").single(),
    );
    const resume = await must(
      recruiterA.client
        .from("resumes")
        .insert({
          organization_id: orgA,
          candidate_id: candidate.id,
          storage_path: `${orgA}/${candidate.id}/${randomUUID()}.pdf`,
          file_name: "r.pdf",
          file_sha256: "a".repeat(64),
          file_size_bytes: 100,
        })
        .select("id")
        .single(),
    );

    const { error } = await recruiterA.client.from("matches").insert({
      organization_id: orgA,
      job_id: jobB,
      candidate_id: candidate.id,
      resume_id: resume.id,
    });
    expect(error?.code).toBe("23503");
  });

  it("gives signed-out visitors no table access", async () => {
    const anon = createClient(url, publishableKey, clientOptions);
    const { error } = await anon.from("jobs").select("id");
    expect(error?.code).toBe("42501");
  });
});

describe("roles", () => {
  it("prevents a recruiter from changing their own role", async () => {
    const { error } = await recruiterA.client.from("recruiters").update({ role: "admin" }).eq("id", recruiterA.userId);
    expect(error?.code).toBe("42501");
  });

  it("lets a recruiter change their own display name", async () => {
    const rows = await must(
      recruiterA.client.from("recruiters").update({ full_name: "Renamed" }).eq("id", recruiterA.userId).select(),
    );
    expect(rows).toHaveLength(1);
  });

  it("lets only admins create invitations", async () => {
    const asRecruiter = await recruiterA.client
      .from("invitations")
      .insert({ organization_id: orgA, email: `rls-${run}-x@example.com` });
    expect(asRecruiter.error?.code).toBe("42501");

    const asAdmin = await adminB.client
      .from("invitations")
      .insert({ organization_id: orgB, email: `rls-${run}-y@example.com` });
    expect(asAdmin.error).toBeNull();
  });
});

describe("invite-only sign-up", () => {
  it("rejects an Auth user without an invitation", async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email: `rls-${run}-uninvited@example.com`,
      password: randomUUID(),
      email_confirm: true,
    });
    if (data.user) userIds.push(data.user.id);
    expect(error).not.toBeNull();
  });
});

describe("resume storage", () => {
  it("scopes objects to the organization's folder", async () => {
    const ownPath = `${orgA}/${randomUUID()}/${randomUUID()}.pdf`;
    storagePaths.push(ownPath);
    const own = await recruiterA.client.storage.from("resumes").upload(ownPath, pdf());
    expect(own.error).toBeNull();

    const foreignPath = `${orgB}/${randomUUID()}/${randomUUID()}.pdf`;
    storagePaths.push(foreignPath);
    const foreign = await recruiterA.client.storage.from("resumes").upload(foreignPath, pdf());
    expect(foreign.error).not.toBeNull();

    const download = await adminB.client.storage.from("resumes").download(ownPath);
    expect(download.error).not.toBeNull();

    const signed = await adminB.client.storage.from("resumes").createSignedUrl(ownPath, 60);
    expect(signed.error).not.toBeNull();
  });
});
