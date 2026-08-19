-- Crescer+ / Supabase — ampliar auditoria para ações de usuários

drop trigger if exists audit_completions_change on public.completions;
create trigger audit_completions_change after insert or update or delete on public.completions for each row execute function private.audit_row_change();

drop trigger if exists audit_favorites_change on public.favorites;
create trigger audit_favorites_change after insert or update or delete on public.favorites for each row execute function private.audit_row_change();

drop trigger if exists audit_user_consents_change on public.user_consents;
create trigger audit_user_consents_change after insert or update or delete on public.user_consents for each row execute function private.audit_row_change();
