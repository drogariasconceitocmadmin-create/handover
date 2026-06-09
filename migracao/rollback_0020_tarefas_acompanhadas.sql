-- ============================================================
-- ROLLBACK — 0020_tarefas_acompanhadas
-- Remove APENAS o que a 0020 cria. Seguro porque:
--   • o preflight (preflight_0020...sql) ABORTA a aplicação se qualquer
--     uma destas tabelas já existir → garante que a 0020 foi quem criou;
--   • a tabela de notificações é PREFIXADA (handover_notificacoes), então
--     este rollback nunca remove uma eventual tabela genérica "notificacoes".
-- Não referencia nem altera nada pré-existente (tarefas_diretas,
-- painel_tarefas, sessoes, usuarios ficam intactos).
-- Ordem: funções primeiro; tabelas filhas (FK) antes das pais.
-- ============================================================

-- RPCs
drop function if exists public.handover_acompanhar_criar(uuid, uuid, text);
drop function if exists public.handover_acompanhar_listar(uuid);
drop function if exists public.handover_acompanhar_comentar(uuid, uuid, text);
drop function if exists public.handover_acompanhar_concluir(uuid, uuid);
drop function if exists public.handover_acompanhar_reabrir(uuid, uuid);
drop function if exists public.handover_notificacoes_listar(uuid);
drop function if exists public.handover_notificacoes_marcar_lidas(uuid, uuid[]);

-- Helpers
drop function if exists public._tacomp_notificar(uuid, text, text, text);
drop function if exists public._tacomp_to_json(public.tarefas_acompanhadas);

-- Tabelas (filhas via FK antes das pais; handover_notificacoes é independente)
drop table if exists public.tarefas_acompanhadas_eventos;
drop table if exists public.tarefas_acompanhadas_participantes;
drop table if exists public.tarefas_acompanhadas;
drop table if exists public.handover_notificacoes;
