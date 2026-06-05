-- Handover v2 — Migration 0011: harden internal helper grants
--
-- Supabase auto-grants EXECUTE on public-schema functions to anon/authenticated
-- (same lesson as 0002). The 0004–0010 internal helpers only ran `revoke ... from public`,
-- which is NOT enough — anon/authenticated could still execute SECURITY DEFINER helpers
-- such as _handover_audit / _handover_audit_compra (forging audit rows) and other _-helpers.
--
-- Revoke EXECUTE from anon AND authenticated on every internal helper: function names
-- starting with `_` (LIKE escape: `\_` = literal underscore) plus url_encode.
-- Public-facing RPCs (handover_*) are intentionally anon-executable and are left untouched.
-- Idempotent and safe to re-apply.

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and (p.proname like '\_%' or p.proname = 'url_encode')
  loop
    execute format('revoke execute on function %s from anon, authenticated', r.sig);
  end loop;
end $$;
