-- Handover v2 — Migration 0009: admin de usuários (gate perfil admin)
--
-- RPCs (todas validam sessão via public.handover_check_session e exigem perfil
-- 'admin' internamente; por isso recebem grant execute para anon — a checagem de
-- admin é feita DENTRO da função, nunca pelo cliente):
--   * handover_usuario_criar(p_token, p_nome, p_usuario, p_perfil)
--   * handover_usuario_reset_pin(p_token, p_usuario, p_pin)  (bcrypt via pgcrypto, igual handover_set_pin)
--   * handover_usuario_ativar(p_token, p_usuario)
--   * handover_usuario_inativar(p_token, p_usuario)
--
-- Convenções (ver 0001/0003 + SPEC):
--   * language plpgsql security definer set search_path = public, extensions
--     (extensions é necessário para gen_salt/crypt do pgcrypto — ver 0003).
--   * Token validado no início; perfil admin obrigatório.
--   * norm_usuario para normalizar o login.
--   * Auditoria de toda escrita em public.auditoria via public._handover_audit.
--   * Retorno jsonb em chaves PascalCase iguais aos cabeçalhos.
--   * revoke all from public + grant execute to anon nas 4 RPCs.
--   * Idempotente: create or replace / if not exists.

create extension if not exists pgcrypto;

-- ============================ AUDITORIA ============================
-- Tabela e helper definidos canonicamente na 0004 (SPEC §4). Recriados aqui de
-- forma idempotente para que 0009 seja aplicável de forma independente sem quebrar.
create table if not exists public.auditoria (
  id_auditoria    uuid primary key default gen_random_uuid(),
  data_hora       timestamptz not null default now(),
  acao            text,
  origem          text,
  id_item         uuid,
  usuario         text,
  nome            text,
  perfil          text,
  campo           text,
  valor_anterior  text,
  valor_novo      text,
  resumo          text
);
alter table public.auditoria enable row level security;   -- no policies => locked to anon
create index if not exists auditoria_item_idx on public.auditoria (id_item, data_hora);

create or replace function public._handover_audit(
  p_sessao  public.sessoes,
  p_acao    text,
  p_origem  text,
  p_id_item uuid,
  p_campo   text,
  p_valor_anterior text,
  p_valor_novo     text,
  p_resumo  text
) returns void language sql security definer set search_path = public, extensions as $$
  insert into public.auditoria
    (acao, origem, id_item, usuario, nome, perfil, campo, valor_anterior, valor_novo, resumo)
  values
    (p_acao, p_origem, p_id_item, p_sessao.usuario, p_sessao.nome, p_sessao.perfil,
     p_campo, p_valor_anterior, p_valor_novo, p_resumo)
$$;

-- ===================== ADMIN: criar usuário =====================
create or replace function public.handover_usuario_criar(
  p_token uuid, p_nome text, p_usuario text, p_perfil text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s        public.sessoes;
  v_nome   text := btrim(coalesce(p_nome, ''));
  v_login  text := norm_usuario(p_usuario);
  v_perfil text := lower(btrim(coalesce(p_perfil, '')));
  r        public.usuarios;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil <> 'admin' then raise exception 'nao_autorizado'; end if;

  if v_nome = '' then raise exception 'Nome obrigatório.'; end if;
  if v_login = '' then raise exception 'Usuário obrigatório.'; end if;
  if v_perfil not in ('operador','gerente','admin','comprador') then
    raise exception 'Perfil inválido.';
  end if;

  if exists (select 1 from public.usuarios where usuario = v_login) then
    raise exception 'Usuário já existe.';
  end if;

  insert into public.usuarios (nome, usuario, perfil, ativo, criado_por)
    values (v_nome, v_login, v_perfil, true, s.nome)
    returning * into r;

  perform public._handover_audit(
    s, 'Usuário criado', 'Usuarios', r.id,
    null, null, null,
    'Usuário ' || r.usuario || ' (' || r.perfil || ') criado por ' || s.nome);

  return jsonb_build_object(
    'success', true,
    'Usuario', jsonb_build_object(
      'ID',      r.id,
      'Nome',    r.nome,
      'Usuario', r.usuario,
      'Perfil',  r.perfil,
      'Ativo',   r.ativo,
      'Origem',  'Usuarios'));
end $$;

-- ===================== ADMIN: reset de PIN =====================
-- Reusa a lógica de handover_set_pin: bcrypt via pgcrypto.
create or replace function public.handover_usuario_reset_pin(
  p_token uuid, p_usuario text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s       public.sessoes;
  v_login text := norm_usuario(p_usuario);
  r       public.usuarios;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil <> 'admin' then raise exception 'nao_autorizado'; end if;

  if p_pin !~ '^\d{4,8}$' then
    raise exception 'PIN deve ter 4 a 8 dígitos.';
  end if;

  update public.usuarios
     set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')),
         tentativas_falhas = 0,
         bloqueado_ate = null
   where usuario = v_login
   returning * into r;
  if not found then raise exception 'Usuário não encontrado.'; end if;

  perform public._handover_audit(
    s, 'PIN redefinido', 'Usuarios', r.id,
    'pin_hash', null, null,
    'PIN do usuário ' || r.usuario || ' redefinido por ' || s.nome);

  return jsonb_build_object(
    'success', true,
    'Usuario', jsonb_build_object(
      'ID',      r.id,
      'Nome',    r.nome,
      'Usuario', r.usuario,
      'Perfil',  r.perfil,
      'Ativo',   r.ativo,
      'Origem',  'Usuarios'));
end $$;

-- ===================== ADMIN: ativar usuário =====================
create or replace function public.handover_usuario_ativar(
  p_token uuid, p_usuario text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s       public.sessoes;
  v_login text := norm_usuario(p_usuario);
  r       public.usuarios;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil <> 'admin' then raise exception 'nao_autorizado'; end if;

  update public.usuarios
     set ativo = true,
         tentativas_falhas = 0,
         bloqueado_ate = null
   where usuario = v_login
   returning * into r;
  if not found then raise exception 'Usuário não encontrado.'; end if;

  perform public._handover_audit(
    s, 'Usuário ativado', 'Usuarios', r.id,
    'ativo', 'false', 'true',
    'Usuário ' || r.usuario || ' ativado por ' || s.nome);

  return jsonb_build_object(
    'success', true,
    'Usuario', jsonb_build_object(
      'ID',      r.id,
      'Nome',    r.nome,
      'Usuario', r.usuario,
      'Perfil',  r.perfil,
      'Ativo',   r.ativo,
      'Origem',  'Usuarios'));
end $$;

-- ===================== ADMIN: inativar usuário =====================
create or replace function public.handover_usuario_inativar(
  p_token uuid, p_usuario text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s       public.sessoes;
  v_login text := norm_usuario(p_usuario);
  r       public.usuarios;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil <> 'admin' then raise exception 'nao_autorizado'; end if;

  -- evita o admin se trancar para fora ao inativar a própria conta
  if v_login = norm_usuario(s.usuario) then
    raise exception 'Você não pode inativar a própria conta.';
  end if;

  update public.usuarios
     set ativo = false
   where usuario = v_login
   returning * into r;
  if not found then raise exception 'Usuário não encontrado.'; end if;

  -- encerra sessões ativas do usuário inativado
  delete from public.sessoes where usuario = v_login;

  perform public._handover_audit(
    s, 'Usuário inativado', 'Usuarios', r.id,
    'ativo', 'true', 'false',
    'Usuário ' || r.usuario || ' inativado por ' || s.nome);

  return jsonb_build_object(
    'success', true,
    'Usuario', jsonb_build_object(
      'ID',      r.id,
      'Nome',    r.nome,
      'Usuario', r.usuario,
      'Perfil',  r.perfil,
      'Ativo',   r.ativo,
      'Origem',  'Usuarios'));
end $$;

-- ========================= GRANTS ==============================
-- Tabela auditoria trancada para anon/authenticated (sem policy).
revoke all on public.auditoria from anon, authenticated;

-- Helper interno: sem grant para anon (roda como owner via security definer).
revoke all on function public._handover_audit(public.sessoes,text,text,uuid,text,text,text,text) from public;
revoke execute on function public._handover_audit(public.sessoes,text,text,uuid,text,text,text,text) from anon, authenticated;

-- Revoga o execute PUBLIC default das 4 RPCs.
revoke all on function public.handover_usuario_criar(uuid,text,text,text)  from public;
revoke all on function public.handover_usuario_reset_pin(uuid,text,text)   from public;
revoke all on function public.handover_usuario_ativar(uuid,text)           from public;
revoke all on function public.handover_usuario_inativar(uuid,text)         from public;

-- Grant execute para anon SOMENTE nas 4 RPCs (gate de admin é interno).
grant execute on function public.handover_usuario_criar(uuid,text,text,text)  to anon;
grant execute on function public.handover_usuario_reset_pin(uuid,text,text)   to anon;
grant execute on function public.handover_usuario_ativar(uuid,text)           to anon;
grant execute on function public.handover_usuario_inativar(uuid,text)         to anon;
