-- ============================================================
-- TESTE ANON — 0020_tarefas_acompanhadas  (executável ponta-a-ponta)
-- Roda TUDO de uma vez como a role `anon` (a mesma da anon key no app) e
-- emite [OK]/[FALHA] para cada caso, sem precisar comentar/descomentar.
-- Cada caso é um DO block que CAPTURA a exceção esperada (savepoint
-- implícito do PL/pgSQL), então a transação não aborta entre os casos.
--
-- Prova que `anon`:
--   (1) token inválido  -> RPC aborta com 'sessao_invalida'
--   (2) token válido    -> RPC retorna success
--   (3) SELECT direto em tarefas_acompanhadas      -> permission denied
--   (4) SELECT direto em handover_notificacoes      -> permission denied
--   (5) chamar helper interno _tacomp_notificar     -> permission denied
--
-- SEGURO: transação + ROLLBACK; token FIXO criado ANTES de virar anon
-- (sessoes tem RLS, anon não lê). Rodar só DEPOIS de aplicar a 0020.
-- ============================================================
begin;

-- (pré) sessão válida com TOKEN FIXO, ainda como role privilegiada
insert into public.sessoes (token, usuario_id, usuario, nome, perfil, expira_em)
  select '11111111-1111-1111-1111-111111111111', id, usuario, nome, perfil, now() + interval '10 minutes'
    from public.usuarios where usuario = 'marco';

-- a partir daqui somos `anon` (igual ao navegador com a anon key)
set local role anon;

-- (1) TOKEN INVÁLIDO -> espera 'sessao_invalida'
do $$
begin
  perform public.handover_acompanhar_listar('00000000-0000-0000-0000-000000000000');
  raise notice '[FALHA] (1) token inválido NÃO bloqueou';
exception when others then
  if sqlerrm like '%sessao_invalida%' then raise notice '[OK] (1) token inválido bloqueado (sessao_invalida)';
  else raise notice '[FALHA] (1) erro inesperado: % / %', sqlstate, sqlerrm; end if;
end $$;

-- (2) TOKEN VÁLIDO -> espera success=true
do $$
declare v jsonb;
begin
  v := public.handover_acompanhar_listar('11111111-1111-1111-1111-111111111111');
  if (v->>'success') = 'true' then raise notice '[OK] (2) token válido retornou success';
  else raise notice '[FALHA] (2) retorno inesperado: %', v; end if;
exception when others then
  raise notice '[FALHA] (2) token válido deu erro: % / %', sqlstate, sqlerrm;
end $$;

-- (3) SELECT direto na tabela -> espera insufficient_privilege (42501)
do $$
declare n int;
begin
  select count(*) into n from public.tarefas_acompanhadas;
  raise notice '[FALHA] (3) anon LEU tarefas_acompanhadas (% linhas)', n;
exception
  when insufficient_privilege then raise notice '[OK] (3) SELECT direto em tarefas_acompanhadas bloqueado (42501)';
  when others then raise notice '[FALHA] (3) erro inesperado: % / %', sqlstate, sqlerrm;
end $$;

-- (4) SELECT direto em handover_notificacoes -> espera insufficient_privilege
do $$
declare n int;
begin
  select count(*) into n from public.handover_notificacoes;
  raise notice '[FALHA] (4) anon LEU handover_notificacoes (% linhas)', n;
exception
  when insufficient_privilege then raise notice '[OK] (4) SELECT direto em handover_notificacoes bloqueado (42501)';
  when others then raise notice '[FALHA] (4) erro inesperado: % / %', sqlstate, sqlerrm;
end $$;

-- (5) helper interno -> espera insufficient_privilege (sem grant a anon)
do $$
begin
  perform public._tacomp_notificar('11111111-1111-1111-1111-111111111111', 'x', 'T', 'C');
  raise notice '[FALHA] (5) anon EXECUTOU _tacomp_notificar';
exception
  when insufficient_privilege then raise notice '[OK] (5) helper interno _tacomp_notificar bloqueado (42501)';
  when others then raise notice '[FALHA] (5) erro inesperado: % / %', sqlstate, sqlerrm;
end $$;

reset role;
rollback;  -- nada persiste
