-- Handover v2 — Migration 0003: fix pgcrypto resolution (search_path)
-- pgcrypto lives in the `extensions` schema (Supabase default), but handover_login
-- and handover_set_pin are pinned to `set search_path = public`, so their unqualified
-- gen_salt('bf') / crypt(...) calls fail at runtime with:
--   ERROR 42883: function gen_salt(unknown) does not exist
-- Add `extensions` to the search_path of just the two pgcrypto-using functions.
-- No body / grant / RLS change → the security model is untouched. Idempotent.

alter function public.handover_login(text, text)        set search_path = public, extensions;
alter function public.handover_set_pin(uuid, text, text) set search_path = public, extensions;
