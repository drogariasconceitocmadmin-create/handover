-- Handover v2 — Migration 0001: Auth (usuario+PIN) + Pendências (aba Geral)
--
-- Security model (reviewed):
--   * Static frontend uses the public anon key. Tables have RLS enabled with NO
--     policies, so the anon key can NEVER read/write them directly.
--   * ALL access goes through SECURITY DEFINER functions that validate a session
--     token via the INTERNAL helper handover_check_session (NOT anon-callable).
--   * Default PUBLIC execute on functions is revoked; only the intended RPCs are
--     granted to anon. PIN hashes (bcrypt/pgcrypto) are never returned to clients.
--   * handover_login: constant-time (always spends one bcrypt), generic error,
--     and per-user lockout after repeated failures (mitigates 4-digit brute force).

create extension if not exists pgcrypto;

-- ============================ USERS ============================
create table if not exists public.usuarios (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  usuario           text not null unique,
  pin_hash          text,                             -- bcrypt: crypt(pin, gen_salt('bf'))
  perfil            text not null default 'operador'
                      check (perfil in ('operador','gerente','admin')),
  ativo             boolean not null default true,
  tentativas_falhas integer not null default 0,
  bloqueado_ate     timestamptz,
  criado_em         timestamptz not null default now(),
  criado_por        text,
  ultimo_login_em   timestamptz
);
alter table public.usuarios enable row level security;   -- no policies => locked to anon

create or replace function public.norm_usuario(p text)
returns text language sql immutable as $$
  select lower(btrim(coalesce(p,'')))
$$;

-- ============================ SESSIONS =========================
create table if not exists public.sessoes (
  token       uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.usuarios(id) on delete cascade,
  usuario     text not null,
  nome        text not null,
  perfil      text not null,
  criado_em   timestamptz not null default now(),
  expira_em   timestamptz not null default now() + interval '12 hours'
);
alter table public.sessoes enable row level security;

-- ===================== PENDÊNCIAS (aba Geral) ==================
create table if not exists public.pendencias (
  id                  uuid primary key default gen_random_uuid(),
  criado_em           timestamptz not null default now(),
  autor               text,
  titulo              text,
  descricao           text,
  urgencia            text not null default 'Normal'
                        check (urgencia in ('Baixa','Normal','Alta','Urgente')),
  resolvido           boolean not null default false,
  resolvido_por       text,
  data_resolucao      timestamptz,
  ultima_acao_por     text,
  ultima_acao_em      timestamptz,
  tem_vencimento      boolean not null default false,
  data_vencimento     date,
  hora_vencimento     text,
  reaberto_de         uuid,
  excluido            boolean not null default false,
  excluido_por        text,
  excluido_por_perfil text,
  data_exclusao       timestamptz,
  motivo_exclusao     text
);
alter table public.pendencias enable row level security;
create index if not exists pendencias_listagem_idx
  on public.pendencias (excluido, resolvido, criado_em desc);

-- ================== INTERNAL helper (NOT anon) =================
create or replace function public.handover_check_session(p_token uuid)
returns public.sessoes language sql security definer set search_path = public as $$
  select * from public.sessoes where token = p_token and expira_em > now()
$$;

-- ======================= AUTH RPCs =============================
create or replace function public.handover_login(p_usuario text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u public.usuarios;
  s public.sessoes;
  v_hash text;
begin
  -- opportunistic cleanup of expired sessions (bounds table growth)
  delete from public.sessoes where expira_em < now();

  select * into u from public.usuarios
   where usuario = norm_usuario(p_usuario) and ativo = true;

  -- lockout (only meaningful for an existing user)
  if u.id is not null and u.bloqueado_ate is not null and u.bloqueado_ate > now() then
    return jsonb_build_object('ok', false,
      'erro', 'Muitas tentativas. Tente novamente em alguns minutos.');
  end if;

  -- constant-time: always run exactly one bcrypt, even if the user is missing
  v_hash := coalesce(nullif(u.pin_hash, ''), gen_salt('bf'));

  if u.id is null or u.pin_hash is null or u.pin_hash = ''
     or crypt(p_pin, v_hash) <> v_hash then
    if u.id is not null then
      update public.usuarios
         set tentativas_falhas = tentativas_falhas + 1,
             bloqueado_ate = case when tentativas_falhas + 1 >= 5
                                  then now() + interval '5 minutes'
                                  else bloqueado_ate end
       where id = u.id;
    end if;
    return jsonb_build_object('ok', false, 'erro', 'Usuário ou PIN inválido.');
  end if;

  update public.usuarios
     set ultimo_login_em = now(), tentativas_falhas = 0, bloqueado_ate = null
   where id = u.id;
  insert into public.sessoes (usuario_id, usuario, nome, perfil)
    values (u.id, u.usuario, u.nome, u.perfil) returning * into s;
  return jsonb_build_object('ok', true, 'token', s.token,
    'usuario', u.usuario, 'nome', u.nome, 'perfil', u.perfil);
end $$;

create or replace function public.handover_logout(p_token uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.sessoes where token = p_token
$$;

-- Admin-only: define/replace a user's PIN (4-8 digits). For future admin UI.
create or replace function public.handover_set_pin(p_token uuid, p_usuario text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessoes;
begin
  s := public.handover_check_session(p_token);
  if s.token is null or s.perfil <> 'admin' then
    return jsonb_build_object('ok', false, 'erro', 'Não autorizado.');
  end if;
  if p_pin !~ '^\d{4,8}$' then
    return jsonb_build_object('ok', false, 'erro', 'PIN deve ter 4 a 8 dígitos.');
  end if;
  update public.usuarios
     set pin_hash = crypt(p_pin, gen_salt('bf')),
         tentativas_falhas = 0, bloqueado_ate = null
   where usuario = norm_usuario(p_usuario);
  if not found then
    return jsonb_build_object('ok', false, 'erro', 'Usuário não encontrado.');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ===================== PENDÊNCIAS RPCs =========================
create or replace function public.handover_pendencias(p_token uuid)
returns setof public.pendencias language plpgsql security definer set search_path = public as $$
declare s public.sessoes;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  return query select * from public.pendencias
    where excluido = false order by resolvido asc, criado_em desc;
end $$;

create or replace function public.handover_pendencia_criar(
  p_token uuid, p_titulo text, p_descricao text, p_urgencia text)
returns public.pendencias language plpgsql security definer set search_path = public as $$
declare s public.sessoes; r public.pendencias;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  insert into public.pendencias (autor, titulo, descricao, urgencia, ultima_acao_por, ultima_acao_em)
    values (s.nome, nullif(p_titulo,''), p_descricao,
            coalesce(nullif(p_urgencia,''),'Normal'), s.nome, now())
    returning * into r;
  return r;
end $$;

create or replace function public.handover_pendencia_resolver(
  p_token uuid, p_id uuid, p_resolvido boolean)
returns public.pendencias language plpgsql security definer set search_path = public as $$
declare s public.sessoes; r public.pendencias;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  update public.pendencias set
     resolvido = p_resolvido,
     resolvido_por = case when p_resolvido then s.nome else null end,
     data_resolucao = case when p_resolvido then now() else null end,
     ultima_acao_por = s.nome, ultima_acao_em = now()
   where id = p_id returning * into r;
  if not found then raise exception 'pendencia_nao_encontrada'; end if;
  return r;
end $$;

create or replace function public.handover_pendencia_excluir(
  p_token uuid, p_id uuid, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
declare s public.sessoes;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  update public.pendencias set excluido = true, excluido_por = s.nome,
     excluido_por_perfil = s.perfil, data_exclusao = now(),
     motivo_exclusao = p_motivo, ultima_acao_por = s.nome, ultima_acao_em = now()
   where id = p_id and excluido = false;
  if not found then raise exception 'pendencia_nao_encontrada'; end if;
end $$;

-- ========================= GRANTS ==============================
-- 1) Lock tables from direct anon/authenticated access.
revoke all on public.usuarios   from anon, authenticated;
revoke all on public.sessoes    from anon, authenticated;
revoke all on public.pendencias from anon, authenticated;

-- 2) Revoke the DEFAULT PUBLIC execute on every function (this is the key fix).
revoke all on function public.norm_usuario(text)                       from public;
revoke all on function public.handover_check_session(uuid)             from public;
revoke all on function public.handover_login(text,text)                from public;
revoke all on function public.handover_logout(uuid)                    from public;
revoke all on function public.handover_set_pin(uuid,text,text)         from public;
revoke all on function public.handover_pendencias(uuid)                from public;
revoke all on function public.handover_pendencia_criar(uuid,text,text,text)   from public;
revoke all on function public.handover_pendencia_resolver(uuid,uuid,boolean)  from public;
revoke all on function public.handover_pendencia_excluir(uuid,uuid,text)      from public;

-- 3) Grant EXECUTE to anon ONLY on the public-facing RPCs.
--    handover_check_session and norm_usuario are internal-only (no anon grant).
grant execute on function public.handover_login(text,text)                     to anon;
grant execute on function public.handover_logout(uuid)                         to anon;
grant execute on function public.handover_set_pin(uuid,text,text)              to anon;
grant execute on function public.handover_pendencias(uuid)                     to anon;
grant execute on function public.handover_pendencia_criar(uuid,text,text,text) to anon;
grant execute on function public.handover_pendencia_resolver(uuid,uuid,boolean) to anon;
grant execute on function public.handover_pendencia_excluir(uuid,uuid,text)    to anon;
