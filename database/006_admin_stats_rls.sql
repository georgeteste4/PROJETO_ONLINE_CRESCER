-- Crescer+ / Supabase — leitura administrativa para métricas

drop policy if exists "completions_select_staff" on public.completions;
drop policy if exists "favorites_select_staff" on public.favorites;

create policy "completions_select_staff" on public.completions
for select to authenticated
using ((select private.is_staff()));

create policy "favorites_select_staff" on public.favorites
for select to authenticated
using ((select private.is_staff()));
