-- Extensions, enum types and shared trigger functions.

create extension if not exists vector with schema extensions;

create type public.recruiter_role as enum ('admin', 'recruiter');
create type public.work_mode as enum ('onsite', 'hybrid', 'remote');
create type public.job_status as enum ('open', 'closed');
create type public.resume_status as enum ('uploaded', 'extracting', 'parsing', 'embedding', 'ready', 'failed');
create type public.pipeline_stage as enum ('new', 'screened', 'interview', 'offer', 'rejected');
create type public.score_status as enum ('pending', 'scored', 'failed');
create type public.fit_label as enum ('strong', 'maybe', 'no_fit');
create type public.eval_run_status as enum ('running', 'completed', 'failed');
create type public.llm_purpose as enum ('parse', 'embed_resume', 'embed_query', 'score', 'outreach', 'eval');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.set_stage_changed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;
