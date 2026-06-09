-- Preflight 0021 — rodar ANTES de aplicar a migration. Somente leitura.
-- Esperado: handover_notificacoes existe (0020); _notificar_perfis e
-- handover_cotacao_registrar ainda NÃO existem; CHECKs atuais só aceitam
-- 'tarefa_acompanhada'; usuarios tem coluna ativo.

-- 1. Tabela handover_notificacoes existe (0020 aplicada)?
select to_regclass('public.handover_notificacoes') as notificacoes_tabela;  -- esperado: not null

-- 2. Funções novas ainda não existem?
select p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('_notificar_perfis','handover_cotacao_registrar');
-- esperado: 0 linhas

-- 3. CHECKs atuais de tipo/ref_tipo (devem citar apenas tarefa_acompanhada):
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.handover_notificacoes'::regclass
   and conname in ('chk_hnotif_tipo','chk_hnotif_ref_tipo');

-- 4. usuarios.ativo existe?
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'usuarios' and column_name = 'ativo';
-- esperado: 1 linha

-- 5. RPCs de criação atuais existem (serão recriadas)?
select p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('handover_medicamento_criar','handover_compra_reposicao_criar');
-- esperado: 2 linhas

-- 6. Usuários com perfil admin/comprador ativos (receberão notificações):
select usuario, perfil from public.usuarios
 where perfil in ('admin','comprador') and ativo order by usuario;
