-- Handover v2 — Migration 0021: Notificações in-app de compras/encomendas + registro de cotação
--
-- Contexto (Issue #5 — Fase 1 backend):
--   • Quando um usuário cria uma solicitação de encomenda/falta (medicamentos) ou
--     compra de reposição, usuários com perfil admin/comprador recebem notificação
--     IN-APP (tabela handover_notificacoes, criada na 0020).
--   • Nova RPC handover_cotacao_registrar: o app do comprador registra na auditoria
--     o evento de geração de cotação WhatsApp (multi-itens).
--
-- Decisões registradas (ver CHECKPOINT_0021.md):
--   • Notificação é INLINE nas RPCs de criação (não trigger) para NÃO disparar em
--     re-import (migracao/import.mjs insere direto nas tabelas).
--   • handover_medicamento_cancelar, handover_compra_reposicao_comprar e
--     handover_compra_reposicao_cancelar NÃO ganham check de perfil: são usadas
--     pelos fluxos de operador nas abas Encomendas e Compras e reposição
--     (web/medicamentos.js, web/compras.js, web-redesign/handover-app.jsx).
--     As RPCs da fila do comprador já são perfil-gated (0006/0015).
--
-- Security model (mesmo das 0001–0020):
--   * RLS sem policies; acesso só via SECURITY DEFINER + handover_check_session.
--   * search_path = public, extensions.
--   * Revoke explícito de public/anon/authenticated em TODO objeto novo
--     (default privileges concedem EXECUTE a anon em funções novas — lição da 0011).
--   * Grant execute to anon apenas na RPC pública nova (handover_cotacao_registrar).
-- All statements are idempotent.

-- ============================ 1. CHECKs de handover_notificacoes ============================
-- Aceitar os novos tipos de notificação: encomenda, compra_reposicao, cotacao.
alter table public.handover_notificacoes drop constraint if exists chk_hnotif_tipo;
alter table public.handover_notificacoes add constraint chk_hnotif_tipo
  check (tipo is null or tipo in ('tarefa_acompanhada','encomenda','compra_reposicao','cotacao'));

alter table public.handover_notificacoes drop constraint if exists chk_hnotif_ref_tipo;
alter table public.handover_notificacoes add constraint chk_hnotif_ref_tipo
  check (ref_tipo is null or ref_tipo in ('tarefa_acompanhada','encomenda','compra_reposicao','cotacao'));

-- ============================ 2. Helper interno _notificar_perfis ============================
-- Fan-out de notificação para todos os usuários ATIVOS com um dos perfis dados,
-- exceto o autor da ação. Internal, no grant.
create or replace function public._notificar_perfis(
  p_perfis text[], p_excecao text, p_titulo text, p_corpo text,
  p_tipo text, p_ref_tipo text, p_ref_id uuid)
returns void language sql security definer set search_path = public, extensions as $$
  insert into public.handover_notificacoes(usuario, titulo, corpo, tipo, ref_tipo, ref_id)
  select u.usuario, p_titulo, p_corpo, p_tipo, p_ref_tipo, p_ref_id
    from public.usuarios u
   where u.perfil = any(p_perfis)
     and u.ativo
     and u.usuario <> coalesce(p_excecao,'');
$$;

-- ============================ 3a. handover_medicamento_criar (+ notificação) ============================
-- Corpo idêntico ao da 0004; única adição: _notificar_perfis ao final (admin/comprador).
create or replace function public.handover_medicamento_criar(p_token uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  v_tipo text;
  v_pre_pago boolean;
  v_cliente text;
  v_atendente text;
  v_telefone text;
  v_previsao date;
  v_preco numeric(10,2);
  v_fornecedor text;
  v_codigo text;
  v_forma text;
  v_obs_solic text;
  v_itens jsonb;
  v_total int;
  v_pedido uuid;
  v_idx int;
  v_item jsonb;
  v_med_nome text;
  v_qtd text;
  v_obs_item text;
  r public.medicamentos;
  v_records jsonb := '[]'::jsonb;
  v_first_id uuid;
  v_first_nome text;
  v_notif_titulo text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  v_tipo      := coalesce(nullif(btrim(p_payload->>'tipo'),''), 'Falta');
  v_pre_pago  := coalesce((p_payload->>'prePago')::boolean, false);
  v_cliente   := nullif(btrim(p_payload->>'cliente'),'');
  v_atendente := coalesce(nullif(btrim(p_payload->>'atendente'),''), s.nome);
  v_telefone  := nullif(btrim(p_payload->>'telefone'),'');
  v_previsao  := nullif(p_payload->>'previsaoEntrega','')::date;
  v_preco     := nullif(p_payload->>'precoVenda','')::numeric;
  v_fornecedor:= coalesce(nullif(btrim(p_payload->>'fornecedorCompra'),''), 'Não informado');
  v_codigo    := nullif(btrim(p_payload->>'codigoCompraFornecedor'),'');
  v_forma     := coalesce(nullif(btrim(p_payload->>'formaRecebimento'),''), 'A combinar');
  v_obs_solic := nullif(btrim(p_payload->>'observacaoSolicitacao'),'');

  -- Encomenda exige previsão de entrega
  if v_tipo = 'Encomenda' and v_previsao is null then
    raise exception 'Encomenda exige previsão de entrega.';
  end if;

  -- itens multi-item; fallback p/ item único pelo campo medicamento do payload
  v_itens := p_payload->'itens';
  if v_itens is null or jsonb_typeof(v_itens) <> 'array' or jsonb_array_length(v_itens) = 0 then
    v_itens := jsonb_build_array(
      jsonb_build_object(
        'medicamento', p_payload->>'medicamento',
        'quantidade',  p_payload->>'quantidade',
        'observacaoItem', p_payload->>'observacaoItem'
      ));
  end if;

  v_total := jsonb_array_length(v_itens);
  if v_total > 1 then v_pedido := gen_random_uuid(); else v_pedido := null; end if;

  v_idx := 0;
  for v_item in select * from jsonb_array_elements(v_itens)
  loop
    v_idx := v_idx + 1;
    v_med_nome := nullif(btrim(v_item->>'medicamento'),'');
    v_qtd      := nullif(btrim(v_item->>'quantidade'),'');
    v_obs_item := nullif(btrim(v_item->>'observacaoItem'),'');
    if v_med_nome is null then
      raise exception 'Item % sem nome de medicamento.', v_idx;
    end if;

    insert into public.medicamentos (
      criado_em, tipo, medicamento, pre_pago, cliente, atendente, previsao_entrega,
      telefone, status, preco_venda, fornecedor_compra, codigo_compra_fornecedor,
      forma_recebimento, observacao_solicitacao, ultima_acao_por, ultima_acao_em,
      pedido_id, item_indice, total_itens, quantidade_item, observacao_item)
    values (
      now(), v_tipo, v_med_nome, v_pre_pago, v_cliente, v_atendente, v_previsao,
      v_telefone, 'Pendente', v_preco, v_fornecedor, v_codigo,
      v_forma, v_obs_solic, s.nome, now(),
      v_pedido, v_idx, v_total, v_qtd, v_obs_item)
    returning * into r;

    if v_idx = 1 then v_first_id := r.id; v_first_nome := r.medicamento; end if;

    perform public._handover_audit('Criado', 'Medicamentos', r.id, s,
      null, null, null,
      'Item criado: ' || coalesce(r.medicamento,'') || ' (' || r.tipo || ')');

    v_records := v_records || public._medicamento_to_json(r);
  end loop;

  -- Notificação in-app para admin/comprador (uma por solicitação, não por item).
  if v_total = 1 then
    v_notif_titulo := 'Nova ' || lower(v_tipo) || ': ' || coalesce(v_first_nome,'');
  else
    v_notif_titulo := 'Nova ' || lower(v_tipo) || ': ' || v_total || ' itens';
  end if;
  perform public._notificar_perfis(
    array['admin','comprador'], s.usuario,
    v_notif_titulo,
    trim(both ' · ' from coalesce('Cliente: ' || v_cliente, '') ||
      case when v_cliente is not null then ' · ' else '' end ||
      'Solicitado por ' || v_atendente),
    'encomenda', 'encomenda', v_first_id);

  if v_total = 1 then
    return jsonb_build_object('success', true, 'record', v_records->0);
  end if;
  return jsonb_build_object('success', true, 'records', v_records);
end $$;

-- ============================ 3b. handover_compra_reposicao_criar (+ notificação) ============================
-- Corpo idêntico ao da 0005; única adição: _notificar_perfis ao final (admin/comprador).
create or replace function public.handover_compra_reposicao_criar(p_token uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  v_categoria text;
  v_prioridade text;
  v_motivo text;
  v_solicitante text;
  v_observacao text;
  v_fornecedor text;
  v_previsao date;
  v_itens jsonb;
  v_total int;
  v_pedido uuid;
  v_idx int;
  v_item jsonb;
  v_item_nome text;
  v_qtd text;
  v_unidade text;
  v_obs_item text;
  r public.compras_reposicao;
  v_records jsonb := '[]'::jsonb;
  v_first_id uuid;
  v_first_nome text;
  v_notif_titulo text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  v_categoria   := nullif(btrim(p_payload->>'categoriaCompra'),'');
  v_prioridade  := coalesce(nullif(btrim(p_payload->>'prioridade'),''), 'Normal');
  v_motivo      := nullif(btrim(p_payload->>'motivo'),'');
  v_solicitante := coalesce(nullif(btrim(p_payload->>'solicitante'),''), s.nome);
  v_observacao  := nullif(btrim(p_payload->>'observacao'),'');
  v_fornecedor  := nullif(btrim(p_payload->>'fornecedorSugerido'),'');
  v_previsao    := nullif(p_payload->>'previsaoDesejada','')::date;

  -- itens multi-item; fallback p/ item único pelos campos da raiz do payload
  v_itens := p_payload->'itens';
  if v_itens is null or jsonb_typeof(v_itens) <> 'array' or jsonb_array_length(v_itens) = 0 then
    v_itens := jsonb_build_array(
      jsonb_build_object(
        'item',          p_payload->>'item',
        'quantidade',    p_payload->>'quantidade',
        'unidade',       p_payload->>'unidade',
        'observacaoItem',p_payload->>'observacaoItem'
      ));
  end if;

  v_total := jsonb_array_length(v_itens);
  if v_total > 1 then v_pedido := gen_random_uuid(); else v_pedido := null; end if;

  v_idx := 0;
  for v_item in select * from jsonb_array_elements(v_itens)
  loop
    v_idx := v_idx + 1;
    v_item_nome := nullif(btrim(v_item->>'item'),'');
    v_qtd       := nullif(btrim(v_item->>'quantidade'),'');
    v_unidade   := nullif(btrim(v_item->>'unidade'),'');
    v_obs_item  := nullif(btrim(v_item->>'observacaoItem'),'');
    if v_item_nome is null then
      raise exception 'Item % sem nome.', v_idx;
    end if;

    insert into public.compras_reposicao (
      data_solicitacao, categoria_compra, item, quantidade, unidade, prioridade,
      motivo, solicitante, observacao, fornecedor_sugerido, previsao_desejada,
      status_compra, status_handover, ultima_acao_por, ultima_acao_em,
      pedido_id, item_indice, total_itens, quantidade_item, observacao_item)
    values (
      now(), v_categoria, v_item_nome, v_qtd, v_unidade, v_prioridade,
      v_motivo, v_solicitante, v_observacao, v_fornecedor, v_previsao,
      'Pendente de compra', 'Pendente', s.nome, now(),
      v_pedido, v_idx, v_total, v_qtd, v_obs_item)
    returning * into r;

    if v_idx = 1 then v_first_id := r.id; v_first_nome := r.item; end if;

    perform public._handover_audit('Criado', 'Compras_Reposicao', r.id, s,
      null, null, null,
      'Item criado: ' || coalesce(r.item,''));

    v_records := v_records || public._compras_reposicao_to_json(r);
  end loop;

  -- Notificação in-app para admin/comprador (uma por solicitação, não por item).
  if v_total = 1 then
    v_notif_titulo := 'Nova compra: ' || coalesce(v_first_nome,'');
  else
    v_notif_titulo := 'Nova compra: ' || v_total || ' itens';
  end if;
  perform public._notificar_perfis(
    array['admin','comprador'], s.usuario,
    v_notif_titulo,
    'Solicitado por ' || v_solicitante ||
      case when v_prioridade not in ('Normal') then ' · Prioridade: ' || v_prioridade else '' end,
    'compra_reposicao', 'compra_reposicao', v_first_id);

  if v_total = 1 then
    return jsonb_build_object('success', true, 'record', v_records->0);
  end if;
  return jsonb_build_object('success', true, 'records', v_records);
end $$;

-- ============================ 4. handover_cotacao_registrar ============================
-- Registra na auditoria o evento de geração de cotação WhatsApp (multi-itens).
-- Perfil exigido: comprador/gerente/admin (mesma regra da fila do comprador, 0006).
-- p_itens: array de {id: uuid, origem: 'Medicamentos'|'Reposicao', nome: text}
create or replace function public.handover_cotacao_registrar(p_token uuid, p_itens jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  v_total int;
  v_item jsonb;
  v_id uuid;
  v_origem text;
  v_nome text;
  v_registrados int := 0;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if s.perfil not in ('comprador','gerente','admin') then
    raise exception 'nao_autorizado';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'itens_invalidos';
  end if;
  v_total := jsonb_array_length(p_itens);
  if v_total > 100 then raise exception 'itens_demais'; end if;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    begin
      v_id := (v_item->>'id')::uuid;
    exception when others then
      continue;  -- ignora item com id inválido
    end;
    v_origem := case when v_item->>'origem' = 'Medicamentos'
                     then 'Medicamentos' else 'Compras_Reposicao' end;
    v_nome   := coalesce(nullif(btrim(v_item->>'nome'),''), '(sem nome)');

    perform public._handover_audit('Cotação', v_origem, v_id, s,
      null, null, null,
      'Cotação WhatsApp gerada: ' || v_nome || ' (pedido com ' || v_total || ' item(ns))');
    v_registrados := v_registrados + 1;
  end loop;

  if v_registrados = 0 then raise exception 'itens_invalidos'; end if;
  return jsonb_build_object('ok', true, 'registrados', v_registrados);
end $$;

-- ============================ GRANTS ============================
-- Revogar default privileges em TODO objeto novo/recriado (lição 0011: default
-- privileges concedem EXECUTE a anon/authenticated em funções novas).
revoke all on function public._notificar_perfis(text[],text,text,text,text,text,uuid) from public, anon, authenticated;
revoke all on function public.handover_cotacao_registrar(uuid,jsonb)                 from public, anon, authenticated;
revoke all on function public.handover_medicamento_criar(uuid,jsonb)                 from public, anon, authenticated;
revoke all on function public.handover_compra_reposicao_criar(uuid,jsonb)            from public, anon, authenticated;

-- Grant execute to anon apenas nas RPCs públicas.
grant execute on function public.handover_cotacao_registrar(uuid,jsonb)      to anon;
grant execute on function public.handover_medicamento_criar(uuid,jsonb)      to anon;
grant execute on function public.handover_compra_reposicao_criar(uuid,jsonb) to anon;
