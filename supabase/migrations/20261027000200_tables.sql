-- Core tables. Every org-owned table carries organization_id, and every link
-- between org-owned rows is a composite FK on (id, organization_id) so a row
-- can never point at another organization's data, even if RLS were bypassed.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiters (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 200),
  email text not null check (email = lower(email)),
  role public.recruiter_role not null default 'recruiter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);
create index recruiters_organization_id_idx on public.recruiters (organization_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email = lower(email) and position('@' in email) > 1),
  role public.recruiter_role not null default 'recruiter',
  invited_by uuid,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (invited_by, organization_id)
    references public.recruiters (id, organization_id) on delete set null (invited_by)
);
-- A person belongs to one organization, so only one open invite per email.
create unique index invitations_pending_email_idx on public.invitations (email) where accepted_at is null;
create index invitations_organization_id_idx on public.invitations (organization_id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid,
  title text not null check (char_length(title) between 1 and 200),
  description text not null check (char_length(description) between 1 and 20000),
  must_have_skills text[] not null check (cardinality(must_have_skills) between 1 and 30),
  nice_to_have_skills text[] not null default '{}' check (cardinality(nice_to_have_skills) <= 30),
  min_years_experience numeric(4, 1) not null default 0 check (min_years_experience between 0 and 60),
  location text check (char_length(location) <= 200),
  work_mode public.work_mode not null default 'onsite',
  status public.job_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (created_by, organization_id)
    references public.recruiters (id, organization_id) on delete set null (created_by)
);
create index jobs_organization_id_created_at_idx on public.jobs (organization_id, created_at desc);

-- Contact details live here and are never sent to the scoring step.
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text check (char_length(full_name) <= 200),
  email text check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 50),
  location text check (char_length(location) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);
create index candidates_organization_id_idx on public.candidates (organization_id);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  candidate_id uuid not null,
  storage_path text not null unique check (split_part(storage_path, '/', 1) = organization_id::text),
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_sha256 text not null check (file_sha256 ~ '^[0-9a-f]{64}$'),
  file_size_bytes integer not null check (file_size_bytes between 1 and 10485760),
  page_count integer check (page_count > 0),
  raw_text text,
  redacted_text text,
  parsed jsonb,
  total_years_experience numeric(4, 1) check (total_years_experience between 0 and 70),
  skills text[] not null default '{}',
  status public.resume_status not null default 'uploaded',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  -- The same PDF uploaded twice is parsed and embedded once.
  unique (organization_id, file_sha256),
  foreign key (candidate_id, organization_id)
    references public.candidates (id, organization_id) on delete cascade
);
create index resumes_candidate_id_idx on public.resumes (candidate_id);

-- Embedding dimension must match EMBEDDING_DIMENSIONS in src/lib/ai/config.ts.
create table public.resume_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  resume_id uuid not null,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  token_count integer not null check (token_count >= 0),
  embedding extensions.vector(1024) not null,
  created_at timestamptz not null default now(),
  unique (resume_id, chunk_index),
  foreign key (resume_id, organization_id)
    references public.resumes (id, organization_id) on delete cascade
);
create index resume_chunks_embedding_idx on public.resume_chunks
  using hnsw (embedding extensions.vector_cosine_ops);
create index resume_chunks_organization_id_idx on public.resume_chunks (organization_id);

-- One row per (job, candidate): the cached score plus the pipeline stage.
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid not null,
  candidate_id uuid not null,
  resume_id uuid not null,
  stage public.pipeline_stage not null default 'new',
  stage_changed_at timestamptz not null default now(),
  score_status public.score_status not null default 'pending',
  score smallint check (score between 0 and 100),
  subscores jsonb,
  reasons jsonb,
  gaps jsonb,
  model text,
  prompt_version text,
  input_hash text,
  error text,
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id),
  unique (id, organization_id),
  check ((score_status = 'scored') = (score is not null)),
  foreign key (job_id, organization_id)
    references public.jobs (id, organization_id) on delete cascade,
  foreign key (candidate_id, organization_id)
    references public.candidates (id, organization_id) on delete cascade,
  foreign key (resume_id, organization_id)
    references public.resumes (id, organization_id) on delete cascade
);
create index matches_job_score_idx on public.matches (organization_id, job_id, score desc nulls last);
create index matches_candidate_id_idx on public.matches (candidate_id);
create index matches_resume_id_idx on public.matches (resume_id);

create table public.outreach_emails (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  match_id uuid not null,
  created_by uuid,
  subject text not null check (char_length(subject) between 1 and 300),
  body text not null check (char_length(body) between 1 and 10000),
  model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (match_id, organization_id)
    references public.matches (id, organization_id) on delete cascade,
  foreign key (created_by, organization_id)
    references public.recruiters (id, organization_id) on delete set null (created_by)
);
create index outreach_emails_match_id_idx on public.outreach_emails (match_id);

-- NO ACTION, not cascade: deleting a candidate in the eval set fails, but deleting
-- the whole organization still works because the pair goes in the same statement.
create table public.eval_pairs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid not null,
  resume_id uuid not null,
  label public.fit_label not null,
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, resume_id),
  foreign key (job_id, organization_id)
    references public.jobs (id, organization_id) on delete no action,
  foreign key (resume_id, organization_id)
    references public.resumes (id, organization_id) on delete no action
);
create index eval_pairs_organization_id_idx on public.eval_pairs (organization_id);
create index eval_pairs_resume_id_idx on public.eval_pairs (resume_id);

create table public.eval_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  started_by uuid,
  status public.eval_run_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  model text not null,
  prompt_version text not null,
  pair_count integer not null default 0 check (pair_count >= 0),
  agreement_rate numeric(5, 4) check (agreement_rate between 0 and 1),
  confusion jsonb,
  avg_cost_usd numeric(10, 6) check (avg_cost_usd >= 0),
  avg_latency_ms integer check (avg_latency_ms >= 0),
  results jsonb,
  error text,
  unique (id, organization_id),
  foreign key (started_by, organization_id)
    references public.recruiters (id, organization_id) on delete set null (started_by)
);
create index eval_runs_organization_id_started_at_idx on public.eval_runs (organization_id, started_at desc);

-- Metadata only: never prompt or response text.
create table public.llm_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  recruiter_id uuid,
  purpose public.llm_purpose not null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd numeric(10, 6) not null default 0 check (cost_usd >= 0),
  latency_ms integer not null check (latency_ms >= 0),
  success boolean not null,
  error_code text check (char_length(error_code) <= 100),
  job_id uuid,
  resume_id uuid,
  match_id uuid,
  eval_run_id uuid,
  created_at timestamptz not null default now(),
  foreign key (recruiter_id, organization_id)
    references public.recruiters (id, organization_id) on delete set null (recruiter_id),
  foreign key (job_id, organization_id)
    references public.jobs (id, organization_id) on delete set null (job_id),
  foreign key (resume_id, organization_id)
    references public.resumes (id, organization_id) on delete set null (resume_id),
  foreign key (match_id, organization_id)
    references public.matches (id, organization_id) on delete set null (match_id),
  foreign key (eval_run_id, organization_id)
    references public.eval_runs (id, organization_id) on delete set null (eval_run_id)
);
create index llm_usage_organization_id_created_at_idx on public.llm_usage (organization_id, created_at desc);
create index llm_usage_eval_run_id_idx on public.llm_usage (eval_run_id);
-- FK indexes so SET NULL on delete doesn't scan the table.
create index llm_usage_job_id_idx on public.llm_usage (job_id);
create index llm_usage_resume_id_idx on public.llm_usage (resume_id);
create index llm_usage_match_id_idx on public.llm_usage (match_id);

create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger recruiters_set_updated_at before update on public.recruiters
  for each row execute function public.set_updated_at();
create trigger jobs_set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger candidates_set_updated_at before update on public.candidates
  for each row execute function public.set_updated_at();
create trigger resumes_set_updated_at before update on public.resumes
  for each row execute function public.set_updated_at();
create trigger matches_set_updated_at before update on public.matches
  for each row execute function public.set_updated_at();
create trigger matches_set_stage_changed_at before update on public.matches
  for each row execute function public.set_stage_changed_at();
create trigger outreach_emails_set_updated_at before update on public.outreach_emails
  for each row execute function public.set_updated_at();
create trigger eval_pairs_set_updated_at before update on public.eval_pairs
  for each row execute function public.set_updated_at();
