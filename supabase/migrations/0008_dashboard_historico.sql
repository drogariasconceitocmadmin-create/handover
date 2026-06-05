-- Handover v2 — Migration 0008: Dashboard bundle + Histórico + Reabrir
--
-- Conventions (see SPEC §1, §2, §5 and migrations 0001/0003):
--   * SECURITY DEFINER + set search_path = public, extensions.
--   * Every public RPC takes p_token uuid first and validates it via the
--     INTERNAL helper public.handover_check_session (never anon-callable).
--   * Tables already have RLS enabled with NO policies (anon never reads direct).
--   * Default PUBLIC execute is revoked; only the 3 public RPCs are granted to anon.
--   * Return jsonb built with PascalCase keys identical to the legacy sheet headers.
--   * Reuses the per-domain helpers _medicamento_to_json / _compras_reposicao_to_json
--     and the audit helper _handover_audit defined in migrations 0004/0005.
--   * For 'geral' (Pendências) there is no shared helper, so a local
--     _pendencia_to_json is defined here (SPEC §2 PascalCase shape + Origem).
--   * Idempotent: create or replace / if not exists; safe to re-apply.

-- ============================================================================
-- Helper: Pendências (aba Geral) -> PascalCase jsonb (no shared helper exists)
-- ============================================================================
create or replace function public._pendencia_to_json(p public.pendencias)
returns jsonb language sql immutable set search_path = public, extensions as $$
  select jsonb_build_object(
    'ID',                 p.id,
    'Origem',             'Geral',
    'Timestamp',          case when p.criado_em is null then null
                            else to_char(p.criado_em at time zone 'America/Sao_Paulo',
                                         'YYYY-MM-DD"T"HH24:MI:SS') end,
    'Autor',              p.autor,
    'Titulo',             p.titulo,
    'Descricao',          p.descricao,
    'Urgencia',           p.urgencia,
    'Resolvido',          p.resolvido,
    'Resolvido_Por',      p.resolvido_por,
    'Data_Resolucao',     case when p.data_resolucao is null then null
                            else to_char(p.data_resolucao at time zone 'America/Sao_Paulo',
                                         'YYYY-MM-DD"T"HH24:MI:SS') end,
    'Ultima_Acao_Por',    p.ultima_acao_por,
    'Ultima_Acao_Em',     case when p.ultima_acao_em is null then null
                            else to_char(p.ultima_acao_em at time zone 'America/Sao_Paulo',
                                         'YYYY-MM-DD"T"HH24:MI:SS') end,
    'Tem_Vencimento',     p.tem_vencimento,
    'Data_Vencimento',    case when p.data_vencimento is null then null
                            else to_char(p.data_vencimento, 'YYYY-MM-DD') end,
    'Hora_Vencimento',    p.hora_vencimento,
    'Reaberto_De',        p.reaberto_de,
    'Excluido',           p.excluido,
    'Excluido_Por',       p.excluido_por,
    'Excluido_Por_Perfil',p.excluido_por_perfil,
    'Data_Exclusao',      case when p.data_exclusao is null then null
                            else to_char(p.data_exclusao at time zone 'America/Sao_Paulo',
                                         'YYYY-MM-DD"T"HH24:MI:SS') end,
    'Motivo_Exclusao',    p.motivo_exclusao
  )
$$;

-- ============================================================================
-- Helper: turno padrão a partir da hora local de São Paulo
--   Manhã: 07:00–13:59 ; senão Noite (SPEC §5, 0008)
-- ============================================================================
create or replace function public._handover_turno_atual()
returns text language sql stable set search_path = public, extensions as $$
  select case
    when extract(hour from (now() at time zone 'America/Sao_Paulo')) between 7 and 13
      then 'Manhã'
    else 'Noite'
  end
$$;

-- ============================================================================
-- RPC: handover_dashboard_bundle(p_token, p_turno)
--   geral             = pendências ativas (não resolvidas, não excluídas)
--   medicamentos      = ativos: status <> 'Cancelado' and entregue = false
--   comprasReposicao  = ativos: status_compra not in ('Comprado','Cancelado')
--                       e não excluídos
--   checklistTurno    = reusa handover_checklist_gerar(p_token, turno)
--   bundleTurno       = turno efetivo (param ou default por hora local)
-- ============================================================================
create or replace function public.handover_dashboard_bundle(
  p_token uuid, p_turno text default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  v_turno text;
  v_geral jsonb;
  v_meds jsonb;
  v_compras jsonb;
  v_checklist jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  v_turno := coalesce(nullif(btrim(coalesce(p_turno,'')),''), public._handover_turno_atual());

  -- Geral: pendências ativas
  select coalesce(jsonb_agg(public._pendencia_to_json(p)
                            order by p.criado_em desc), '[]'::jsonb)
    into v_geral
    from public.pendencias p
   where p.excluido = false and p.resolvido = false;

  -- Medicamentos ativos: != Cancelado e não Entregue
  select coalesce(jsonb_agg(public._medicamento_to_json(m)
                            order by m.criado_em desc), '[]'::jsonb)
    into v_meds
    from public.medicamentos m
   where coalesce(m.status,'') <> 'Cancelado'
     and coalesce(m.entregue, false) = false;

  -- Compras de reposição ativas: status_compra ativo, não excluído
  select coalesce(jsonb_agg(public._compras_reposicao_to_json(c)
                            order by c.data_solicitacao desc), '[]'::jsonb)
    into v_compras
    from public.compras_reposicao c
   where coalesce(c.status_compra,'') not in ('Comprado','Cancelado')
     and coalesce(c.excluido, false) = false;

  -- Checklist do turno (reusa a RPC dedicada de 0007)
  v_checklist := (public.handover_checklist_gerar(p_token, v_turno)) -> 'checklistTurno';

  return jsonb_build_object(
    'geral',            v_geral,
    'medicamentos',     v_meds,
    'comprasReposicao', v_compras,
    'checklistTurno',   coalesce(v_checklist, 'null'::jsonb),
    'bundleTurno',      v_turno
  );
end $$;

-- ============================================================================
-- RPC: handover_historico(p_token, p_limit)
--   União de itens fechados:
--     * pendências resolvidas               -> Estado_Arquivo conforme reaberto_de
--     * medicamentos Entregue/Cancelado     -> Estado_Arquivo = status
--     * compras_reposicao Comprado/Cancelado-> Estado_Arquivo = status_compra
--   Cada item carrega Origem e Estado_Arquivo. Ordena por fechamento desc.
-- ============================================================================
create or replace function public.handover_historico(
  p_token uuid, p_limit integer default 200)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  v_limit integer;
  v_hist jsonb;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  v_limit := greatest(1, least(coalesce(p_limit, 200), 1000));

  with unidos as (
    -- Geral resolvidas
    select
      public._pendencia_to_json(p)
        || jsonb_build_object(
             'Estado_Arquivo',
             case when p.reaberto_de is not null then 'Reaberto' else 'Resolvido' end)
        as item,
      coalesce(p.data_resolucao, p.ultima_acao_em, p.criado_em) as fechado_em
    from public.pendencias p
    where p.excluido = false and p.resolvido = true

    union all
    -- Medicamentos Entregue/Cancelado
    select
      public._medicamento_to_json(m)
        || jsonb_build_object('Estado_Arquivo', m.status) as item,
      coalesce(m.ultima_acao_em, m.criado_em) as fechado_em
    from public.medicamentos m
    where m.status in ('Entregue','Cancelado')

    union all
    -- Compras Comprado/Cancelado
    select
      public._compras_reposicao_to_json(c)
        || jsonb_build_object('Estado_Arquivo', c.status_compra) as item,
      coalesce(c.ultima_acao_em, c.data_compra, c.data_cancelamento,
               c.data_solicitacao) as fechado_em
    from public.compras_reposicao c
    where coalesce(c.excluido, false) = false
      and c.status_compra in ('Comprado','Cancelado')
  )
  select coalesce(jsonb_agg(item order by fechado_em desc nulls last), '[]'::jsonb)
    into v_hist
    from (
      select item, fechado_em from unidos
      order by fechado_em desc nulls last
      limit v_limit
    ) lim;

  return jsonb_build_object('success', true, 'historico', v_hist);
end $$;

-- ============================================================================
-- RPC: handover_historico_reabrir(p_token, p_id, p_motivo)
--   Geral        -> cria NOVA linha com reaberto_de = id original (resolvida=false)
--   Medicamento  -> volta a 'Pendente' (comprado/entregue = false)
--   Compra       -> volta a 'Pendente de compra'
--   Audita em todos os casos.
-- ============================================================================
create or replace function public.handover_historico_reabrir(
  p_token uuid, p_id uuid, p_motivo text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  s        public.sessoes;
  v_pend   public.pendencias;
  v_new    public.pendencias;
  v_med    public.medicamentos;
  v_compra public.compras_reposicao;
  v_resumo text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  v_resumo := 'Reaberto via histórico'
              || coalesce(': ' || nullif(btrim(coalesce(p_motivo,'')),''), '');

  -- ----- Geral -----
  select * into v_pend from public.pendencias where id = p_id;
  if found then
    insert into public.pendencias (
      criado_em, autor, titulo, descricao, urgencia,
      resolvido, tem_vencimento, data_vencimento, hora_vencimento,
      reaberto_de, ultima_acao_por, ultima_acao_em)
    values (
      now(), s.nome, v_pend.titulo, v_pend.descricao,
      coalesce(v_pend.urgencia,'Normal'),
      false, coalesce(v_pend.tem_vencimento,false),
      v_pend.data_vencimento, v_pend.hora_vencimento,
      v_pend.id, s.nome, now())
    returning * into v_new;

    perform public._handover_audit(
      'Reaberto', 'Geral', v_new.id, s,
      'Estado_Arquivo', 'Resolvido', 'Reaberto', v_resumo);

    return jsonb_build_object(
      'success', true, 'tipo', 'Geral',
      'record', public._pendencia_to_json(v_new));
  end if;

  -- ----- Medicamento -----
  select * into v_med from public.medicamentos where id = p_id;
  if found then
    update public.medicamentos set
      status = 'Pendente', comprado = false, entregue = false,
      ultima_acao_por = s.nome, ultima_acao_em = now()
    where id = p_id
    returning * into v_med;

    perform public._handover_audit(
      'Reaberto', 'Medicamentos', v_med.id, s,
      'Status', null, 'Pendente', v_resumo);

    return jsonb_build_object(
      'success', true, 'tipo', 'Medicamentos',
      'record', public._medicamento_to_json(v_med));
  end if;

  -- ----- Compra de reposição -----
  select * into v_compra from public.compras_reposicao where id = p_id;
  if found then
    update public.compras_reposicao set
      status_compra = 'Pendente de compra', comprado = false, cancelado = false,
      ultima_acao_por = s.nome, ultima_acao_em = now()
    where id = p_id
    returning * into v_compra;

    perform public._handover_audit(
      'Reaberto', 'ComprasReposicao', v_compra.id, s,
      'Status_Compra', null, 'Pendente de compra', v_resumo);

    return jsonb_build_object(
      'success', true, 'tipo', 'ComprasReposicao',
      'record', public._compras_reposicao_to_json(v_compra));
  end if;

  raise exception 'item_nao_encontrado';
end $$;

-- ============================================================================
-- GRANTS
-- ============================================================================
-- Internal helpers: revoke default PUBLIC, no anon grant.
revoke all on function public._pendencia_to_json(public.pendencias) from public;
revoke all on function public._handover_turno_atual()               from public;

-- Public RPCs: revoke default PUBLIC, grant execute to anon (and only these).
revoke all on function public.handover_dashboard_bundle(uuid, text)        from public;
revoke all on function public.handover_historico(uuid, integer)            from public;
revoke all on function public.handover_historico_reabrir(uuid, uuid, text) from public;

grant execute on function public.handover_dashboard_bundle(uuid, text)        to anon;
grant execute on function public.handover_historico(uuid, integer)            to anon;
grant execute on function public.handover_historico_reabrir(uuid, uuid, text) to anon;
