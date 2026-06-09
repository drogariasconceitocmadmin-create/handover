-- Smoke 0021 — rodar APÓS aplicar a migration. Tudo dentro de BEGIN…ROLLBACK:
-- nenhum dado persiste. Usa usuários de teste criados na própria transação.
begin;

-- ------- setup: usuários e sessões de teste (só nesta transação) -------
insert into public.usuarios (nome, usuario, perfil, ativo) values
  ('Smoke Operador',  'smoke_op_0021',   'operador',  true),
  ('Smoke Comprador', 'smoke_comp_0021', 'comprador', true),
  ('Smoke Admin',     'smoke_adm_0021',  'admin',     true),
  ('Smoke Inativo',   'smoke_inat_0021', 'comprador', false);

insert into public.sessoes (token, usuario_id, usuario, nome, perfil)
select '00000000-0000-4000-8000-00000000a001'::uuid, id, usuario, nome, perfil
  from public.usuarios where usuario = 'smoke_op_0021';
insert into public.sessoes (token, usuario_id, usuario, nome, perfil)
select '00000000-0000-4000-8000-00000000a002'::uuid, id, usuario, nome, perfil
  from public.usuarios where usuario = 'smoke_comp_0021';
insert into public.sessoes (token, usuario_id, usuario, nome, perfil)
select '00000000-0000-4000-8000-00000000a003'::uuid, id, usuario, nome, perfil
  from public.usuarios where usuario = 'smoke_adm_0021';

-- ------- T1: operador cria encomenda → notifica admin+comprador ativos, não o autor, não o inativo -------
select public.handover_medicamento_criar(
  '00000000-0000-4000-8000-00000000a001'::uuid,
  jsonb_build_object('tipo','Encomenda','medicamento','[SMOKE_0021] Dipirona',
    'cliente','Cliente Teste','previsaoEntrega', to_char(current_date + 2,'YYYY-MM-DD'))
) as t1_criar;

select 'T1' as teste,
  count(*) filter (where usuario = 'smoke_comp_0021') = 1  as comprador_notificado,
  count(*) filter (where usuario = 'smoke_adm_0021')  = 1  as admin_notificado,
  count(*) filter (where usuario = 'smoke_op_0021')   = 0  as autor_nao_notificado,
  count(*) filter (where usuario = 'smoke_inat_0021') = 0  as inativo_nao_notificado
from public.handover_notificacoes
where tipo = 'encomenda' and titulo like '%[SMOKE_0021]%';
-- esperado: todos true (admins reais marco/carlos também recebem — ok, rollback no fim)

-- ------- T2: encomenda multi-item → UMA notificação por destinatário (não por item) -------
select public.handover_medicamento_criar(
  '00000000-0000-4000-8000-00000000a001'::uuid,
  jsonb_build_object('tipo','Falta','itens', jsonb_build_array(
    jsonb_build_object('medicamento','[SMOKE_0021] Item A'),
    jsonb_build_object('medicamento','[SMOKE_0021] Item B'),
    jsonb_build_object('medicamento','[SMOKE_0021] Item C')))
) as t2_criar;

select 'T2' as teste,
  count(*) = 1 as uma_notif_por_destinatario,
  bool_and(titulo = 'Nova falta: 3 itens') as titulo_agregado
from public.handover_notificacoes
where tipo = 'encomenda' and usuario = 'smoke_comp_0021' and titulo like 'Nova falta%';

-- ------- T3: compra de reposição → notifica com tipo compra_reposicao -------
select public.handover_compra_reposicao_criar(
  '00000000-0000-4000-8000-00000000a001'::uuid,
  jsonb_build_object('categoriaCompra','Limpeza','item','[SMOKE_0021] Álcool 70',
    'quantidade','5','prioridade','Alta')
) as t3_criar;

select 'T3' as teste,
  count(*) filter (where usuario = 'smoke_comp_0021') = 1 as comprador_notificado,
  bool_and(corpo like '%Prioridade: Alta%') as corpo_com_prioridade
from public.handover_notificacoes
where tipo = 'compra_reposicao' and titulo like '%[SMOKE_0021]%';

-- ------- T4: cotacao_registrar como comprador → grava auditoria por item -------
with med as (
  select id from public.medicamentos where medicamento = '[SMOKE_0021] Dipirona' limit 1
), rep as (
  select id from public.compras_reposicao where item = '[SMOKE_0021] Álcool 70' limit 1
)
select public.handover_cotacao_registrar(
  '00000000-0000-4000-8000-00000000a002'::uuid,
  jsonb_build_array(
    jsonb_build_object('id', (select id from med), 'origem','Medicamentos','nome','[SMOKE_0021] Dipirona'),
    jsonb_build_object('id', (select id from rep), 'origem','Reposicao','nome','[SMOKE_0021] Álcool 70'))
) as t4_registrar;
-- esperado: {"ok":true,"registrados":2}

select 'T4' as teste, count(*) = 2 as duas_linhas_auditoria,
  bool_and(acao = 'Cotação') as acao_cotacao,
  bool_and(usuario = 'smoke_comp_0021') as usuario_correto
from public.auditoria
where acao = 'Cotação' and resumo like '%[SMOKE_0021]%';

-- ------- T5: cotacao_registrar como OPERADOR → nao_autorizado -------
do $$
begin
  begin
    perform public.handover_cotacao_registrar(
      '00000000-0000-4000-8000-00000000a001'::uuid,
      jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'origem','Medicamentos','nome','x')));
    raise exception 'T5_FALHOU: operador conseguiu registrar cotação';
  exception when others then
    if sqlerrm like '%nao_autorizado%' then
      raise notice 'T5 OK: operador bloqueado (nao_autorizado)';
    else
      raise;
    end if;
  end;
end $$;

-- ------- T6: cotacao_registrar com array vazio → itens_invalidos -------
do $$
begin
  begin
    perform public.handover_cotacao_registrar(
      '00000000-0000-4000-8000-00000000a002'::uuid, '[]'::jsonb);
    raise exception 'T6_FALHOU: array vazio aceito';
  exception when others then
    if sqlerrm like '%itens_invalidos%' then
      raise notice 'T6 OK: array vazio rejeitado';
    else
      raise;
    end if;
  end;
end $$;

-- ------- T7: notificacoes_listar (0020) retorna os tipos novos sem erro -------
select 'T7' as teste,
  (public.handover_notificacoes_listar('00000000-0000-4000-8000-00000000a002'::uuid)
     ->> 'success')::boolean as listar_ok,
  (public.handover_notificacoes_listar('00000000-0000-4000-8000-00000000a002'::uuid)
     ->> 'naoLidas')::int >= 3 as badge_conta_novos_tipos;

-- ------- T8: CHECK ainda rejeita tipo desconhecido -------
do $$
begin
  begin
    insert into public.handover_notificacoes (usuario, titulo, tipo)
    values ('smoke_comp_0021', 'x', 'tipo_inexistente');
    raise exception 'T8_FALHOU: CHECK aceitou tipo inválido';
  exception when check_violation then
    raise notice 'T8 OK: CHECK rejeita tipo desconhecido';
  end;
end $$;

rollback;  -- nada persiste
