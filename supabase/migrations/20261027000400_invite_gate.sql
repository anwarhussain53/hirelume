-- Invite-only sign-up: a new auth user becomes a recruiter in the organization
-- that invited their email. Without a valid pending invitation, sign-up fails.

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.invitations;
begin
  select * into invite
  from public.invitations
  where email = lower(new.email)
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'sign-up requires a valid invitation' using errcode = 'P0001';
  end if;

  insert into public.recruiters (id, organization_id, email, full_name, role)
  values (
    new.id,
    invite.organization_id,
    lower(new.email),
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 200), ''),
    invite.role
  );

  update public.invitations set accepted_at = now() where id = invite.id;

  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
