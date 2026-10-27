insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-logos',
  'workspace-logos',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Workspace logos: owners can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'workspace-logos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] is not null
  and (storage.foldername(name))[3] is null
  and storage.filename(name) ~ '^logo-[0-9a-f-]+\.(png|jpg|jpeg|webp)$'
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
  and exists (
    select 1
    from public.workspaces as workspaces
    where workspaces.id::text = (storage.foldername(name))[2]
      and workspaces.owner_id = (select auth.uid())
  )
);

create policy "Workspace logos: owners can view"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'workspace-logos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] is not null
  and (storage.foldername(name))[3] is null
  and exists (
    select 1
    from public.workspaces as workspaces
    where workspaces.id::text = (storage.foldername(name))[2]
      and workspaces.owner_id = (select auth.uid())
  )
);

create policy "Workspace logos: owners can replace"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'workspace-logos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] is not null
  and (storage.foldername(name))[3] is null
  and exists (
    select 1
    from public.workspaces as workspaces
    where workspaces.id::text = (storage.foldername(name))[2]
      and workspaces.owner_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'workspace-logos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] is not null
  and (storage.foldername(name))[3] is null
  and storage.filename(name) ~ '^logo-[0-9a-f-]+\.(png|jpg|jpeg|webp)$'
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
  and exists (
    select 1
    from public.workspaces as workspaces
    where workspaces.id::text = (storage.foldername(name))[2]
      and workspaces.owner_id = (select auth.uid())
  )
);

create policy "Workspace logos: owners can delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'workspace-logos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] is not null
  and (storage.foldername(name))[3] is null
  and exists (
    select 1
    from public.workspaces as workspaces
    where workspaces.id::text = (storage.foldername(name))[2]
      and workspaces.owner_id = (select auth.uid())
  )
);
