create table public.workspaces (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null
    references auth.users(id)
    on delete cascade,

  business_name text not null
    check (char_length(btrim(business_name)) between 2 and 120),

  industry text not null
    check (char_length(btrim(industry)) between 2 and 80),

  logo_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint workspaces_one_per_owner unique (owner_id)
);

alter table public.workspaces enable row level security;

grant select, insert, update, delete
on public.workspaces
to authenticated;

create policy "Users can view their own workspace"
on public.workspaces
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Users can create their own workspace"
on public.workspaces
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Users can update their own workspace"
on public.workspaces
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own workspace"
on public.workspaces
for delete
to authenticated
using ((select auth.uid()) = owner_id);