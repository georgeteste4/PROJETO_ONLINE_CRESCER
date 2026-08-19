-- Corrige inserts administrativos de catálogo sem ID e separa escrita de conteúdo de leitura administrativa.

create or replace function private.is_content_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role in ('super_admin', 'editor')
      and banned = false
  );
$$;

revoke all on function private.is_content_staff() from public, anon, authenticated;
grant execute on function private.is_content_staff() to authenticated;

alter table public.categories
  alter column id set default ('category_' || replace(gen_random_uuid()::text, '-', ''));

alter table public.age_stages
  alter column id set default ('stage_' || replace(gen_random_uuid()::text, '-', ''));

alter table public.activities
  alter column id set default ('activity_' || replace(gen_random_uuid()::text, '-', ''));

drop policy if exists categories_manage_staff on public.categories;
drop policy if exists stages_manage_staff on public.age_stages;
drop policy if exists activities_manage_staff on public.activities;
drop policy if exists pinned_manage_staff on public.pinned_suggestions;
drop policy if exists imports_manage_staff on public.activity_imports;

create policy categories_manage_content_staff on public.categories
  for all to authenticated
  using ((select private.is_content_staff()))
  with check ((select private.is_content_staff()));

create policy stages_manage_content_staff on public.age_stages
  for all to authenticated
  using ((select private.is_content_staff()))
  with check ((select private.is_content_staff()));

create policy activities_manage_content_staff on public.activities
  for all to authenticated
  using ((select private.is_content_staff()))
  with check ((select private.is_content_staff()));

create policy pinned_manage_content_staff on public.pinned_suggestions
  for all to authenticated
  using ((select private.is_content_staff()))
  with check ((select private.is_content_staff()));

create policy imports_manage_content_staff on public.activity_imports
  for all to authenticated
  using ((select private.is_content_staff()))
  with check ((select private.is_content_staff()));
