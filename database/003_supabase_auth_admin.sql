-- Crescer+ / Supabase — auth, conta e administração

create or replace function public.prevent_self_role_change()
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
for each row execute procedure public.prevent_self_role_change();

drop policy if exists "users_select_staff" on public.users;
drop policy if exists "users_update_staff" on public.users;
drop policy if exists "users_delete_staff" on public.users;

create policy "users_select_staff" on public.users
for select to authenticated
using ((select public.is_staff()));

create policy "users_update_staff" on public.users
for update to authenticated
using ((select public.is_staff()))
with check ((select public.is_staff()));

create policy "users_delete_staff" on public.users
for delete to authenticated
using ((select public.is_staff()) and id <> (select auth.uid()));

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
