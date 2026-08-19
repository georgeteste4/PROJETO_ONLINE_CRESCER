-- Permite publicação idempotente com ON CONFLICT (campaign_id, user_id).
drop index if exists public.uq_notifications_campaign_user;
create unique index if not exists uq_notifications_campaign_user on public.notifications(campaign_id, user_id);
