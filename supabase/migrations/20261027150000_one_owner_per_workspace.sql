-- A workspace has exactly one owner. Admins and members are additional roles.
create unique index if not exists workspace_members_one_owner_idx
  on public.workspace_members (workspace_id)
  where role = 'owner';
