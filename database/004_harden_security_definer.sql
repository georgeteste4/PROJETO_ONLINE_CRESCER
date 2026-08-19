-- Crescer+ / Supabase — endurecimento de funções internas

create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, accept_terms)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'Família'),
    coalesce((new.raw_user_meta_data ->> 'accept_terms')::boolean, false)
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    accept_terms = excluded.accept_terms,
    updated_at = now();

  if coalesce((new.raw_user_meta_data ->> 'accept_terms')::boolean, false) then
    insert into public.user_consents (user_id, consent_type, version)
    values (new.id, 'terms_of_use', '1.0')
    on conflict (user_id, consent_type, version) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('super_admin', 'editor', 'moderador')
      and banned = false
  );
$$;

create or replace function private.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and (new.role is distinct from old.role or new.banned is distinct from old.banned) then
    raise exception 'O próprio usuário não pode alterar role ou banimento';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_self_role_change on public.users;
create trigger prevent_self_role_change
before update on public.users
for each row execute procedure private.prevent_self_role_change();

-- As políticas são recriadas para apontar para a função privada.
drop policy if exists "stages_manage_staff" on public.age_stages;
drop policy if exists "categories_manage_staff" on public.categories;
drop policy if exists "activities_manage_staff" on public.activities;
drop policy if exists "pinned_manage_staff" on public.pinned_suggestions;
drop policy if exists "invites_manage_staff" on public.invites;
drop policy if exists "imports_manage_staff" on public.activity_imports;
drop policy if exists "users_select_staff" on public.users;
drop policy if exists "users_update_staff" on public.users;
drop policy if exists "users_delete_staff" on public.users;

create policy "stages_manage_staff" on public.age_stages for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "categories_manage_staff" on public.categories for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "activities_manage_staff" on public.activities for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "pinned_manage_staff" on public.pinned_suggestions for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "invites_manage_staff" on public.invites for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "imports_manage_staff" on public.activity_imports for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "users_select_staff" on public.users for select to authenticated using ((select private.is_staff()));
create policy "users_update_staff" on public.users for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "users_delete_staff" on public.users for delete to authenticated using ((select private.is_staff()) and id <> (select auth.uid()));

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.is_staff() from public, anon, authenticated;
revoke all on function private.prevent_self_role_change() from public, anon, authenticated;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

drop function if exists public.handle_new_user();
drop function if exists public.is_staff();
drop function if exists public.prevent_self_role_change();
