-- Crescer+ / Supabase — reduzir dados pessoais nos detalhes de auditoria

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_email text;
  v_actor_name text;
  v_row jsonb;
  v_resource_id text;
begin
  select email, name into v_actor_email, v_actor_name from public.users where id = v_actor;
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;
  v_row := v_row - 'token' - 'password' - 'senha_hash' - 'foto_url' - 'dob' - 'email';
  v_resource_id := coalesce(v_row ->> 'id', v_row ->> 'key', v_row ->> 'prompt_key');

  insert into public.audit_logs (action, resource, resource_id, actor_user_id, actor_email, actor_name, details)
  values (
    tg_op,
    tg_table_name,
    v_resource_id,
    v_actor,
    coalesce(v_actor_email, 'sistema'),
    coalesce(v_actor_name, 'Sistema'),
    jsonb_build_object('row', v_row)
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.audit_row_change() from public, anon, authenticated;
