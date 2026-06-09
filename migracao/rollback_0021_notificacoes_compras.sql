-- Rollback 0021 — usar SOMENTE em emergência, com autorização explícita.
-- Reverte: CHECKs ao estado da 0020, remove helper e RPC novos, restaura as
-- RPCs de criação às definições da 0004/0005 (sem notificação).
--
-- ATENÇÃO antes de rodar:
--   1. Notificações já criadas com tipos novos ('encomenda','compra_reposicao',
--      'cotacao') VIOLAM o CHECK antigo. O passo 0 apaga essas linhas — confira
--      o SELECT primeiro e registre os IDs.
--   2. As definições restauradas das RPCs de criação devem ser as da 0004/0005.
--      Este arquivo NÃO reproduz os corpos; aplique os trechos correspondentes:
--        supabase/migrations/0004_medicamentos.sql      (handover_medicamento_criar)
--        supabase/migrations/0005_compras_reposicao.sql (handover_compra_reposicao_criar)

-- 0. Conferir e remover notificações dos tipos novos (CHECK antigo as rejeitaria):
select id, usuario, titulo, tipo, criado_em
  from public.handover_notificacoes
 where tipo in ('encomenda','compra_reposicao','cotacao');
-- Após conferência explícita:
-- delete from public.handover_notificacoes
--  where tipo in ('encomenda','compra_reposicao','cotacao');

-- 1. Restaurar CHECKs da 0020:
alter table public.handover_notificacoes drop constraint if exists chk_hnotif_tipo;
alter table public.handover_notificacoes add constraint chk_hnotif_tipo
  check (tipo is null or tipo in ('tarefa_acompanhada'));
alter table public.handover_notificacoes drop constraint if exists chk_hnotif_ref_tipo;
alter table public.handover_notificacoes add constraint chk_hnotif_ref_tipo
  check (ref_tipo is null or ref_tipo in ('tarefa_acompanhada'));

-- 2. Remover RPC pública e helper novos:
drop function if exists public.handover_cotacao_registrar(uuid, jsonb);
drop function if exists public._notificar_perfis(text[], text, text, text, text, text, uuid);

-- 3. Restaurar handover_medicamento_criar e handover_compra_reposicao_criar:
--    re-aplicar os blocos "create or replace function" das migrations 0004 e 0005
--    (idempotentes) + os grants correspondentes daquelas migrations.
