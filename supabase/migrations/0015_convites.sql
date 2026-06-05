-- Handover v2 — Migration 0015: Sistema de convites para novo usuário (primeiro acesso)
--
-- Adiciona tabela `convites` e duas RPCs públicas:
--   1. handover_convite_gerar(p_token) — admin gera código único (30 dias de validade)
--   2. handover_convite_registrar(p_codigo, p_nome, p_pin) — novo user se registra (sem autenticação prévia)
--
-- Fluxo:
--   * Admin loga normalmente → chama handover_convite_gerar → recebe código
--   * Novo user na tela de login clica "Primeiro acesso?" → digita nome + PIN + código
--   * Frontend chama handover_convite_registrar (anon) → cria usuário + sessão + retorna token
--   * User já logado automaticamente no dashboard
--
-- Segurança:
--   * Código de uma única Use (um-time) — marcado como `usado_por` e `usado_em` após sucesso
--   * Expira em 30 dias
--   * Erro genérico ("Código inválido ou expirado") não revela se existe, expirou ou foi usado
--   * Novo user sempre tem perfil='operador' (funcionário, não admin)
--   * PIN é bcrypt hasheado (pgcrypto)

-- ── Tabela convites ──
create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,               -- 8-12 chars alphanumeric, uppercase
  usado_por uuid references public.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  criado_por text,                           -- usuario que gerou (normalmente admin)
  usado_em timestamptz,                      -- timestamp do registro do novo user
  expira_em timestamptz not null
);

-- RLS: sem policies (anon não acessa direto, só via RPC)
alter table public.convites enable row level security;

-- ── RPC: Gerar convite (admin only) ──
create or replace function public.handover_convite_gerar(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  v_codigo text;
  v_novo_convite public.convites;
  v_tentativas integer := 0;
begin
  -- Validar session + admin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil != 'admin' then raise exception 'acesso_negado'; end if;

  -- Gerar código único (retry se collision)
  loop
    v_tentativas := v_tentativas + 1;
    if v_tentativas > 10 then raise exception 'nao_conseguiu_gerar_codigo'; end if;

    -- 8 chars alphanumeric uppercase: a-z, A-Z, 0-9 (62 possibilidades)
    -- segurança suficiente para 30 dias com geração ad-hoc
    v_codigo := upper(
      substring('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                ceil(random()  * 62)::int, 1) ||
      substring('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                ceil(random()  * 62)::int, 1) ||
      substring('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                ceil(random()  * 62)::int, 1) ||
      substring('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                ceil(random()  * 62)::int, 1) ||
      substring('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                ceil(random()  * 62)::int, 1) ||
      substring('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                ceil(random()  * 62)::int, 1) ||
      substring('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                ceil(random()  * 62)::int, 1) ||
      substring('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                ceil(random()  * 62)::int, 1)
    );

    -- Tentar INSERT; se constraint violation, retry
    begin
      insert into public.convites (codigo, criado_por, expira_em)
      values (v_codigo, s.usuario, now() + interval '30 days')
      returning * into v_novo_convite;
      exit; -- sucesso, sair do loop
    exception when unique_violation then
      null; -- retry
    end;
  end loop;

  return jsonb_build_object(
    'success', true,
    'codigo', v_novo_convite.codigo,
    'expira_em', v_novo_convite.expira_em,
    'criado_em', v_novo_convite.criado_em
  );
end $$;

grant execute on function public.handover_convite_gerar(uuid) to anon;

-- ── RPC: Registrar novo user com convite ──
create or replace function public.handover_convite_registrar(p_codigo text, p_nome text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_convite public.convites;
  v_usuario_id uuid;
  v_usuario_novo text;
  v_sessao public.sessoes;
  v_tentativas integer := 0;
begin
  -- Validar inputs
  if coalesce(p_codigo, '') !~ '^[A-Z0-9]{8,12}$' then
    return jsonb_build_object('success', false, 'erro', 'Código inválido ou expirado.');
  end if;
  if length(coalesce(p_nome, '')) < 3 or length(p_nome) > 50 then
    return jsonb_build_object('success', false, 'erro', 'Nome deve ter 3-50 caracteres.');
  end if;
  if p_pin !~ '^\d{4,8}$' then
    return jsonb_build_object('success', false, 'erro', 'PIN deve ter 4-8 dígitos.');
  end if;

  -- Buscar convite
  select * into v_convite from public.convites
  where codigo = p_codigo
    and usado_por is null                -- não foi usado
    and expira_em > now();               -- não expirou

  if v_convite.id is null then
    -- Erro genérico (não revela se não existe, expirou ou já foi usado)
    return jsonb_build_object('success', false, 'erro', 'Código inválido ou expirado.');
  end if;

  -- Gerar usuario (login) único: lower + índice se houver conflict
  v_usuario_novo := lower(split_part(p_nome, ' ', 1)); -- primeiro nome em lowercase
  loop
    v_tentativas := v_tentativas + 1;
    if v_tentativas > 100 then
      return jsonb_build_object('success', false, 'erro', 'Erro ao criar usuário. Tente novamente.');
    end if;

    -- Se houver número, incrementa; senão, adiciona '1'
    if v_usuario_novo ~ '\d+$' then
      v_usuario_novo := regexp_replace(v_usuario_novo, '(\d+)$', (substring(v_usuario_novo from '\d+$')::integer + 1)::text);
    else
      if v_tentativas = 1 then
        -- primeira tentativa sem número
      else
        v_usuario_novo := v_usuario_novo || (v_tentativas - 1)::text;
      end if;
    end if;

    -- Tentar INSERT user
    begin
      insert into public.usuarios (nome, usuario, pin_hash, perfil, criado_por)
      values (
        p_nome,
        v_usuario_novo,
        extensions.crypt(p_pin, extensions.gen_salt('bf')),
        'operador',
        'convite:' || v_convite.codigo
      )
      returning id into v_usuario_id;
      exit; -- sucesso
    exception when unique_violation then
      null; -- retry com número diferente
    end;
  end loop;

  -- Marcar convite como usado
  update public.convites
  set usado_por = v_usuario_id, usado_em = now()
  where id = v_convite.id;

  -- Criar sessão (auto-login)
  insert into public.sessoes (usuario_id, usuario, nome, perfil, expira_em)
  values (v_usuario_id, v_usuario_novo, p_nome, 'operador', now() + interval '12 hours')
  returning * into v_sessao;

  -- Auditar criação
  insert into public.auditoria (acao, origem, id_item, usuario, nome, perfil, resumo)
  values (
    'usuario_criado',
    'Usuarios',
    v_usuario_id,
    'sistema',
    'Sistema',
    'admin',
    'Novo usuário registrado via convite: ' || v_convite.codigo
  );

  return jsonb_build_object(
    'success', true,
    'token', v_sessao.token,
    'usuario', v_sessao.usuario,
    'nome', v_sessao.nome,
    'perfil', v_sessao.perfil
  );
end $$;

grant execute on function public.handover_convite_registrar(text, text, text) to anon;

-- Revogar acesso direto à tabela
revoke all on table public.convites from public;
