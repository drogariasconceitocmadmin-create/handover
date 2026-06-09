-- Anon test 0021 — rodar APÓS a migration, simulando o papel anon.
-- Verifica que o modelo de segurança não regrediu.
-- Cada bloco roda com `set local role anon` dentro de transação revertida.

-- A1: helper _notificar_perfis NÃO executável como anon (esperado: permission denied 42501)
begin;
set local role anon;
do $$
begin
  begin
    perform public._notificar_perfis(array['admin'], null, 't', 'c', 'encomenda', 'encomenda', gen_random_uuid());
    raise exception 'A1_FALHOU: anon executou _notificar_perfis';
  exception when insufficient_privilege then
    raise notice 'A1 OK: _notificar_perfis bloqueado para anon (42501)';
  end;
end $$;
rollback;

-- A2: SELECT direto em handover_notificacoes bloqueado (esperado: 42501)
begin;
set local role anon;
do $$
begin
  begin
    perform * from public.handover_notificacoes limit 1;
    raise exception 'A2_FALHOU: anon leu handover_notificacoes';
  exception when insufficient_privilege then
    raise notice 'A2 OK: tabela bloqueada para anon (42501)';
  end;
end $$;
rollback;

-- A3: handover_cotacao_registrar executável como anon mas com token inválido → sessao_invalida
begin;
set local role anon;
do $$
begin
  begin
    perform public.handover_cotacao_registrar(gen_random_uuid(),
      jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'origem','Medicamentos','nome','x')));
    raise exception 'A3_FALHOU: token inválido aceito';
  exception when others then
    if sqlerrm like '%sessao_invalida%' then
      raise notice 'A3 OK: token inválido rejeitado (sessao_invalida)';
    else
      raise;
    end if;
  end;
end $$;
rollback;

-- A4: handover_medicamento_criar continua executável como anon (grant preservado),
--     token inválido → sessao_invalida
begin;
set local role anon;
do $$
begin
  begin
    perform public.handover_medicamento_criar(gen_random_uuid(), '{}'::jsonb);
    raise exception 'A4_FALHOU: token inválido aceito';
  exception when others then
    if sqlerrm like '%sessao_invalida%' then
      raise notice 'A4 OK: criar exige sessão válida';
    else
      raise;
    end if;
  end;
end $$;
rollback;

-- A5: confirmação de grants — quais funções 0021 o anon pode executar?
-- Esperado: handover_cotacao_registrar, handover_medicamento_criar,
-- handover_compra_reposicao_criar = true; _notificar_perfis = false.
select p.proname,
       has_function_privilege('anon', p.oid, 'execute') as anon_pode_executar
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('_notificar_perfis','handover_cotacao_registrar',
                     'handover_medicamento_criar','handover_compra_reposicao_criar')
 order by p.proname;
