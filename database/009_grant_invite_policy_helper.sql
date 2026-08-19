-- Crescer+ / Supabase — permissão mínima para a policy de convites

revoke all on function private.is_super_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_super_admin() to authenticated;
