-- Row-level security: a recruiter can only see and change rows in their own organization.

-- SECURITY DEFINER so policies on recruiters can call it without recursing into themselves.
create function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id from public.recruiters where id = (select auth.uid());
$$;

create function public.is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.recruiters where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.current_org_id() from public, anon;
revoke execute on function public.is_org_admin() from public, anon;
grant execute on function public.current_org_id() to authenticated;
grant execute on function public.is_org_admin() to authenticated;

-- Nothing is readable without signing in.
revoke all on all tables in schema public from anon;

alter table public.organizations enable row level security;
alter table public.recruiters enable row level security;
alter table public.invitations enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_chunks enable row level security;
alter table public.matches enable row level security;
alter table public.outreach_emails enable row level security;
alter table public.eval_pairs enable row level security;
alter table public.eval_runs enable row level security;
alter table public.llm_usage enable row level security;

create policy organizations_select on public.organizations
  for select to authenticated
  using (id = (select public.current_org_id()));

-- Recruiter rows are created only by the sign-up trigger, and a recruiter may
-- change only their own display name: role and organization are not updatable.
create policy recruiters_select on public.recruiters
  for select to authenticated
  using (organization_id = (select public.current_org_id()));
create policy recruiters_update_self on public.recruiters
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke insert, update, delete on public.recruiters from authenticated;
grant update (full_name) on public.recruiters to authenticated;

create policy invitations_select on public.invitations
  for select to authenticated
  using (organization_id = (select public.current_org_id()));
create policy invitations_insert_admin on public.invitations
  for insert to authenticated
  with check (organization_id = (select public.current_org_id()) and (select public.is_org_admin()));
create policy invitations_delete_admin on public.invitations
  for delete to authenticated
  using (organization_id = (select public.current_org_id()) and (select public.is_org_admin()));
revoke update on public.invitations from authenticated;

-- Identical full-access policies for the org-scoped working tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'jobs', 'candidates', 'resumes', 'resume_chunks', 'matches',
    'outreach_emails', 'eval_pairs', 'eval_runs'
  ] loop
    execute format(
      'create policy %1$s_select on public.%1$I for select to authenticated
         using (organization_id = (select public.current_org_id()))', t);
    execute format(
      'create policy %1$s_insert on public.%1$I for insert to authenticated
         with check (organization_id = (select public.current_org_id()))', t);
    execute format(
      'create policy %1$s_update on public.%1$I for update to authenticated
         using (organization_id = (select public.current_org_id()))
         with check (organization_id = (select public.current_org_id()))', t);
    execute format(
      'create policy %1$s_delete on public.%1$I for delete to authenticated
         using (organization_id = (select public.current_org_id()))', t);
  end loop;
end;
$$;

-- llm_usage is an append-only audit log.
create policy llm_usage_select on public.llm_usage
  for select to authenticated
  using (organization_id = (select public.current_org_id()));
create policy llm_usage_insert on public.llm_usage
  for insert to authenticated
  with check (organization_id = (select public.current_org_id()));
revoke update, delete on public.llm_usage from authenticated;

-- Private bucket for resume PDFs. Object paths are {organization_id}/{candidate_id}/{resume_id}.pdf.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy resumes_bucket_select on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select public.current_org_id())::text);
create policy resumes_bucket_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select public.current_org_id())::text);
create policy resumes_bucket_update on storage.objects
  for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select public.current_org_id())::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select public.current_org_id())::text);
create policy resumes_bucket_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select public.current_org_id())::text);
