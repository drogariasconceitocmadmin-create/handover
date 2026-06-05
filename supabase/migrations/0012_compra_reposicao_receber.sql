-- Handover v2 — Migration 0012: estado "Recebido na loja" para compras de reposição
--
-- Introduz a transição final da máquina de status de compras_reposicao:
--   Pendente de compra → Comprado → Recebido na loja
-- Antes desta migration o dashboard escondia compras assim que viravam 'Comprado';
-- agora elas permanecem visíveis na fila ativa (aguardando recebimento físico) e só
-- saem quando marcadas como 'Recebido na loja' (ou 'Cancelado').
--
-- Conteúdo:
--   * RPC pública handover_compra_reposicao_receber(p_token, p_id) — marca recebido + audita.
--   * Atualiza handover_dashboard_bundle: filtro de compras passa a excluir
--     ('Recebido na loja','Cancelado') em vez de ('Comprado','Cancelado').
--
-- Convenções (ver 0008/SPEC §1): SECURITY DEFINER + set search_path = public, extensions;
-- p_token validado via handover_check_session; revoke PUBLIC + grant execute só nas RPCs
-- públicas; auditoria via _handover_audit. Idempotente (create or replace).

-- ── RPC: marcar compra de reposição como recebida na loja ──
create or replace function public.handover_compra_reposicao_receber(p_token uuid, p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  r public.compras_reposicao;
  v_old text;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  select * into r from public.compras_reposicao where id = p_id;
  if r.id is null then raise exception 'compra_nao_encontrada'; end if;
  if r.status_compra <> 'Comprado' then raise exception 'status_invalido'; end if;

  v_old := r.status_compra;
  update public.compras_reposicao set
    status_compra    = 'Recebido na loja',
    ultima_acao_por  = s.nome,
    ultima_acao_em   = now()
  where id = p_id returning * into r;

  perform public._handover_audit('Recebido na loja','Compras_Reposicao', r.id, s,
    'Status_Compra', v_old, r.status_compra, 'Item recebido na loja');

  return jsonb_build_object('success', true, 'record', public._compras_reposicao_to_json(r));
end;
$$;

-- ── Dashboard bundle: compras visíveis até serem Recebidas ou Canceladas ──
create or replace function public.handover_dashboard_bundle(p_token uuid, p_turno text default null)
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

  v_turno := coalesce(nullif(btrim(coalesce(p_turno,'')), ''), public._handover_turno_atual());

  -- Pendências ativas
  select coalesce(jsonb_agg(public._pendencia_to_json(p) order by p.criado_em desc), '[]'::jsonb)
    into v_geral
    from public.pendencias p
   where p.excluido = false and p.resolvido = false;

  -- Medicamentos ativos (exceto Cancelado e Entregue)
  select coalesce(jsonb_agg(public._medicamento_to_json(m) order by m.criado_em desc), '[]'::jsonb)
    into v_meds
    from public.medicamentos m
   where coalesce(m.status,'') <> 'Cancelado'
     and coalesce(m.entregue, false) = false;

  -- Compras de reposição: visíveis até serem Recebidas ou Canceladas
  select coalesce(jsonb_agg(public._compras_reposicao_to_json(c) order by c.data_solicitacao desc), '[]'::jsonb)
    into v_compras
    from public.compras_reposicao c
   where coalesce(c.status_compra,'') not in ('Recebido na loja','Cancelado')
     and coalesce(c.excluido, false) = false;

  -- Checklist do turno
  v_checklist := (public.handover_checklist_gerar(p_token, v_turno)) -> 'checklistTurno';

  return jsonb_build_object(
    'geral',            v_geral,
    'medicamentos',     v_meds,
    'comprasReposicao', v_compras,
    'checklistTurno',   coalesce(v_checklist, 'null'::jsonb),
    'bundleTurno',      v_turno
  );
end;
$$;

-- ── Grants ──
revoke all on function public.handover_compra_reposicao_receber(uuid, uuid) from public;
revoke all on function public.handover_dashboard_bundle(uuid, text)         from public;

grant execute on function public.handover_compra_reposicao_receber(uuid, uuid) to anon;
grant execute on function public.handover_dashboard_bundle(uuid, text)         to anon;
