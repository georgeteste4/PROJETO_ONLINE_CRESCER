-- Crescer+ / Supabase — configuração e aceite seguro de convites

insert into public.app_settings (key, value_json)
values
  ('invites.expiration_days', to_jsonb(7)),
  ('invites.delivery_mode', to_jsonb('manual'::text))
on conflict (key) do nothing;

create or replace function private.is_super_admin()
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
      and role = 'super_admin'
      and banned = false
  );
$$;

revoke all on function private.is_super_admin() from public, anon, authenticated;

drop policy if exists "invites_manage_staff" on public.invites;
drop policy if exists "invites_manage_super_admin" on public.invites;
create policy "invites_manage_super_admin" on public.invites
for all to authenticated
using ((select private.is_super_admin()))
with check ((select private.is_super_admin()));

create or replace function private.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id
     and (new.role is distinct from old.role or new.banned is distinct from old.banned)
     and coalesce(current_setting('crescer.allow_invite_role_change', true), '') <> 'on' then
    raise exception 'O próprio usuário não pode alterar role ou banimento';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_self_role_change() from public, anon, authenticated;

create or replace function public.accept_invite(p_token text)
returns table (invite_id uuid, invited_email text, assigned_role text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite public.invites%rowtype;
  v_auth_email text;
  v_user_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado para aceitar este convite';
  end if;

  select email into v_auth_email
  from auth.users
  where id = auth.uid();

  select * into v_invite
  from public.invites
  where token = p_token
    and used = false
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Convite inválido, expirado ou já utilizado';
  end if;

  if lower(trim(coalesce(v_auth_email, ''))) <> lower(trim(v_invite.email)) then
    raise exception 'Este convite foi emitido para outro e-mail';
  end if;

  select exists(select 1 from public.users where id = auth.uid()) into v_user_exists;
  if not v_user_exists then
    raise exception 'Perfil do usuário ainda não foi criado';
  end if;

  perform set_config('crescer.allow_invite_role_change', 'on', true);
  update public.users
  set role = v_invite.role
  where id = auth.uid();

  update public.invites
  set used = true,
      used_at = now(),
      used_by = auth.uid()
  where id = v_invite.id;

  return query select v_invite.id, v_invite.email, v_invite.role;
end;
$$;

revoke all on function public.accept_invite(text) from public, anon;
grant execute on function public.accept_invite(text) to authenticated;

comment on function public.accept_invite(text) is 'Aceita um convite para o e-mail autenticado, promove o perfil ao papel convidado e marca o token como usado em uma única transação.';
