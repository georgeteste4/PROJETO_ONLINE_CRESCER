-- Crescer+ — configuração de lembrete de instalação PWA
-- O valor é público apenas para usuários autenticados e não contém segredo.

insert into public.app_settings (key, value_json)
values ('pwa.install_prompt_interval_days', to_jsonb(1))
on conflict (key) do nothing;

drop policy if exists "app_settings_authenticated_pwa_read" on public.app_settings;
create policy "app_settings_authenticated_pwa_read" on public.app_settings
for select to authenticated
using (key = 'pwa.install_prompt_interval_days');
