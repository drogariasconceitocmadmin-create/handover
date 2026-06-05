-- Handover v2 — Migration 0006: perfil "comprador" + RPCs de compras
--
-- Segue as convenções do SPEC (§1, §2, §5 "Migration 0006 — comprador"):
--   * Funções SECURITY DEFINER com `set search_path = public, extensions`.
--   * Toda RPC pública valida p_token via public.handover_check_session.
--   * Tabelas com RLS on e sem policy (criadas em 0004/0005); aqui só funções.
--   * revoke all ... from public + grant execute to anon SOMENTE nas 2 RPCs públicas.
--   * Retorno jsonb em chaves PascalCase iguais aos headers, via os _to_json
--     já existentes (_medicamento_to_json / _compras_reposicao_to_json de 0004/0005).
--   * Toda escrita é auditada em public.auditoria (colunas do §4).
--   * Idempotente: create or replace / alter constraint drop+add condicional.
--
-- DEPENDÊNCIAS (definidas pelas migrations 0004/0005 de outros agentes; NÃO
-- alteradas aqui): tabelas public.medicamentos, public.compras_reposicao,
-- public.auditoria; funções public._medicamento_to_json(public.medicamentos)
-- e public._compras_reposicao_to_json(public.compras_reposicao);
-- public._medicamento_sync_status(boolean, boolean, text).

-- ===================================================================
-- (1) CHECK de public.usuarios.perfil passa a aceitar 'comprador'
--     (drop/add idempotente: remove a constraint atual seja qual for o
--      nome gerado e recria com o conjunto completo de perfis).
-- ===================================================================
do $$
declare
  v_conname text;
begin
  -- localiza a check constraint que governa a coluna "perfil" de usuarios
  select c.conname into v_conname
    from pg_constraint c
    join pg_class t      on t.oid = c.conrelid
    join pg_namespace n  on n.oid = t.relnamespace
   where n.nspname = 'public'
     and t.relname = 'usuarios'
     and c.contype = 'c'
     and pg_get_constraintdef(c.oid) ilike '%perfil%'
   limit 1;

  if v_conname is not null then
    execute format('alter table public.usuarios drop constraint %I', v_conname);
  end if;

  alter table public.usuarios
    add constraint usuarios_perfil_check
    check (perfil in ('operador','gerente','admin','comprador'));
end $$;

-- ===================================================================
-- Helper interno (sem grant): mensagem ao cliente p/ "Não encontrado"
-- (§7 buildMensagemClienteNaoEncontrado_ — 3 parágrafos).
-- ===================================================================
create or replace function public._handover_mensagem_nao_encontrado(
  p_medicamento text, p_cliente text)
returns text
language plpgsql
immutable
security definer
set search_path = public, extensions
as $fn$
declare
  v_nome text := nullif(btrim(coalesce(p_cliente, '')), '');
  v_med  text := nullif(btrim(coalesce(p_medicamento, '')), '');
  v_saud text;
begin
  v_saud := case when v_nome is not null then 'Olá, ' || v_nome || '!' else 'Olá!' end;
  return v_saud
    || E'\n\n'
    || 'Infelizmente o item "' || coalesce(v_med, 'solicitado')
    || '" está indisponível no momento e não conseguimos localizá-lo com nossos fornecedores.'
    || E'\n\n'
    || 'Podemos verificar uma alternativa equivalente para atender à sua necessidade, mantendo a mesma indicação.'
    || E'\n\n'
    || 'Você gostaria que buscássemos uma alternativa equivalente? Fico no aguardo do seu retorno.';
end;
$fn$;

-- ===================================================================
-- Helper interno (sem grant): registro de auditoria em public.auditoria.
-- Colunas conforme §4.
-- ===================================================================
create or replace function public._handover_audit_compra(
  p_acao text, p_origem text, p_id_item uuid,
  p_usuario text, p_nome text, p_perfil text,
  p_campo text, p_valor_anterior text, p_valor_novo text, p_resumo text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
begin
  insert into public.auditoria (
    acao, origem, id_item, usuario, nome, perfil,
    campo, valor_anterior, valor_novo, resumo)
  values (
    p_acao, p_origem, p_id_item, p_usuario, p_nome, p_perfil,
    p_campo, p_valor_anterior, p_valor_novo, p_resumo);
end;
$fn$;

-- ===================================================================
-- (2) handover_compras_listar(p_token)
--     gate perfil in (comprador, gerente, admin); só itens a comprar.
-- ===================================================================
create or replace function public.handover_compras_listar(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  s public.sessoes;
  v_medicamentos jsonb;
  v_compras jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil not in ('comprador','gerente','admin') then
    raise exception 'nao_autorizado';
  end if;

  select coalesce(jsonb_agg(public._medicamento_to_json(m)
                            order by m.criado_em desc), '[]'::jsonb)
    into v_medicamentos
    from public.medicamentos m
   where m.status = 'Pendente';

  select coalesce(jsonb_agg(public._compras_reposicao_to_json(c)
                            order by c.data_solicitacao desc), '[]'::jsonb)
    into v_compras
    from public.compras_reposicao c
   where c.status_compra = 'Pendente de compra';

  return jsonb_build_object(
    'success', true,
    'medicamentos', v_medicamentos,
    'comprasReposicao', v_compras);
end;
$fn$;

-- ===================================================================
-- (3) handover_compra_marcar(p_token, p_origem, p_id, p_status, p_obs)
--     p_origem ∈ {Medicamentos, ComprasReposicao}
--     p_status ∈ Status_Compra (Pendente de compra, Comprado,
--                Não encontrado, Cancelado)
-- ===================================================================
create or replace function public.handover_compra_marcar(
  p_token uuid, p_origem text, p_id uuid, p_status text, p_obs text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  s public.sessoes;
  v_origem text := btrim(coalesce(p_origem, ''));
  v_status text := btrim(coalesce(p_status, ''));
  v_obs    text := nullif(btrim(coalesce(p_obs, '')), '');
  m public.medicamentos;
  c public.compras_reposicao;
  v_msg text;
  v_record jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil not in ('comprador','gerente','admin') then
    raise exception 'nao_autorizado';
  end if;

  if v_status not in ('Pendente de compra','Comprado','Não encontrado','Cancelado') then
    raise exception 'status_invalido';
  end if;

  -- ---------- Origem: Medicamentos ----------
  if v_origem = 'Medicamentos' then
    select * into m from public.medicamentos where id = p_id;
    if m.id is null then raise exception 'item_nao_encontrado'; end if;

    if v_status = 'Comprado' then
      update public.medicamentos set
        comprado          = true,
        status            = public._medicamento_sync_status(true, m.entregue, m.status),
        observacao_compra = coalesce(v_obs, observacao_compra),
        ultima_acao_por   = s.nome,
        ultima_acao_em    = now()
      where id = p_id returning * into m;

    elsif v_status = 'Não encontrado' then
      v_msg := public._handover_mensagem_nao_encontrado(m.medicamento, m.cliente);
      update public.medicamentos set
        status            = 'Não encontrado',
        mensagem_cliente  = v_msg,
        observacao_compra = coalesce(v_obs, observacao_compra),
        ultima_acao_por   = s.nome,
        ultima_acao_em    = now()
      where id = p_id returning * into m;

    elsif v_status = 'Cancelado' then
      update public.medicamentos set
        status               = 'Cancelado',
        cancelado_por        = s.nome,
        data_cancelamento    = now(),
        motivo_cancelamento  = coalesce(v_obs, motivo_cancelamento),
        ultima_acao_por      = s.nome,
        ultima_acao_em       = now()
      where id = p_id returning * into m;

    else  -- 'Pendente de compra' => volta para Pendente
      update public.medicamentos set
        comprado          = false,
        status            = 'Pendente',
        observacao_compra = coalesce(v_obs, observacao_compra),
        ultima_acao_por   = s.nome,
        ultima_acao_em    = now()
      where id = p_id returning * into m;
    end if;

    perform public._handover_audit_compra(
      'Compra: ' || v_status, 'Medicamentos', m.id,
      s.usuario, s.nome, s.perfil,
      'Status', null, v_status,
      'Comprador marcou "' || m.medicamento || '" como ' || v_status);

    v_record := public._medicamento_to_json(m);
    return jsonb_build_object('success', true, 'record', v_record);

  -- ---------- Origem: ComprasReposicao ----------
  elsif v_origem = 'ComprasReposicao' then
    select * into c from public.compras_reposicao where id = p_id;
    if c.id is null then raise exception 'item_nao_encontrado'; end if;

    if v_status = 'Comprado' then
      update public.compras_reposicao set
        status_compra   = 'Comprado',
        comprado        = true,
        comprado_por    = s.nome,
        data_compra     = now(),
        observacao      = coalesce(v_obs, observacao),
        ultima_acao_por = s.nome,
        ultima_acao_em  = now()
      where id = p_id returning * into c;

    elsif v_status = 'Não encontrado' then
      update public.compras_reposicao set
        status_compra   = 'Não encontrado',
        observacao      = coalesce(v_obs, observacao),
        ultima_acao_por = s.nome,
        ultima_acao_em  = now()
      where id = p_id returning * into c;

    elsif v_status = 'Cancelado' then
      update public.compras_reposicao set
        status_compra        = 'Cancelado',
        cancelado            = true,
        cancelado_por        = s.nome,
        data_cancelamento    = now(),
        motivo_cancelamento  = coalesce(v_obs, motivo_cancelamento),
        ultima_acao_por      = s.nome,
        ultima_acao_em       = now()
      where id = p_id returning * into c;

    else  -- 'Pendente de compra'
      update public.compras_reposicao set
        status_compra   = 'Pendente de compra',
        comprado        = false,
        observacao      = coalesce(v_obs, observacao),
        ultima_acao_por = s.nome,
        ultima_acao_em  = now()
      where id = p_id returning * into c;
    end if;

    perform public._handover_audit_compra(
      'Compra: ' || v_status, 'ComprasReposicao', c.id,
      s.usuario, s.nome, s.perfil,
      'Status_Compra', null, v_status,
      'Comprador marcou "' || c.item || '" como ' || v_status);

    v_record := public._compras_reposicao_to_json(c);
    return jsonb_build_object('success', true, 'record', v_record);

  else
    raise exception 'origem_invalida';
  end if;
end;
$fn$;

-- ===================================================================
-- GRANTS
--   * Helpers internos: sem grant (revoke do PUBLIC default).
--   * RPCs públicas: revoke from public + grant execute to anon.
-- ===================================================================
revoke all on function public._handover_mensagem_nao_encontrado(text, text)               from public;
revoke all on function public._handover_audit_compra(text,text,uuid,text,text,text,text,text,text,text) from public;
revoke all on function public.handover_compras_listar(uuid)                               from public;
revoke all on function public.handover_compra_marcar(uuid, text, uuid, text, text)        from public;

grant execute on function public.handover_compras_listar(uuid)                            to anon;
grant execute on function public.handover_compra_marcar(uuid, text, uuid, text, text)     to anon;
