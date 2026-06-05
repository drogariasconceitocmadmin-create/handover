-- Handover v2 — Migration 0014: consistência do estado de compras de reposição
--
-- A migration 0012 introduziu o estado 'Recebido na loja' e ajustou o dashboard para
-- manter itens 'Comprado' na fila ativa (aguardando recebimento). Mas duas pontas
-- ficaram inconsistentes:
--
--   1. handover_historico ainda arquivava compras com status_compra IN ('Comprado','Cancelado'),
--      fazendo os MESMOS itens 'Comprado' aparecerem na fila ativa E no histórico.
--      Correção: histórico passa a arquivar IN ('Recebido na loja','Cancelado').
--
--   2. 85 itens 'Comprado' vieram da importação legada (mai/2026, sem comprador/data) —
--      todos são FALTAS de estoque já compradas/recebidas há tempo, poluindo a aba
--      "Comprados · aguard. recebimento". Backfill: viram 'Recebido na loja' (saem da fila,
--      entram no histórico), com auditoria.
--
-- Nota de domínio: a tabela compras_reposicao contém SOMENTE faltas/reposição de estoque
-- (não há campo de cliente). Encomendas para cliente vivem em public.medicamentos e NÃO são
-- afetadas por esta migration.
--
-- Idempotente: o create or replace é seguro; o backfill não tem efeito numa 2ª execução
-- (não restam 'Comprado' legados).

-- ── 1. Histórico: compras arquivadas = Recebido na loja / Cancelado ──
create or replace function public.handover_historico(p_token uuid, p_limit integer default 200)
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
    -- Compras Recebido na loja/Cancelado (antes: Comprado/Cancelado)
    select
      public._compras_reposicao_to_json(c)
        || jsonb_build_object('Estado_Arquivo', c.status_compra) as item,
      coalesce(c.ultima_acao_em, c.data_compra, c.data_cancelamento,
               c.data_solicitacao) as fechado_em
    from public.compras_reposicao c
    where coalesce(c.excluido, false) = false
      and c.status_compra in ('Recebido na loja','Cancelado')
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

revoke all on function public.handover_historico(uuid, integer) from public;
grant execute on function public.handover_historico(uuid, integer) to anon;

-- ── 2. Backfill: faltas legadas 'Comprado' → 'Recebido na loja' (com auditoria) ──
-- Auditoria por linha (usuário sintético 'sistema', sem sessão real).
insert into public.auditoria
  (acao, origem, id_item, usuario, nome, perfil, campo, valor_anterior, valor_novo, resumo)
select
  'Recebido na loja', 'Compras_Reposicao', c.id,
  'sistema', 'Sistema', 'admin',
  'Status_Compra', 'Comprado', 'Recebido na loja',
  'Backfill migração 0014 — falta de estoque já recebida'
from public.compras_reposicao c
where c.status_compra = 'Comprado'
  and coalesce(c.excluido, false) = false;

update public.compras_reposicao set
  status_compra   = 'Recebido na loja',
  ultima_acao_por = 'Sistema (migração 0014)',
  ultima_acao_em  = now()
where status_compra = 'Comprado'
  and coalesce(excluido, false) = false;
