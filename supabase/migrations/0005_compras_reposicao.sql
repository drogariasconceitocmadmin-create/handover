-- Handover v2 — Migration 0005: Compras de Reposição
--
-- Security model (same as 0001/0002/0003/0004):
--   * Table has RLS enabled with NO policies → anon key can never read/write.
--   * All access goes through SECURITY DEFINER functions that validate a session
--     token via public.handover_check_session (internal, not anon-callable).
--   * Default PUBLIC execute on every function is revoked; only the 3 public
--     compras_reposicao RPCs are granted to anon. `_`-helpers get no grant.
--   * search_path = public, extensions (extensions needed for gen_random_uuid /
--     pgcrypto resolution, ver 0003/0004).
--   * Auditoria via public._handover_audit (criado em 0004), Origem='Compras_Reposicao'.
-- All statements are idempotent (create or replace / if not exists).

-- ============================ COMPRAS_REPOSICAO (§4) ============================
create table if not exists public.compras_reposicao (
  id                    uuid primary key default gen_random_uuid(),
  data_solicitacao      timestamptz not null default now(),
  categoria_compra      text,
  item                  text,
  quantidade            text,
  unidade               text,
  prioridade            text not null default 'Normal',
  motivo                text,
  solicitante           text,
  observacao            text,
  fornecedor_sugerido   text,
  previsao_desejada     date,
  status_compra         text not null default 'Pendente de compra',
  status_handover       text not null default 'Pendente',
  comprado              boolean not null default false,
  comprado_por          text,
  data_compra           timestamptz,
  cancelado             boolean not null default false,
  cancelado_por         text,
  data_cancelamento     timestamptz,
  motivo_cancelamento   text,
  ultima_acao_por       text,
  ultima_acao_em        timestamptz,
  excluido              boolean not null default false,
  excluido_por          text,
  excluido_em           timestamptz,
  pedido_id             uuid,
  item_indice           int,
  total_itens           int,
  quantidade_item       text,
  observacao_item       text
);
alter table public.compras_reposicao enable row level security;   -- no policies => locked to anon
create index if not exists compras_reposicao_listagem_idx
  on public.compras_reposicao (status_compra, data_solicitacao desc);
create index if not exists compras_reposicao_pedido_idx
  on public.compras_reposicao (pedido_id);

-- ============================ HELPER (§2) ============================
-- Row → PascalCase JSON (chaves iguais aos cabeçalhos da planilha). Internal, no grant.
create or replace function public._compras_reposicao_to_json(r public.compras_reposicao)
returns jsonb language sql stable set search_path = public, extensions as $$
  select jsonb_build_object(
    'ID',                  r.id,
    'Origem',              'Compras_Reposicao',
    'Data_Solicitacao',    to_char(r.data_solicitacao at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Categoria_Compra',    r.categoria_compra,
    'Item',                r.item,
    'Quantidade',          r.quantidade,
    'Unidade',             r.unidade,
    'Prioridade',          r.prioridade,
    'Motivo',              r.motivo,
    'Solicitante',         r.solicitante,
    'Observacao',          r.observacao,
    'Fornecedor_Sugerido', r.fornecedor_sugerido,
    'Previsao_Desejada',   to_char(r.previsao_desejada, 'YYYY-MM-DD'),
    'Status_Compra',       r.status_compra,
    'Status_Handover',     r.status_handover,
    'Comprado',            coalesce(r.comprado, false),
    'Comprado_Por',        r.comprado_por,
    'Data_Compra',         to_char(r.data_compra at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Cancelado',           coalesce(r.cancelado, false),
    'Cancelado_Por',       r.cancelado_por,
    'Data_Cancelamento',   to_char(r.data_cancelamento at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Motivo_Cancelamento', r.motivo_cancelamento,
    'Ultima_Acao_Por',     r.ultima_acao_por,
    'Ultima_Acao_Em',      to_char(r.ultima_acao_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Excluido',            coalesce(r.excluido, false),
    'Excluido_Por',        r.excluido_por,
    'Excluido_Em',         to_char(r.excluido_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Pedido_ID',           r.pedido_id,
    'Item_Indice',         r.item_indice,
    'Total_Itens',         r.total_itens,
    'Quantidade_Item',     r.quantidade_item,
    'Observacao_Item',     r.observacao_item
  )
$$;

-- ============================ RPCs (público §5 / bloco 0005) ============================

-- handover_compra_reposicao_criar — multi-item via p_payload.itens
-- p_payload: {categoriaCompra, prioridade, motivo, solicitante, observacao,
--             fornecedorSugerido, previsaoDesejada,
--             itens:[{item, quantidade, unidade, observacaoItem}]}
-- Fallback p/ item único pelos campos item/quantidade/unidade do payload raiz.
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

    perform public._handover_audit('Criado', 'Compras_Reposicao', r.id, s,
      null, null, null,
      'Item criado: ' || coalesce(r.item,''));

    v_records := v_records || public._compras_reposicao_to_json(r);
  end loop;

  if v_total = 1 then
    return jsonb_build_object('success', true, 'record', v_records->0);
  end if;
  return jsonb_build_object('success', true, 'records', v_records);
end $$;

-- handover_compra_reposicao_comprar
create or replace function public.handover_compra_reposicao_comprar(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s public.sessoes; r public.compras_reposicao; v_old text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into r from public.compras_reposicao where id = p_id;
  if r.id is null then raise exception 'compra_nao_encontrada'; end if;
  v_old := r.status_compra;
  update public.compras_reposicao set
    comprado = true,
    status_compra = 'Comprado',
    comprado_por = s.nome,
    data_compra = now(),
    ultima_acao_por = s.nome, ultima_acao_em = now()
   where id = p_id returning * into r;
  perform public._handover_audit('Comprado','Compras_Reposicao', r.id, s,
    'Status_Compra', v_old, r.status_compra, 'Marcado como comprado');
  return jsonb_build_object('success', true, 'record', public._compras_reposicao_to_json(r));
end $$;

-- handover_compra_reposicao_cancelar (sai da fila → removedId)
create or replace function public.handover_compra_reposicao_cancelar(p_token uuid, p_id uuid, p_motivo text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s public.sessoes; r public.compras_reposicao; v_old text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into r from public.compras_reposicao where id = p_id;
  if r.id is null then raise exception 'compra_nao_encontrada'; end if;
  v_old := r.status_compra;
  update public.compras_reposicao set
    cancelado = true,
    status_compra = 'Cancelado',
    cancelado_por = s.nome,
    data_cancelamento = now(),
    motivo_cancelamento = nullif(btrim(p_motivo),''),
    ultima_acao_por = s.nome, ultima_acao_em = now()
   where id = p_id returning * into r;
  perform public._handover_audit('Cancelado','Compras_Reposicao', r.id, s,
    'Status_Compra', v_old, 'Cancelado',
    'Cancelado' || coalesce(' — ' || nullif(btrim(p_motivo),''), ''));
  return jsonb_build_object('success', true, 'removedId', r.id);
end $$;

-- ============================ GRANTS ============================
-- 1) Lock table from direct anon/authenticated access.
revoke all on public.compras_reposicao from anon, authenticated;

-- 2) Revoke the DEFAULT PUBLIC execute on every function created here.
revoke all on function public._compras_reposicao_to_json(public.compras_reposicao)        from public;
revoke all on function public.handover_compra_reposicao_criar(uuid,jsonb)                  from public;
revoke all on function public.handover_compra_reposicao_comprar(uuid,uuid)                 from public;
revoke all on function public.handover_compra_reposicao_cancelar(uuid,uuid,text)           from public;

-- 3) Grant EXECUTE to anon ONLY on the public-facing RPCs.
--    The _compras_reposicao_to_json helper stays internal (no anon grant).
grant execute on function public.handover_compra_reposicao_criar(uuid,jsonb)        to anon;
grant execute on function public.handover_compra_reposicao_comprar(uuid,uuid)       to anon;
grant execute on function public.handover_compra_reposicao_cancelar(uuid,uuid,text) to anon;
