-- Crescer+ / Supabase — permissão mínima para avaliar políticas RLS

grant execute on function private.is_staff() to authenticated;
revoke execute on function private.is_staff() from anon;
