-- Handover v2 — Migration 0004: Medicamentos + Auditoria
--
-- Security model (same as 0001/0002/0003):
--   * Tables have RLS enabled with NO policies → anon key can never read/write.
--   * All access goes through SECURITY DEFINER functions that validate a session
--     token via public.handover_check_session (internal, not anon-callable).
--   * Default PUBLIC execute on every function is revoked; only the 9 public
--     medicamento/auditoria RPCs are granted to anon. `_`-helpers get no grant.
--   * search_path = public, extensions (extensions needed for pgcrypto, ver 0003).
-- All statements are idempotent (create or replace / if not exists).

-- ============================ AUDITORIA (§4) ============================
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
create index if not exists auditoria_item_idx
  on public.auditoria (id_item, data_hora);

-- ============================ MEDICAMENTOS (§4) ============================
create table if not exists public.medicamentos (
  id                          uuid primary key default gen_random_uuid(),
  criado_em                   timestamptz not null default now(),   -- = Timestamp
  tipo                        text,
  medicamento                 text,
  pre_pago                    boolean not null default false,
  cliente                     text,
  atendente                   text,
  previsao_entrega            date,
  comprado                    boolean not null default false,
  entregue                    boolean not null default false,
  telefone                    text,
  status                      text not null default 'Pendente',
  status_aviso_whatsapp       text,
  data_aviso_whatsapp         timestamptz,
  preco_venda                 numeric(10,2),
  ultima_acao_por             text,
  ultima_acao_em              timestamptz,
  revertido_por               text,
  data_reversao               timestamptz,
  status_anterior             text,
  motivo_reversao             text,
  cancelado_por               text,
  data_cancelamento           timestamptz,
  motivo_cancelamento         text,
  fornecedor_compra           text,
  codigo_compra_fornecedor    text,
  forma_recebimento           text,
  observacao_solicitacao      text,
  mensagem_cliente            text,
  observacao_compra           text,
  pedido_id                   uuid,
  item_indice                 int,
  total_itens                 int,
  quantidade_item             text,
  observacao_item             text
);
alter table public.medicamentos enable row level security;   -- no policies => locked to anon
create index if not exists medicamentos_listagem_idx
  on public.medicamentos (status, criado_em desc);
create index if not exists medicamentos_pedido_idx
  on public.medicamentos (pedido_id);

-- ============================ HELPERS ============================

-- Auditoria helper (§4). Internal, no grant.
create or replace function public._handover_audit(
  p_acao text, p_origem text, p_id_item uuid, p_sess public.sessoes,
  p_campo text, p_anterior text, p_novo text, p_resumo text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.auditoria
    (acao, origem, id_item, usuario, nome, perfil, campo, valor_anterior, valor_novo, resumo)
  values
    (p_acao, p_origem, p_id_item, p_sess.usuario, p_sess.nome, p_sess.perfil,
     p_campo, p_anterior, p_novo, p_resumo);
end $$;

-- Status state machine (§3). Internal, no grant.
create or replace function public._medicamento_sync_status(
  p_comprado boolean, p_entregue boolean, p_status_atual text)
returns text language sql immutable set search_path = public, extensions as $$
  select case
    when coalesce(p_status_atual,'') = 'Cancelado'
         and not coalesce(p_comprado,false) and not coalesce(p_entregue,false)
      then 'Cancelado'
    when coalesce(p_entregue,false) then 'Entregue'
    when coalesce(p_comprado,false) then 'Comprado'
    else 'Pendente'
  end
$$;

-- Row → PascalCase JSON (§2). Internal, no grant.
create or replace function public._medicamento_to_json(r public.medicamentos)
returns jsonb language sql stable set search_path = public, extensions as $$
  select jsonb_build_object(
    'ID',                      r.id,
    'Origem',                  'Medicamentos',
    'Timestamp',               to_char(r.criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Tipo',                    r.tipo,
    'Medicamento',             r.medicamento,
    'Pre_Pago',                coalesce(r.pre_pago, false),
    'Cliente',                 r.cliente,
    'Atendente',               r.atendente,
    'Previsao_Entrega',        to_char(r.previsao_entrega, 'YYYY-MM-DD'),
    'Comprado',                coalesce(r.comprado, false),
    'Entregue',                coalesce(r.entregue, false),
    'Telefone',                r.telefone,
    'Status',                  r.status,
    'Status_Aviso_WhatsApp',   r.status_aviso_whatsapp,
    'Data_Aviso_WhatsApp',     to_char(r.data_aviso_whatsapp at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Preco_Venda',             r.preco_venda,
    'Ultima_Acao_Por',         r.ultima_acao_por,
    'Ultima_Acao_Em',          to_char(r.ultima_acao_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Revertido_Por',           r.revertido_por,
    'Data_Reversao',           to_char(r.data_reversao at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Status_Anterior',         r.status_anterior,
    'Motivo_Reversao',         r.motivo_reversao,
    'Cancelado_Por',           r.cancelado_por,
    'Data_Cancelamento',       to_char(r.data_cancelamento at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'Motivo_Cancelamento',     r.motivo_cancelamento,
    'Fornecedor_Compra',       r.fornecedor_compra,
    'Codigo_Compra_Fornecedor',r.codigo_compra_fornecedor,
    'Forma_Recebimento',       r.forma_recebimento,
    'Observacao_Solicitacao',  r.observacao_solicitacao,
    'Mensagem_Cliente',        r.mensagem_cliente,
    'Observacao_Compra',       r.observacao_compra,
    'Pedido_ID',               r.pedido_id,
    'Item_Indice',             r.item_indice,
    'Total_Itens',             r.total_itens,
    'Quantidade_Item',         r.quantidade_item,
    'Observacao_Item',         r.observacao_item
  )
$$;

-- Telefone normalization BR (§7): só dígitos, prefixo 55, 12–13 dígitos. Internal.
create or replace function public._normalize_br_phone(p_phone text)
returns text language plpgsql immutable set search_path = public, extensions as $$
declare d text;
begin
  d := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  if d = '' then return ''; end if;
  -- strip a leading 0 (long-distance carrier prefix leftover)
  if length(d) > 11 and left(d,1) = '0' then d := substr(d,2); end if;
  if left(d,2) <> '55' then d := '55' || d; end if;
  if length(d) < 12 or length(d) > 13 then
    return d;  -- caller may still build a url; return best effort
  end if;
  return d;
end $$;

-- WhatsApp client message (§7): saudação + variação por Forma_Recebimento. Internal.
create or replace function public._medicamento_whatsapp_msg(r public.medicamentos)
returns text language plpgsql stable set search_path = public, extensions as $$
declare
  v_nome text := coalesce(nullif(btrim(r.cliente),''), 'cliente');
  v_med  text := coalesce(nullif(btrim(r.medicamento),''), 'seu medicamento');
  v_forma text := coalesce(r.forma_recebimento, '');
  v_msg text;
begin
  v_msg := 'Olá, ' || v_nome || '!' || E'\n\n';
  v_msg := v_msg || 'Passando para avisar que ' || v_med
                 || ' já está disponível em nossa farmácia. ';
  if v_forma = 'Retira na loja' then
    v_msg := v_msg || 'Você pode retirar na loja quando for melhor para você. '
                   || 'Estamos à disposição!';
  elsif v_forma = 'Entregar no endereço cadastrado' then
    v_msg := v_msg || 'Vamos providenciar a entrega no endereço cadastrado. '
                   || 'Qualquer dúvida, estamos à disposição!';
  else
    -- 'A combinar' ou não informado
    v_msg := v_msg || 'Como prefere receber? Podemos combinar a retirada na loja '
                   || 'ou a entrega no seu endereço. Estamos à disposição!';
  end if;
  return v_msg;
end $$;

-- Mensagem "Não encontrado" ao cliente (§7). Internal.
create or replace function public._medicamento_msg_nao_encontrado(r public.medicamentos)
returns text language plpgsql stable set search_path = public, extensions as $$
declare
  v_nome text := coalesce(nullif(btrim(r.cliente),''), 'cliente');
  v_med  text := coalesce(nullif(btrim(r.medicamento),''), 'o medicamento solicitado');
  v_msg text;
begin
  v_msg := 'Olá, ' || v_nome || '! Infelizmente ' || v_med
        || ' está indisponível com nossos fornecedores no momento.'
        || E'\n\n';
  v_msg := v_msg || 'Podemos verificar uma alternativa equivalente que atenda à mesma '
        || 'necessidade, sempre com orientação do farmacêutico.'
        || E'\n\n';
  v_msg := v_msg || 'Você gostaria que buscássemos essa alternativa para você?';
  return v_msg;
end $$;

-- ============================ RPCs (público §5 / bloco 0004) ============================

-- handover_medicamento_criar — multi-item via p_payload.itens (Falta vs Encomenda)
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

    perform public._handover_audit('Criado', 'Medicamentos', r.id, s,
      null, null, null,
      'Item criado: ' || coalesce(r.medicamento,'') || ' (' || r.tipo || ')');

    v_records := v_records || public._medicamento_to_json(r);
  end loop;

  if v_total = 1 then
    return jsonb_build_object('success', true, 'record', v_records->0);
  end if;
  return jsonb_build_object('success', true, 'records', v_records);
end $$;

-- handover_medicamento_comprar
create or replace function public.handover_medicamento_comprar(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s public.sessoes; r public.medicamentos; v_old text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into r from public.medicamentos where id = p_id;
  if r.id is null then raise exception 'medicamento_nao_encontrado'; end if;
  v_old := r.status;
  update public.medicamentos set
    comprado = true,
    status = public._medicamento_sync_status(true, r.entregue, r.status),
    ultima_acao_por = s.nome, ultima_acao_em = now()
   where id = p_id returning * into r;
  perform public._handover_audit('Comprado','Medicamentos', r.id, s,
    'Status', v_old, r.status, 'Marcado como comprado');
  return jsonb_build_object('success', true, 'record', public._medicamento_to_json(r));
end $$;

-- handover_medicamento_entregar
create or replace function public.handover_medicamento_entregar(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s public.sessoes; r public.medicamentos; v_old text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into r from public.medicamentos where id = p_id;
  if r.id is null then raise exception 'medicamento_nao_encontrado'; end if;
  v_old := r.status;
  update public.medicamentos set
    comprado = true, entregue = true,
    status = public._medicamento_sync_status(true, true, r.status),
    ultima_acao_por = s.nome, ultima_acao_em = now()
   where id = p_id returning * into r;
  perform public._handover_audit('Entregue','Medicamentos', r.id, s,
    'Status', v_old, r.status, 'Marcado como entregue');
  return jsonb_build_object('success', true, 'record', public._medicamento_to_json(r));
end $$;

-- handover_medicamento_reverter
create or replace function public.handover_medicamento_reverter(p_token uuid, p_id uuid, p_motivo text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s public.sessoes; r public.medicamentos; v_old text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into r from public.medicamentos where id = p_id;
  if r.id is null then raise exception 'medicamento_nao_encontrado'; end if;
  v_old := r.status;
  update public.medicamentos set
    comprado = false, entregue = false,
    status = public._medicamento_sync_status(false, false, null),
    revertido_por = s.nome, data_reversao = now(),
    status_anterior = v_old, motivo_reversao = nullif(btrim(p_motivo),''),
    ultima_acao_por = s.nome, ultima_acao_em = now()
   where id = p_id returning * into r;
  perform public._handover_audit('Revertido','Medicamentos', r.id, s,
    'Status', v_old, r.status,
    'Revertido para Pendente' || coalesce(' — ' || nullif(btrim(p_motivo),''), ''));
  return jsonb_build_object('success', true, 'record', public._medicamento_to_json(r));
end $$;

-- handover_medicamento_cancelar (sai da fila → removedId)
create or replace function public.handover_medicamento_cancelar(p_token uuid, p_id uuid, p_motivo text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s public.sessoes; r public.medicamentos; v_old text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into r from public.medicamentos where id = p_id;
  if r.id is null then raise exception 'medicamento_nao_encontrado'; end if;
  v_old := r.status;
  update public.medicamentos set
    status = 'Cancelado',
    cancelado_por = s.nome, data_cancelamento = now(),
    motivo_cancelamento = nullif(btrim(p_motivo),''),
    ultima_acao_por = s.nome, ultima_acao_em = now()
   where id = p_id returning * into r;
  perform public._handover_audit('Cancelado','Medicamentos', r.id, s,
    'Status', v_old, 'Cancelado',
    'Cancelado' || coalesce(' — ' || nullif(btrim(p_motivo),''), ''));
  return jsonb_build_object('success', true, 'removedId', r.id);
end $$;

-- handover_medicamento_whatsapp
create or replace function public.handover_medicamento_whatsapp(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes; r public.medicamentos;
  v_fone text; v_msg text; v_url text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select * into r from public.medicamentos where id = p_id;
  if r.id is null then raise exception 'medicamento_nao_encontrado'; end if;

  if r.status not in ('Comprado','Entregue') and not coalesce(r.comprado,false) then
    raise exception 'Aviso disponível apenas para itens comprados/entregues.';
  end if;

  v_fone := public._normalize_br_phone(r.telefone);
  v_msg  := public._medicamento_whatsapp_msg(r);
  v_url  := 'https://wa.me/' || v_fone || '?text=' || public.url_encode(v_msg);

  update public.medicamentos set
    status_aviso_whatsapp = 'Tentativa registrada',
    data_aviso_whatsapp = now(),
    ultima_acao_por = s.nome, ultima_acao_em = now()
   where id = p_id returning * into r;

  perform public._handover_audit('Aviso WhatsApp','Medicamentos', r.id, s,
    'Status_Aviso_WhatsApp', null, 'Tentativa registrada', 'Aviso de WhatsApp registrado');

  return jsonb_build_object('success', true, 'whatsAppUrl', v_url,
    'record', public._medicamento_to_json(r));
end $$;

-- handover_item_editar (Geral + Medicamentos; patch de campos editáveis; audita campo a campo)
create or replace function public.handover_item_editar(
  p_token uuid, p_id uuid, p_origem text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  v_origem text := btrim(coalesce(p_origem,''));
  v_key text;
  v_new text;
  v_old text;
  rp public.pendencias;
  rm public.medicamentos;
  v_result jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  if v_origem = 'Geral' then
    select * into rp from public.pendencias where id = p_id and excluido = false;
    if rp.id is null then raise exception 'pendencia_nao_encontrada'; end if;

    -- campos editáveis em Geral
    if p_payload ? 'titulo' then
      v_new := nullif(btrim(p_payload->>'titulo'),''); v_old := rp.titulo;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.pendencias set titulo = v_new where id = p_id;
        perform public._handover_audit('Editado','Geral', p_id, s, 'Titulo', v_old, v_new, 'Campo editado: Titulo');
      end if;
    end if;
    if p_payload ? 'descricao' then
      v_new := p_payload->>'descricao'; v_old := rp.descricao;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.pendencias set descricao = v_new where id = p_id;
        perform public._handover_audit('Editado','Geral', p_id, s, 'Descricao', v_old, v_new, 'Campo editado: Descricao');
      end if;
    end if;
    if p_payload ? 'urgencia' then
      v_new := nullif(btrim(p_payload->>'urgencia'),''); v_old := rp.urgencia;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.pendencias set urgencia = coalesce(v_new,'Normal') where id = p_id;
        perform public._handover_audit('Editado','Geral', p_id, s, 'Urgencia', v_old, v_new, 'Campo editado: Urgencia');
      end if;
    end if;
    if p_payload ? 'dataVencimento' then
      v_new := nullif(btrim(p_payload->>'dataVencimento'),''); v_old := to_char(rp.data_vencimento,'YYYY-MM-DD');
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.pendencias set data_vencimento = v_new::date,
          tem_vencimento = (v_new is not null) where id = p_id;
        perform public._handover_audit('Editado','Geral', p_id, s, 'Data_Vencimento', v_old, v_new, 'Campo editado: Data_Vencimento');
      end if;
    end if;
    if p_payload ? 'horaVencimento' then
      v_new := nullif(btrim(p_payload->>'horaVencimento'),''); v_old := rp.hora_vencimento;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.pendencias set hora_vencimento = v_new where id = p_id;
        perform public._handover_audit('Editado','Geral', p_id, s, 'Hora_Vencimento', v_old, v_new, 'Campo editado: Hora_Vencimento');
      end if;
    end if;

    update public.pendencias set ultima_acao_por = s.nome, ultima_acao_em = now()
      where id = p_id returning * into rp;
    v_result := to_jsonb(rp);

  elsif v_origem = 'Medicamentos' then
    select * into rm from public.medicamentos where id = p_id;
    if rm.id is null then raise exception 'medicamento_nao_encontrado'; end if;

    if p_payload ? 'medicamento' then
      v_new := nullif(btrim(p_payload->>'medicamento'),''); v_old := rm.medicamento;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set medicamento = v_new where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Medicamento', v_old, v_new, 'Campo editado: Medicamento');
      end if;
    end if;
    if p_payload ? 'cliente' then
      v_new := nullif(btrim(p_payload->>'cliente'),''); v_old := rm.cliente;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set cliente = v_new where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Cliente', v_old, v_new, 'Campo editado: Cliente');
      end if;
    end if;
    if p_payload ? 'atendente' then
      v_new := nullif(btrim(p_payload->>'atendente'),''); v_old := rm.atendente;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set atendente = v_new where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Atendente', v_old, v_new, 'Campo editado: Atendente');
      end if;
    end if;
    if p_payload ? 'telefone' then
      v_new := nullif(btrim(p_payload->>'telefone'),''); v_old := rm.telefone;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set telefone = v_new where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Telefone', v_old, v_new, 'Campo editado: Telefone');
      end if;
    end if;
    if p_payload ? 'prePago' then
      v_new := (p_payload->>'prePago'); v_old := lower(coalesce(rm.pre_pago,false)::text);
      if lower(coalesce(v_new,'')) <> coalesce(v_old,'') then
        update public.medicamentos set pre_pago = (v_new)::boolean where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Pre_Pago', v_old, lower(v_new), 'Campo editado: Pre_Pago');
      end if;
    end if;
    if p_payload ? 'previsaoEntrega' then
      v_new := nullif(btrim(p_payload->>'previsaoEntrega'),''); v_old := to_char(rm.previsao_entrega,'YYYY-MM-DD');
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set previsao_entrega = v_new::date where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Previsao_Entrega', v_old, v_new, 'Campo editado: Previsao_Entrega');
      end if;
    end if;
    if p_payload ? 'precoVenda' then
      v_new := nullif(btrim(p_payload->>'precoVenda'),''); v_old := rm.preco_venda::text;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set preco_venda = v_new::numeric where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Preco_Venda', v_old, v_new, 'Campo editado: Preco_Venda');
      end if;
    end if;
    if p_payload ? 'formaRecebimento' then
      v_new := nullif(btrim(p_payload->>'formaRecebimento'),''); v_old := rm.forma_recebimento;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set forma_recebimento = v_new where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Forma_Recebimento', v_old, v_new, 'Campo editado: Forma_Recebimento');
      end if;
    end if;
    if p_payload ? 'fornecedorCompra' then
      v_new := nullif(btrim(p_payload->>'fornecedorCompra'),''); v_old := rm.fornecedor_compra;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set fornecedor_compra = v_new where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Fornecedor_Compra', v_old, v_new, 'Campo editado: Fornecedor_Compra');
      end if;
    end if;
    if p_payload ? 'codigoCompraFornecedor' then
      v_new := nullif(btrim(p_payload->>'codigoCompraFornecedor'),''); v_old := rm.codigo_compra_fornecedor;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set codigo_compra_fornecedor = v_new where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Codigo_Compra_Fornecedor', v_old, v_new, 'Campo editado: Codigo_Compra_Fornecedor');
      end if;
    end if;
    if p_payload ? 'observacaoSolicitacao' then
      v_new := p_payload->>'observacaoSolicitacao'; v_old := rm.observacao_solicitacao;
      if coalesce(v_new,'') <> coalesce(v_old,'') then
        update public.medicamentos set observacao_solicitacao = nullif(v_new,'') where id = p_id;
        perform public._handover_audit('Editado','Medicamentos', p_id, s, 'Observacao_Solicitacao', v_old, v_new, 'Campo editado: Observacao_Solicitacao');
      end if;
    end if;

    update public.medicamentos set ultima_acao_por = s.nome, ultima_acao_em = now()
      where id = p_id returning * into rm;
    v_result := public._medicamento_to_json(rm);

  else
    raise exception 'origem_invalida';
  end if;

  return jsonb_build_object('success', true, 'itemAtualizado', v_result);
end $$;

-- handover_audit_trail
create or replace function public.handover_audit_trail(p_token uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s public.sessoes; v_list jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  select coalesce(jsonb_agg(j order by ord desc), '[]'::jsonb) into v_list
  from (
    select a.data_hora as ord,
      jsonb_build_object(
        'ID_Auditoria',   a.id_auditoria,
        'Data_Hora',      to_char(a.data_hora at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS'),
        'Acao',           a.acao,
        'Campo',          a.campo,
        'Valor_Anterior', a.valor_anterior,
        'Valor_Novo',     a.valor_novo,
        'Resumo',         a.resumo,
        'Nome',           a.nome,
        'Usuario',        a.usuario
      ) as j
    from public.auditoria a
    where a.id_item = p_id
  ) t;
  return jsonb_build_object('success', true, 'auditoria', v_list);
end $$;

-- ============================ url_encode helper ============================
-- Minimal RFC3986-ish encoder for the WhatsApp text param (espaços, quebras, etc.).
create or replace function public.url_encode(p_text text)
returns text language plpgsql immutable set search_path = public, extensions as $$
declare
  v_in bytea := convert_to(coalesce(p_text,''), 'UTF8');
  v_out text := '';
  v_byte int;
  v_char text;
  i int;
begin
  for i in 0 .. length(v_in) - 1 loop
    v_byte := get_byte(v_in, i);
    v_char := chr(v_byte);
    if v_char ~ '[A-Za-z0-9_.~-]' then
      v_out := v_out || v_char;
    else
      v_out := v_out || '%' || upper(lpad(to_hex(v_byte), 2, '0'));
    end if;
  end loop;
  return v_out;
end $$;

-- ============================ GRANTS ============================
-- 1) Lock tables from direct anon/authenticated access.
revoke all on public.medicamentos from anon, authenticated;
revoke all on public.auditoria    from anon, authenticated;

-- 2) Revoke the DEFAULT PUBLIC execute on every function created here.
revoke all on function public._handover_audit(text,text,uuid,public.sessoes,text,text,text,text) from public;
revoke all on function public._medicamento_sync_status(boolean,boolean,text)        from public;
revoke all on function public._medicamento_to_json(public.medicamentos)             from public;
revoke all on function public._normalize_br_phone(text)                             from public;
revoke all on function public._medicamento_whatsapp_msg(public.medicamentos)        from public;
revoke all on function public._medicamento_msg_nao_encontrado(public.medicamentos)  from public;
revoke all on function public.url_encode(text)                                      from public;
revoke all on function public.handover_medicamento_criar(uuid,jsonb)                from public;
revoke all on function public.handover_medicamento_comprar(uuid,uuid)               from public;
revoke all on function public.handover_medicamento_entregar(uuid,uuid)              from public;
revoke all on function public.handover_medicamento_reverter(uuid,uuid,text)         from public;
revoke all on function public.handover_medicamento_cancelar(uuid,uuid,text)         from public;
revoke all on function public.handover_medicamento_whatsapp(uuid,uuid)              from public;
revoke all on function public.handover_item_editar(uuid,uuid,text,jsonb)            from public;
revoke all on function public.handover_audit_trail(uuid,uuid)                       from public;

-- 3) Grant EXECUTE to anon ONLY on the public-facing RPCs.
--    Helpers (_*, url_encode) stay internal (no anon grant).
grant execute on function public.handover_medicamento_criar(uuid,jsonb)         to anon;
grant execute on function public.handover_medicamento_comprar(uuid,uuid)        to anon;
grant execute on function public.handover_medicamento_entregar(uuid,uuid)       to anon;
grant execute on function public.handover_medicamento_reverter(uuid,uuid,text)  to anon;
grant execute on function public.handover_medicamento_cancelar(uuid,uuid,text)  to anon;
grant execute on function public.handover_medicamento_whatsapp(uuid,uuid)       to anon;
grant execute on function public.handover_item_editar(uuid,uuid,text,jsonb)     to anon;
grant execute on function public.handover_audit_trail(uuid,uuid)                to anon;
