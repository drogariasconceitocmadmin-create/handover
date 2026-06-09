-- ============================================================
-- SMOKE TEST — 0020_tarefas_acompanhadas
-- Valida: criação, participantes (dedup), comentário, conclusão,
-- reabertura, notificações in-app e IDEMPOTÊNCIA.
--
-- SEGURO: roda tudo dentro de uma transação e termina em ROLLBACK.
-- NÃO persiste nenhum dado (nem sessões, nem tarefas, nem notificações).
-- Rode DEPOIS de aplicar a migration 0020. Usuários usados: marco, carlos.
-- Cada assert falho aborta com 'FALHA: ...'. Sucesso = chega ao ROLLBACK
-- e emite os NOTICEs '[OK] ...'.
-- ============================================================
begin;

do $$
declare
  tok_a uuid;   -- sessão marco (remetente / promotor)
  tok_b uuid;   -- sessão carlos (destinatário)
  v_grupo uuid;
  v_res jsonb;
  v_id uuid;
  v_int int;
  v_status text;
  v_msg text := 'SMOKE: comprar etiquetas térmicas';
begin
  -- sessões de teste
  insert into public.sessoes (usuario_id, usuario, nome, perfil, expira_em)
    select id, usuario, nome, perfil, now() + interval '10 minutes'
      from public.usuarios where usuario = 'marco' returning token into tok_a;
  insert into public.sessoes (usuario_id, usuario, nome, perfil, expira_em)
    select id, usuario, nome, perfil, now() + interval '10 minutes'
      from public.usuarios where usuario = 'carlos' returning token into tok_b;

  -- 1) cria a mensagem (marco -> carlos) e pega o grupo_id
  v_res := public.handover_tarefa_criar(tok_a, array['carlos'], v_msg, false);
  if (v_res->>'ok') <> 'true' then raise exception 'FALHA: criar mensagem: %', v_res; end if;
  select grupo_id into v_grupo from public.tarefas_diretas
   where criado_por='marco' and destinatario='carlos' and mensagem=v_msg
   order by criado_em desc limit 1;
  if v_grupo is null then raise exception 'FALHA: grupo_id não encontrado'; end if;
  raise notice '[OK] mensagem criada, grupo=%', v_grupo;

  -- 2) promove a tarefa acompanhada (carlos, que é destinatário, pode)
  v_res := public.handover_acompanhar_criar(tok_b, v_grupo, null);
  if (v_res->>'ok') <> 'true' or (v_res->>'jaExistia') <> 'false' then
    raise exception 'FALHA: criar acompanhada: %', v_res; end if;
  v_id := (v_res->>'id')::uuid;
  raise notice '[OK] tarefa acompanhada criada, id=%', v_id;

  -- 3) participantes = exatamente 2 (marco, carlos), sem duplicar
  select count(*) into v_int from public.tarefas_acompanhadas_participantes where tarefa_id=v_id;
  if v_int <> 2 then raise exception 'FALHA: esperava 2 participantes, veio %', v_int; end if;
  select count(distinct usuario) into v_int from public.tarefas_acompanhadas_participantes where tarefa_id=v_id;
  if v_int <> 2 then raise exception 'FALHA: participantes duplicados'; end if;
  raise notice '[OK] 2 participantes deduplicados (marco, carlos)';

  -- 4) evento de criação registrado
  select count(*) into v_int from public.tarefas_acompanhadas_eventos where tarefa_id=v_id and tipo='criacao';
  if v_int <> 1 then raise exception 'FALHA: evento de criação ausente'; end if;

  -- 5) notificação de criação foi para marco (não para o autor carlos)
  select count(*) into v_int from public.handover_notificacoes where usuario='marco' and ref_id=v_id;
  if v_int < 1 then raise exception 'FALHA: marco não foi notificado da criação'; end if;
  select count(*) into v_int from public.handover_notificacoes where usuario='carlos' and ref_id=v_id;
  if v_int <> 0 then raise exception 'FALHA: autor carlos não deveria ser notificado'; end if;
  raise notice '[OK] notificação de criação só para os demais (marco)';

  -- 6) carlos comenta -> notifica marco
  v_res := public.handover_acompanhar_comentar(tok_b, v_id, 'Já comprei metade.');
  if (v_res->>'ok') <> 'true' then raise exception 'FALHA: comentar: %', v_res; end if;
  select count(*) into v_int from public.handover_notificacoes where usuario='marco' and ref_id=v_id and titulo='Novo comentário';
  if v_int < 1 then raise exception 'FALHA: marco não notificado do comentário'; end if;
  raise notice '[OK] comentário + notificação';

  -- 7) marco conclui -> status Concluído + notifica carlos
  v_res := public.handover_acompanhar_concluir(tok_a, v_id);
  if (v_res->>'ok') <> 'true' then raise exception 'FALHA: concluir: %', v_res; end if;
  select status into v_status from public.tarefas_acompanhadas where id=v_id;
  if v_status <> 'Concluído' then raise exception 'FALHA: status=% (esperava Concluído)', v_status; end if;
  select count(*) into v_int from public.handover_notificacoes where usuario='carlos' and ref_id=v_id and titulo='Tarefa concluída';
  if v_int < 1 then raise exception 'FALHA: carlos não notificado da conclusão'; end if;
  raise notice '[OK] conclusão + notificação';

  -- 8) carlos reabre -> status Pendente + notifica marco
  v_res := public.handover_acompanhar_reabrir(tok_b, v_id);
  if (v_res->>'ok') <> 'true' then raise exception 'FALHA: reabrir: %', v_res; end if;
  select status into v_status from public.tarefas_acompanhadas where id=v_id;
  if v_status <> 'Pendente' then raise exception 'FALHA: status=% (esperava Pendente)', v_status; end if;
  raise notice '[OK] reabertura';

  -- 9) IDEMPOTÊNCIA: promover o mesmo grupo de novo não duplica
  v_res := public.handover_acompanhar_criar(tok_a, v_grupo, null);
  if (v_res->>'jaExistia') <> 'true' then raise exception 'FALHA: idempotência (jaExistia != true): %', v_res; end if;
  select count(*) into v_int from public.tarefas_acompanhadas where grupo_id=v_grupo;
  if v_int <> 1 then raise exception 'FALHA: idempotência (% tarefas p/ o grupo)', v_int; end if;
  select count(*) into v_int from public.tarefas_acompanhadas_participantes where tarefa_id=v_id;
  if v_int <> 2 then raise exception 'FALHA: idempotência mexeu nos participantes (%).', v_int; end if;
  raise notice '[OK] idempotência: 1 tarefa, 2 participantes';

  -- 10) badge: marco tem não lidas; marcar lidas zera
  v_res := public.handover_notificacoes_listar(tok_a);
  if ((v_res->>'naoLidas')::int) < 1 then raise exception 'FALHA: marco deveria ter não lidas'; end if;
  perform public.handover_notificacoes_marcar_lidas(tok_a, null);
  v_res := public.handover_notificacoes_listar(tok_a);
  if ((v_res->>'naoLidas')::int) <> 0 then raise exception 'FALHA: marcar lidas não zerou'; end if;
  raise notice '[OK] badge: não lidas -> marcar lidas -> 0';

  raise notice '==== SMOKE 0020 PASSOU — fazendo ROLLBACK (nada persistido) ====';
end $$;

rollback;
