-- ============================================================
-- PREFLIGHT — 0020_tarefas_acompanhadas
-- Rodar ANTES de aplicar a 0020 (na branch efêmera).
-- Confirma que é seguro criar e que as dependências existem como esperado.
--
-- A confirmação de "projeto = pxswpufbkisdniojwdtt" e "é BRANCH efêmera,
-- não produção" é feita na camada de orquestração (MCP): a migration só é
-- aplicada com o project_id da BRANCH, nunca o de produção. Aqui dentro do
-- SQL confirmamos o que é confirmável: existência de tabelas, assinatura de
-- handover_check_session e estrutura de tarefas_diretas.
-- ============================================================

-- (A) Existência das 4 tabelas da 0020 — esperado: tudo NULL antes de aplicar
select to_regclass('public.tarefas_acompanhadas')               as t_acompanhadas,
       to_regclass('public.tarefas_acompanhadas_participantes')  as t_participantes,
       to_regclass('public.tarefas_acompanhadas_eventos')        as t_eventos,
       to_regclass('public.handover_notificacoes')               as t_notificacoes;

-- (B) GUARDA: aborta se qualquer uma já existir (impede recriar/colidir)
do $$
begin
  if to_regclass('public.tarefas_acompanhadas') is not null
  or to_regclass('public.tarefas_acompanhadas_participantes') is not null
  or to_regclass('public.tarefas_acompanhadas_eventos') is not null
  or to_regclass('public.handover_notificacoes') is not null then
    raise exception 'PREFLIGHT ABORTOU: alguma tabela da 0020 já existe.';
  end if;
  raise notice '[OK] nenhuma tabela da 0020 existe — seguro aplicar';
end $$;

-- (C) Assinatura REAL de handover_check_session (args, retorno, security definer)
select p.proname,
       pg_catalog.pg_get_function_arguments(p.oid) as argumentos,
       pg_catalog.pg_get_function_result(p.oid)    as retorna,
       p.prosecdef                                  as security_definer
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'handover_check_session';

-- (D) Estrutura REAL de tarefas_diretas (colunas usadas pela 0020)
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'tarefas_diretas'
 order by ordinal_position;

-- (E) Banco/role atual (confirmação operacional adicional)
select current_database() as banco, current_user as role_atual, now() as agora;
