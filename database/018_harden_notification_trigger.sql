-- Evita search_path mutável na função de atualização automática de notificações.

create or replace function private.set_notification_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
