-- Crescer+ / Supabase — central de notificações e contato/suporte

create table if not exists public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  kind text not null default 'announcement' check (kind in ('announcement','tip','system','support','reminder')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  action_url text null,
  expires_at timestamptz null,
  audience_type text not null default 'all' check (audience_type in ('all','role','user','age_stage')),
  audience_value text null,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  scheduled_for timestamptz null,
  recipient_count integer not null default 0,
  created_by uuid not null references public.users(id) on delete restrict,
  published_by uuid null references public.users(id) on delete set null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_campaigns_status on public.notification_campaigns(status, scheduled_for, created_at desc);
create index if not exists idx_notification_campaigns_created_by on public.notification_campaigns(created_by, created_at desc);

alter table public.notifications add column if not exists campaign_id uuid null references public.notification_campaigns(id) on delete set null;
alter table public.notifications add column if not exists priority text not null default 'normal' check (priority in ('low','normal','high','urgent'));
alter table public.notifications add column if not exists action_url text null;
alter table public.notifications add column if not exists expires_at timestamptz null;
create index if not exists idx_notifications_unread on public.notifications(user_id, read_at, created_at desc);
create unique index if not exists uq_notifications_campaign_user on public.notifications(campaign_id, user_id) where campaign_id is not null;

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  browser_enabled boolean not null default false,
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject text not null,
  category text not null default 'general' check (category in ('general','account','activities','privacy','bug','suggestion')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','waiting_user','resolved','closed')),
  assigned_to uuid null references public.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  internal_note boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_user_updated on public.support_tickets(user_id, updated_at desc);
create index if not exists idx_support_tickets_status_updated on public.support_tickets(status, updated_at desc);
create index if not exists idx_support_messages_ticket_created on public.support_messages(ticket_id, created_at asc);

alter table public.notification_campaigns enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

-- Existing notification policies are replaced with explicit owner policies.
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "notifications_update_own" on public.notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "notification_campaigns_super_admin" on public.notification_campaigns
for all to authenticated using ((select private.is_super_admin())) with check ((select private.is_super_admin()));

create policy "notification_preferences_own" on public.notification_preferences
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "support_tickets_owner_or_staff" on public.support_tickets
for select to authenticated using ((select auth.uid()) = user_id or (select private.is_staff()));
create policy "support_tickets_insert_owner" on public.support_tickets
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "support_tickets_manage_staff" on public.support_tickets
for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create policy "support_messages_owner_or_staff" on public.support_messages
for select to authenticated using (
  (select private.is_staff())
  or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid()))
);
create policy "support_messages_insert_owner_or_staff" on public.support_messages
for insert to authenticated with check (
  author_user_id = (select auth.uid())
  and ((select private.is_staff()) or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid())))
);
create policy "support_messages_manage_staff" on public.support_messages
for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create or replace function public.publish_notification_campaign(p_campaign_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_campaign public.notification_campaigns%rowtype;
  v_count integer;
begin
  if v_actor is null then raise exception 'Sessão ausente'; end if;
  if not private.is_super_admin() then raise exception 'Apenas super administradores podem publicar notificações'; end if;
  select * into v_campaign from public.notification_campaigns where id = p_campaign_id for update;
  if not found then raise exception 'Campanha não encontrada'; end if;
  if v_campaign.status not in ('draft','scheduled') then raise exception 'Apenas campanhas em rascunho ou agendadas podem ser publicadas'; end if;

  insert into public.notifications (user_id, kind, title, body, campaign_id, priority, action_url, expires_at)
  select u.id, v_campaign.kind, v_campaign.title, v_campaign.body, v_campaign.id, v_campaign.priority, v_campaign.action_url, v_campaign.expires_at
  from public.users u
  where u.banned = false
    and (
      v_campaign.audience_type = 'all'
      or (v_campaign.audience_type = 'role' and u.role = v_campaign.audience_value)
      or (v_campaign.audience_type = 'user' and u.id::text = v_campaign.audience_value)
      or (v_campaign.audience_type = 'age_stage' and exists (
        select 1 from public.children ch where ch.user_id = u.id and ch.age_stage_id = v_campaign.audience_value
      ))
    )
    and coalesce((select np.in_app_enabled from public.notification_preferences np where np.user_id = u.id), true)
  on conflict (campaign_id, user_id) do nothing;

  get diagnostics v_count = row_count;
  update public.notification_campaigns
  set status = 'published', published_by = v_actor, published_at = now(), recipient_count = v_count, updated_at = now()
  where id = v_campaign.id;
  return v_count;
end;
$$;

revoke all on function public.publish_notification_campaign(uuid) from public, anon, authenticated;
grant execute on function public.publish_notification_campaign(uuid) to authenticated;

create or replace function public.create_support_ticket(
  p_subject text,
  p_category text,
  p_priority text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_ticket uuid;
begin
  if v_user is null then raise exception 'Sessão ausente'; end if;
  if length(trim(coalesce(p_subject, ''))) < 3 then raise exception 'Informe um assunto válido'; end if;
  if length(trim(coalesce(p_body, ''))) < 10 then raise exception 'Escreva uma mensagem com pelo menos 10 caracteres'; end if;
  insert into public.support_tickets (user_id, subject, category, priority)
  values (v_user, left(trim(p_subject), 160), coalesce(p_category, 'general'), coalesce(p_priority, 'normal'))
  returning id into v_ticket;
  insert into public.support_messages (ticket_id, author_user_id, body)
  values (v_ticket, v_user, trim(p_body));
  return v_ticket;
end;
$$;

revoke all on function public.create_support_ticket(text, text, text, text) from public, anon;
grant execute on function public.create_support_ticket(text, text, text, text) to authenticated;

create or replace function public.reply_support_ticket(
  p_ticket_id uuid,
  p_body text,
  p_internal_note boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_message uuid;
  v_staff boolean := private.is_staff();
begin
  if v_user is null then raise exception 'Sessão ausente'; end if;
  if length(trim(coalesce(p_body, ''))) < 2 then raise exception 'Escreva uma resposta'; end if;
  select user_id into v_owner from public.support_tickets where id = p_ticket_id for update;
  if not found then raise exception 'Chamado não encontrado'; end if;
  if p_internal_note and not v_staff then raise exception 'Somente a equipe pode criar notas internas'; end if;
  if not v_staff and v_owner <> v_user then raise exception 'Chamado não pertence a esta conta'; end if;
  insert into public.support_messages (ticket_id, author_user_id, body, internal_note)
  values (p_ticket_id, v_user, trim(p_body), coalesce(p_internal_note, false))
  returning id into v_message;
  update public.support_tickets
  set status = case when v_staff then 'waiting_user' else 'open' end,
      last_message_at = now(), updated_at = now(),
      assigned_to = case when v_staff then v_user else assigned_to end
  where id = p_ticket_id;
  return v_message;
end;
$$;

revoke all on function public.reply_support_ticket(uuid, text, boolean) from public, anon;
grant execute on function public.reply_support_ticket(uuid, text, boolean) to authenticated;

create or replace function private.set_notification_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists notification_campaigns_updated_at on public.notification_campaigns;
create trigger notification_campaigns_updated_at before update on public.notification_campaigns for each row execute function private.set_notification_updated_at();
drop trigger if exists notification_preferences_updated_at on public.notification_preferences;
create trigger notification_preferences_updated_at before update on public.notification_preferences for each row execute function private.set_notification_updated_at();
drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at before update on public.support_tickets for each row execute function private.set_notification_updated_at();

drop trigger if exists audit_notification_campaigns_change on public.notification_campaigns;
create trigger audit_notification_campaigns_change after insert or update or delete on public.notification_campaigns for each row execute function private.audit_row_change();
drop trigger if exists audit_notifications_change on public.notifications;
create trigger audit_notifications_change after insert or update or delete on public.notifications for each row execute function private.audit_row_change();
drop trigger if exists audit_notification_preferences_change on public.notification_preferences;
create trigger audit_notification_preferences_change after insert or update or delete on public.notification_preferences for each row execute function private.audit_row_change();
drop trigger if exists audit_support_tickets_change on public.support_tickets;
create trigger audit_support_tickets_change after insert or update or delete on public.support_tickets for each row execute function private.audit_row_change();
drop trigger if exists audit_support_messages_change on public.support_messages;
create trigger audit_support_messages_change after insert or update or delete on public.support_messages for each row execute function private.audit_row_change();
