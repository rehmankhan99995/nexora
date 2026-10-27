-- Separate organization membership from personal profiles.
alter table public.workspaces
  drop constraint if exists workspaces_one_per_owner;

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  constraint workspace_members_unique_user unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id, workspace_id);

create index if not exists workspace_members_workspace_idx
  on public.workspace_members (workspace_id, role);

alter table public.workspace_members enable row level security;

create schema if not exists private;

create or replace function private.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles text[]
)
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
      and role = any(allowed_roles)
  );
$$;

revoke all on function private.has_workspace_role(uuid, text[]) from public;
grant execute on function private.has_workspace_role(uuid, text[]) to authenticated;

create or replace function private.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

drop trigger if exists on_workspace_created_add_owner on public.workspaces;
create trigger on_workspace_created_add_owner
  after insert on public.workspaces
  for each row execute procedure private.add_workspace_owner();

insert into public.workspace_members (workspace_id, user_id, role)
select id, owner_id, 'owner'
from public.workspaces
on conflict (workspace_id, user_id) do update set role = 'owner';

grant select, insert, update, delete on public.workspace_members to authenticated;

drop policy if exists "Users can view their own workspace" on public.workspaces;
drop policy if exists "Users can create their own workspace" on public.workspaces;
drop policy if exists "Users can update their own workspace" on public.workspaces;
drop policy if exists "Users can delete their own workspace" on public.workspaces;

create policy "Members can view their workspaces"
on public.workspaces for select to authenticated
using (exists (
  select 1 from public.workspace_members
  where workspace_id = workspaces.id and user_id = (select auth.uid())
));

create policy "Authenticated users can create workspaces"
on public.workspaces for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Workspace owners and admins can update workspaces"
on public.workspaces for update to authenticated
using (private.has_workspace_role(id, array['owner', 'admin']))
with check (private.has_workspace_role(id, array['owner', 'admin']));

create policy "Workspace owners can delete workspaces"
on public.workspaces for delete to authenticated
using (private.has_workspace_role(id, array['owner']));

create policy "Members can view workspace memberships"
on public.workspace_members for select to authenticated
using (
  user_id = (select auth.uid())
  or private.has_workspace_role(workspace_id, array['owner', 'admin'])
);

create policy "Owners and admins can add workspace members"
on public.workspace_members for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['owner', 'admin'])
  and role in ('admin', 'member')
);

create policy "Owners and admins can update workspace members"
on public.workspace_members for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner', 'admin']))
with check (role in ('owner', 'admin', 'member'));

create policy "Owners and admins can remove workspace members"
on public.workspace_members for delete to authenticated
using (
  private.has_workspace_role(workspace_id, array['owner', 'admin'])
  and role <> 'owner'
);

-- Existing logo paths are user/workspace/logo.ext. Membership now controls access.
drop policy if exists "Workspace logos: owners can upload" on storage.objects;
drop policy if exists "Workspace logos: owners can view" on storage.objects;
drop policy if exists "Workspace logos: owners can replace" on storage.objects;
drop policy if exists "Workspace logos: owners can delete" on storage.objects;

create policy "Workspace logos: members can view"
on storage.objects for select to authenticated
using (
  bucket_id = 'workspace-logos'
  and (storage.foldername(name))[2] is not null
  and private.has_workspace_role(((storage.foldername(name))[2])::uuid, array['owner', 'admin', 'member'])
);

create policy "Workspace logos: owners and admins can upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'workspace-logos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] is not null
  and (storage.foldername(name))[3] is null
  and storage.filename(name) ~ '^logo-[0-9a-f-]+\.(png|jpg|jpeg|webp)$'
  and private.has_workspace_role(((storage.foldername(name))[2])::uuid, array['owner', 'admin'])
);

create policy "Workspace logos: owners and admins can replace"
on storage.objects for update to authenticated
using (
  bucket_id = 'workspace-logos'
  and private.has_workspace_role(((storage.foldername(name))[2])::uuid, array['owner', 'admin'])
)
with check (
  bucket_id = 'workspace-logos'
  and private.has_workspace_role(((storage.foldername(name))[2])::uuid, array['owner', 'admin'])
  and storage.filename(name) ~ '^logo-[0-9a-f-]+\.(png|jpg|jpeg|webp)$'
);

create policy "Workspace logos: owners and admins can delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'workspace-logos'
  and private.has_workspace_role(((storage.foldername(name))[2])::uuid, array['owner', 'admin'])
);
