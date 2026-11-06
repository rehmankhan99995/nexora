-- Add the directory and invitation pieces needed for real workspace roles.
alter table public.profiles
  add column if not exists email text;

update public.profiles as profiles
set email = users.email
from auth.users as users
where users.id = profiles.id
  and profiles.email is null;

create index if not exists profiles_email_idx
  on public.profiles (lower(email));

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'NEXORA member'
    ), 120),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from anon, authenticated;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
  );
$$;

drop policy if exists "Members can view workspace memberships" on public.workspace_members;
create policy "Members can view workspace memberships"
on public.workspace_members for select to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists "Owners and admins can update workspace members" on public.workspace_members;
create policy "Owners and admins can update workspace members"
on public.workspace_members for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner', 'admin']))
with check (
  role in ('admin', 'member')
  or (role = 'owner' and user_id = (select auth.uid()))
);

create policy "Workspace members can view member profiles"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.workspace_members as memberships
    where memberships.user_id = profiles.id
      and private.is_workspace_member(memberships.workspace_id)
  )
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null check (char_length(btrim(email)) between 3 and 320),
  role text not null default 'member'
    check (role in ('admin', 'member')),
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists workspace_invitations_workspace_idx
  on public.workspace_invitations (workspace_id, created_at desc);

create index if not exists workspace_invitations_email_idx
  on public.workspace_invitations (lower(email), expires_at);

alter table public.workspace_invitations enable row level security;
grant select, insert, delete on public.workspace_invitations to authenticated;

create policy "Workspace managers can create invitations"
on public.workspace_invitations for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and private.has_workspace_role(workspace_id, array['owner', 'admin'])
);

create policy "Workspace managers can view invitations"
on public.workspace_invitations for select to authenticated
using (private.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "Workspace managers can revoke invitations"
on public.workspace_invitations for delete to authenticated
using (private.has_workspace_role(workspace_id, array['owner', 'admin']));

create or replace function public.accept_workspace_invitation(invitation_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.workspace_invitations;
begin
  if auth.uid() is null or auth.email() is null then
    raise exception 'You must be signed in to accept an invitation';
  end if;

  select * into invitation
  from public.workspace_invitations
  where token = invitation_token
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'This invitation is invalid or has expired';
  end if;

  if lower(invitation.email) <> lower(auth.email()) then
    raise exception 'This invitation was sent to a different email address';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (invitation.workspace_id, (select auth.uid()), invitation.role)
  on conflict (workspace_id, user_id) do update
    set role = case
      when public.workspace_members.role = 'owner' then 'owner'
      else excluded.role
    end;

  update public.workspace_invitations
  set accepted_at = now(), accepted_by = (select auth.uid())
  where id = invitation.id;

  return invitation.workspace_id;
end;
$$;

revoke all on function public.accept_workspace_invitation(uuid) from public, anon;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;
