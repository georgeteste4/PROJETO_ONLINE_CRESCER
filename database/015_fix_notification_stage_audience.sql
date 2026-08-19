-- Corrige a segmentação de campanhas por fase: a fase é calculada a partir do DOB.
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
        select 1
        from public.children ch
        join public.age_stages stage on stage.id = v_campaign.audience_value
        where ch.user_id = u.id
          and (current_date - ch.dob) between stage.min_days and stage.max_days
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
