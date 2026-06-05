-- Handover v2 — Migration 0002: harden function grants
-- Supabase's default privileges auto-GRANT EXECUTE on public-schema functions to
-- anon/authenticated, so `revoke ... from public` in 0001 was not enough for the
-- two INTERNAL helpers. Revoke them explicitly so only the SECURITY DEFINER callers
-- (running as owner) can use them. Also pin norm_usuario's search_path.

alter function public.norm_usuario(text) set search_path = pg_catalog;

revoke execute on function public.handover_check_session(uuid) from anon, authenticated;
revoke execute on function public.norm_usuario(text)           from anon, authenticated;
