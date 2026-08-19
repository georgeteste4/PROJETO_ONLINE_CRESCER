-- Grants mínimos para o módulo de notificações e suporte.
grant select, insert, update, delete on public.notification_campaigns to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
grant select on public.support_tickets to authenticated;
grant select on public.support_messages to authenticated;

grant execute on function public.publish_notification_campaign(uuid) to authenticated;
grant execute on function public.create_support_ticket(text, text, text, text) to authenticated;
grant execute on function public.reply_support_ticket(uuid, text, boolean) to authenticated;
