-- Handover v2 — Migration 0007: Checklist (templates + turnos por dia)
--
-- Security model (same as 0001):
--   * Tables have RLS enabled with NO policies → anon can never touch them directly.
--   * All access goes through SECURITY DEFINER functions that validate the session
--     token via the INTERNAL helper public.handover_check_session.
--   * Default PUBLIC execute on functions is revoked; only the public RPCs are
--     granted to anon.
--   * Return shapes are jsonb with PascalCase keys (1:1 with the legacy frontend).
--
-- Timezone: America/Sao_Paulo (data "de hoje" e deadline da Manhã calculados local).
-- Idempotent: create table if not exists / create or replace / on conflict do nothing.

-- ===================== TABELAS =====================

create table if not exists public.checklist_templates (
  id                  uuid primary key default gen_random_uuid(),
  turno               text not null,
  ordem               int  not null,
  item_id             text not null,
  categoria           text,
  item                text,
  descricao           text,
  horario_referencia  text,
  unique (turno, item_id)
);
alter table public.checklist_templates enable row level security;   -- no policies
create index if not exists checklist_templates_turno_ordem_idx
  on public.checklist_templates (turno, ordem);

create table if not exists public.checklist_turnos (
  id                  uuid primary key default gen_random_uuid(),
  data                date not null,
  turno               text not null,
  horario_referencia  text,
  categoria           text,
  item                text,
  descricao           text,
  status              text not null default 'Pendente'
                        check (status in ('Pendente','Feito','Não aplicável')),
  responsavel         text,
  data_hora_check     timestamptz,
  observacao          text,
  unique (data, turno, item)
);
alter table public.checklist_turnos enable row level security;      -- no policies
create index if not exists checklist_turnos_data_turno_idx
  on public.checklist_turnos (data, turno);

-- ===================== SEED templates =====================
-- Conteúdo verbatim de migracao/CHECKLIST_TEMPLATES.md (Manhã 23 + Noite 10).
-- Dollar-quoting preserva aspas e quebras de linha. on conflict (turno,item_id) do nothing.

insert into public.checklist_templates (turno, ordem, item_id, horario_referencia, categoria, item, descricao) values
('Manhã', 0, 'manha_climatizacao', '07:00', 'Estrutura e Ambiente', 'Climatização', $desc$• Ligar o ar-condicionado.
• Ligar a cortina de ar.
• Colocar a moto em local especificado no exterior da loja.
• Verificar se o ambiente está confortável para clientes e equipe.

Critério de conclusão: salão climatizado e entrada com cortina de ar ligada.$desc$),
('Manhã', 1, 'manha_iluminacao', '07:00', 'Estrutura e Ambiente', 'Iluminação', $desc$• Acender luzes do salão.
• Acender luzes da fachada.
• Acender tótens e pontos visuais externos, se houver.

Critério de conclusão: loja visível, iluminada e com aparência de operação ativa.$desc$),
('Manhã', 2, 'manha_som_ambiente', '07:00', 'Estrutura e Ambiente', 'Som ambiente', $desc$• Ligar a rádio interna.
• Ajustar volume para nível agradável.

Critério de conclusão: som funcionando sem atrapalhar atendimento, telefone ou comunicação da equipe.$desc$),
('Manhã', 3, 'manha_fachada', '07:00', 'Estrutura e Ambiente', 'Fachada', $desc$• Verificar limpeza da calçada.
• Colocar bandeiras da loja no exterior.
• Verificar se há lixo, caixas, objetos ou obstruções na entrada.
• Corrigir ou acionar responsável quando houver problema.

Critério de conclusão: entrada limpa, livre e convidativa para o cliente.$desc$),
('Manhã', 4, 'manha_servidor', '07:00', 'Sistemas e Operação', 'Servidor', $desc$• Ligar o servidor.
• Verificar se o banco de dados carregou corretamente.
• Confirmar se o sistema principal está acessível.

Critério de conclusão: sistema operacional pronto para venda.$desc$),
('Manhã', 5, 'manha_pdvs_balcao', '07:00', 'Sistemas e Operação', 'PDVs e Balcão', $desc$• Ligar computadores.
• Ligar monitores.
• Ligar impressoras térmicas.
• Conferir se os equipamentos respondem corretamente.

Critério de conclusão: pontos de atendimento e caixa prontos para operar.$desc$),
('Manhã', 6, 'manha_troco', '07:00', 'Sistemas e Operação', 'Troco', $desc$• Conferir o kit de troco.
• Verificar se há moedas e notas suficientes para iniciar o turno.

Critério de conclusão: troco disponível para as primeiras vendas do dia.$desc$),
('Manhã', 7, 'manha_caixa', '07:00', 'Sistemas e Operação', 'Caixa', $desc$• Abrir o caixa.
• Conferir valores iniciais.
• Registrar qualquer divergência antes de iniciar vendas.

Critério de conclusão: caixa aberto, conferido e pronto para operação.$desc$),
('Manhã', 8, 'manha_handover', '07:00', 'Sistemas e Operação', 'Handover', $desc$• Checar mensagens do turno anterior.
• Limpar do painel o que já foi resolvido.
• Programar entregas do dia de medicamentos encomendados.
• Verificar pendências críticas antes do início do fluxo de clientes.

Critério de conclusão: pendências conhecidas, resolvidos limpos e entregas organizadas.$desc$),
('Manhã', 9, 'manha_internet_tef', '07:00', 'Sistemas e Operação', 'Internet e TEF', $desc$• Testar conexão de internet.
• Verificar máquinas de cartão.
• Conferir se as maquinetas estão carregadas.
• Realizar teste simples quando houver dúvida de conexão.

Critério de conclusão: loja pronta para receber pagamentos por cartão e operar sistemas online.$desc$),
('Manhã', 10, 'manha_telefones_whatsapp', '07:00', 'Sistemas e Operação', 'Telefones e WhatsApp', $desc$• Verificar bateria do celular da loja.
• Confirmar conexão de internet no aparelho.
• Conferir mensagens recebidas enquanto a loja estava fechada.
• Priorizar mensagens ligadas a medicamentos, entregas e clientes aguardando resposta.

Critério de conclusão: WhatsApp ativo e mensagens críticas identificadas.$desc$),
('Manhã', 11, 'manha_pisos_prateleiras', '07:00', 'Higiene e Organização', 'Pisos e Prateleiras', $desc$• Conferir se a limpeza geral foi feita.
• Verificar se há pó, manchas ou sujeira visível.
• Acionar correção imediata quando necessário.

Critério de conclusão: salão limpo e prateleiras apresentáveis.$desc$),
('Manhã', 12, 'manha_lixeiras', '07:00', 'Higiene e Organização', 'Lixeiras', $desc$• Verificar se todas as lixeiras estão com sacos novos.
• Conferir se há lixo acumulado do turno anterior.

Critério de conclusão: lixeiras preparadas para o turno.$desc$),
('Manhã', 13, 'manha_banheiros_pias', '07:00', 'Higiene e Organização', 'Banheiros e Pias', $desc$• Repor sabonete líquido.
• Repor papel toalha.
• Conferir pontos de uso da equipe e clientes, quando aplicável.

Critério de conclusão: banheiros e pias abastecidos e utilizáveis.$desc$),
('Manhã', 14, 'manha_alcool_gel', '07:00', 'Higiene e Organização', 'Álcool em gel', $desc$• Verificar disponibilidade de álcool em gel no balcão.
• Repor quando estiver baixo ou vazio.

Critério de conclusão: álcool em gel disponível para clientes e equipe.$desc$),
('Manhã', 15, 'manha_moto', '07:00', 'Logística de Entrega', 'Moto', $desc$• Conferir condições da moto junto com o entregador.
• Usar o sistema/checklist próprio, quando disponível.
• Registrar qualquer impedimento operacional.

Critério de conclusão: moto liberada para entregas ou pendência registrada.$desc$),
('Manhã', 16, 'manha_bau_mochila', '07:00', 'Logística de Entrega', 'Baú/Mochila', $desc$• Verificar limpeza interna.
• Confirmar se está seco.
• Corrigir antes de transportar medicamentos ou produtos.

Critério de conclusão: compartimento de entrega limpo e adequado.$desc$),
('Manhã', 17, 'manha_maquineta_movel', '07:00', 'Logística de Entrega', 'Maquineta móvel', $desc$• Conferir bateria da máquina de cartão de rua.
• Confirmar se está operante para entregas.

Critério de conclusão: maquineta móvel pronta para uso externo.$desc$),
('Manhã', 18, 'manha_termolabeis', '07:00', 'Balcão e Medicamentos', 'Termolábeis', $desc$• Conferir temperatura da geladeira de vacinas/insulinas.
• Anotar a temperatura conforme rotina da loja.
• Registrar desvio imediatamente se estiver fora do padrão esperado.

Critério de conclusão: temperatura conferida e registrada.$desc$),
('Manhã', 19, 'manha_psicotropicos', '07:00', 'Balcão e Medicamentos', 'Psicotrópicos', $desc$• Verificar se o armário controlado está fechado.
• Confirmar que a chave está em local seguro e acessível para a pessoa autorizada.

Critério de conclusão: controlados protegidos e acesso sob controle.$desc$),
('Manhã', 20, 'manha_reposicao', '07:00', 'Balcão e Medicamentos', 'Reposição', $desc$• Verificar buracos nas prateleiras.
• Priorizar reposição imediata dos itens de maior giro.
• Acionar estoque quando houver falta aparente.

Critério de conclusão: principais produtos de giro expostos e sem ruptura visual crítica.$desc$),
('Manhã', 21, 'manha_trava_saida', '07:00', 'Caixa e Financeiro', 'TRAVA DE SAÍDA', $desc$1. Conferir caixa físico vs. sistema.
2. Executar fechamento do PDV (quando aplicável).
3. Conciliar TEF (cartão) com o sistema.
4. Conferir PIX/links (valores e comprovantes).
5. Registrar estornos/cancelamentos com motivo.
6. Guardar valores e trancar o cofre.

Critério de aprovação: saldo bate ou divergência registrada (valor + possível causa + ação).$desc$),
('Manhã', 22, 'manha_fechamento_abertura', '07:00', 'Fechamento da abertura', 'Conferência final no Handover', $desc$Antes de liberar a loja como pronta para operação, o responsável deve conferir no Handover:
• total de itens do checklist;
• itens feitos;
• itens pendentes;
• percentual concluído;
• observações registradas;
• pendências críticas que precisam ser comunicadas à gerência.$desc$),
('Noite', 0, 'noite_medicamentos_risco_cliente', '21:30', 'Medicamentos', 'RISCO DIRETO NO CLIENTE', $desc$1. Atualizar encomendas (chegou / não chegou / cliente avisado).
2. Registrar clientes que precisam de retorno.
3. Revisar previsões (hoje/atrasado → ação definida).
4. Conferir e trancar controlados (psicotrópicos).
5. Conferir e registrar temperatura de termolábeis.

Critério de aprovação: nenhum cliente aguardando medicamento sem ação definida.$desc$),
('Noite', 1, 'noite_entregas_trava_operacional', '21:30', 'Entregas', 'TRAVA OPERACIONAL', $desc$1. Finalizar entregas do dia ou justificar.
2. Registrar pendentes com cliente + motivo + próxima ação.
3. Conferir moto (condição de uso) ou registrar problema em sistema próprio.
4. Guardar moto.

Critério de aprovação: nenhuma entrega sem status e próximo passo.$desc$),
('Noite', 2, 'noite_fechamento_moto', '22:00', 'Entregas', 'Fechamento da Moto', $desc$Preencher sistema da moto com entregador e guardar chaves em local pré estipulado.
Guardar moto no interior da loja.$desc$),
('Noite', 3, 'noite_clientes_whatsapp_experiencia', '21:30', 'Clientes e WhatsApp', 'EXPERIÊNCIA', $desc$1. Responder conversas críticas (preço, disponibilidade, entrega).
2. Atualizar conversas importantes.
3. Registrar no Handover clientes que exigem retorno.

Critério de aprovação: 0 clientes críticos sem resposta/registro.$desc$),
('Noite', 4, 'noite_loja_higiene_pronto_abrir', '22:00', 'Loja e Higiene', 'PRONTO PRA ABRIR', $desc$1. Limpar e organizar balcão.
2. Esvaziar lixeiras e repor sacos.
3. Garantir loja sem sujeira visível.
4. Limpar e abastecer WC (papel/sabão).
5. Organizar sala de vacinas.
6. Retirar bandeiras da fachada e guardar em local adequado.

Critério de aprovação: ambiente pronto para abertura imediata.$desc$),
('Noite', 5, 'noite_equipamentos_nao_travar_amanha', '22:00', 'Equipamentos', 'NÃO TRAVAR AMANHÃ', $desc$1. Encerrar PDVs/computadores corretamente.
2. Desligar o servidor conforme procedimento da loja (quando aplicável).
3. Colocar todas as maquinetas em carga.
4. Colocar celular da loja em carga.
5. Verificar internet/roteador (ou registrar problema).

Critério de aprovação: nenhum equipamento crítico indisponível sem registro.$desc$),
('Noite', 6, 'noite_seguranca_risco_zero', '22:15', 'Segurança', 'RISCO ZERO', $desc$1. Trancar cofre e armários sensíveis (incluindo controlados).
2. Fechar portas, grades e vitrines.
3. Ativar alarme.
4. Conferir área externa (fachada) sem itens expostos indevidamente.

Critério de aprovação: loja segura após saída da equipe.$desc$),
('Noite', 7, 'noite_caixa_financeiro_trava_saida', '22:15', 'Caixa e Financeiro', 'TRAVA DE SAÍDA', $desc$1. Conferir caixa físico vs. sistema.
2. Executar fechamento do PDV (quando aplicável).
3. Conciliar TEF (cartão) com o sistema.
4. Conferir PIX/links (valores e comprovantes).
5. Registrar estornos/cancelamentos com motivo.
6. Guardar valores e trancar o cofre.

Critério de aprovação: saldo bate ou divergência registrada (valor + possível causa + ação).$desc$),
('Noite', 8, 'noite_handover_passar_jogo_limpo', '22:00', 'Handover', 'PASSAR O JOGO LIMPO', $desc$1. Registrar todas as pendências reais.
2. Marcar como resolvido apenas o que está concluído.
3. Para cada pendência, registrar: o que é + impacto + próxima ação + prazo.

Critério de aprovação: qualquer pessoa consegue assumir sabendo o que fazer agora.$desc$),
('Noite', 9, 'noite_validacao_final', '22:15', 'Validação final', 'Validação final (30–60s)', $desc$Responder sem hesitar:
• O que o próximo turno faz primeiro?
• Há cliente aguardando retorno?
• Há entrega pendente?
• Existe algum risco não registrado?

Se houver dúvida → voltar e registrar no Handover.$desc$)
on conflict (turno, item_id) do nothing;

-- ===================== HELPERS internos (sem grant) =====================

-- Formata timestamptz → 'YYYY-MM-DDTHH24:MI:SS' em America/Sao_Paulo (null safe).
create or replace function public._handover_fmt_ts(v timestamptz)
returns text language sql immutable set search_path = public as $$
  select case when v is null then null
    else to_char(v at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS') end
$$;

-- Item de checklist (row de checklist_turnos) → objeto PascalCase do §5.
create or replace function public._checklist_item_to_json(r public.checklist_turnos)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'ID',                 r.id,
    'Data',               to_char(r.data, 'YYYY-MM-DD'),
    'Turno',              r.turno,
    'Horario_Referencia', r.horario_referencia,
    'Categoria',          r.categoria,
    'Item',               r.item,
    'Descricao',          r.descricao,
    'Status',             r.status,
    'Responsavel',        r.responsavel,
    'Data_Hora_Check',    public._handover_fmt_ts(r.data_hora_check),
    'Observacao',         r.observacao
  )
$$;

-- Summary do turno (a partir das linhas de checklist_turnos de uma data+turno).
create or replace function public._checklist_summary(p_data date, p_turno text)
returns jsonb language sql stable set search_path = public as $$
  with rows as (
    select status from public.checklist_turnos
     where data = p_data and turno = p_turno
  ), agg as (
    select
      count(*)::int                                              as total,
      count(*) filter (where status = 'Feito')::int             as feitos,
      count(*) filter (where status = 'Não aplicável')::int     as nao_aplicaveis,
      count(*) filter (where status = 'Pendente')::int          as pendentes
    from rows
  )
  select jsonb_build_object(
    'totalItens',          total,
    'itensFeitos',         feitos,
    'itensNaoAplicaveis',  nao_aplicaveis,
    'itensPendentes',      pendentes,
    'percentualConcluido',
      case when total = 0 then 0
           else round(((feitos + nao_aplicaveis)::numeric / total) * 100)::int end
  )
  from agg
$$;

-- Monta o objeto checklistTurno completo (items ordenados pelo template + summary).
create or replace function public._checklist_turno_payload(p_data date, p_turno text)
returns jsonb language plpgsql stable set search_path = public as $$
declare
  v_items jsonb;
  v_hora_ref text;
  v_is_after boolean;
  v_now_local timestamp;
begin
  select coalesce(jsonb_agg(public._checklist_item_to_json(ct)
                            order by coalesce(t.ordem, 9999), ct.item),
                  '[]'::jsonb)
    into v_items
    from public.checklist_turnos ct
    left join public.checklist_templates t
      on t.turno = ct.turno and t.item = ct.item
   where ct.data = p_data and ct.turno = p_turno;

  -- horario_referencia representativo do turno (mais cedo) e deadline da Manhã
  select min(horario_referencia) into v_hora_ref
    from public.checklist_templates where turno = p_turno;

  v_now_local := (now() at time zone 'America/Sao_Paulo');
  v_is_after := (p_turno = 'Manhã'
                 and (v_now_local::time) >= time '07:30');

  return jsonb_build_object(
    'data',              to_char(p_data, 'YYYY-MM-DD'),
    'turno',             p_turno,
    'horarioReferencia', v_hora_ref,
    'isAfterDeadline',   v_is_after,
    'items',             v_items,
    'summary',           public._checklist_summary(p_data, p_turno)
  );
end $$;

-- ===================== RPCs públicas =====================

-- Garante as linhas de hoje (data local SP) para o turno a partir do template,
-- sem duplicar (unique data,turno,item + on conflict do nothing), e retorna o turno.
create or replace function public.handover_checklist_gerar(p_token uuid, p_turno text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  v_data date;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if coalesce(p_turno,'') not in ('Manhã','Noite') then
    raise exception 'turno_invalido';
  end if;

  v_data := (now() at time zone 'America/Sao_Paulo')::date;

  insert into public.checklist_turnos
    (data, turno, horario_referencia, categoria, item, descricao, status)
  select v_data, t.turno, t.horario_referencia, t.categoria, t.item, t.descricao, 'Pendente'
    from public.checklist_templates t
   where t.turno = p_turno
  on conflict (data, turno, item) do nothing;

  return jsonb_build_object(
    'success', true,
    'checklistTurno', public._checklist_turno_payload(v_data, p_turno)
  );
end $$;

-- Atualiza status de um item; seta responsável (nome da sessão) e data_hora_check
-- (limpa quando volta para Pendente). Retorna item + summary do turno.
create or replace function public.handover_checklist_status(p_token uuid, p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  r public.checklist_turnos;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  if coalesce(p_status,'') not in ('Pendente','Feito','Não aplicável') then
    raise exception 'status_invalido';
  end if;

  update public.checklist_turnos
     set status          = p_status,
         responsavel     = case when p_status = 'Pendente' then null else s.nome end,
         data_hora_check = case when p_status = 'Pendente' then null else now() end
   where id = p_id
   returning * into r;
  if not found then raise exception 'checklist_item_nao_encontrado'; end if;

  return jsonb_build_object(
    'success', true,
    'checklistItem', public._checklist_item_to_json(r),
    'checklistSummary', public._checklist_summary(r.data, r.turno)
  );
end $$;

-- Atualiza a observação de um item. Retorna item + summary do turno.
create or replace function public.handover_checklist_observacao(p_token uuid, p_id uuid, p_observacao text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sessoes;
  r public.checklist_turnos;
begin
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;

  update public.checklist_turnos
     set observacao = nullif(p_observacao, '')
   where id = p_id
   returning * into r;
  if not found then raise exception 'checklist_item_nao_encontrado'; end if;

  return jsonb_build_object(
    'success', true,
    'checklistItem', public._checklist_item_to_json(r),
    'checklistSummary', public._checklist_summary(r.data, r.turno)
  );
end $$;

-- ===================== GRANTS =====================

-- 1) Lock tables from direct anon/authenticated access.
revoke all on public.checklist_templates from anon, authenticated;
revoke all on public.checklist_turnos    from anon, authenticated;

-- 2) Revoke default PUBLIC execute on every function defined here.
revoke all on function public._handover_fmt_ts(timestamptz)                       from public;
revoke all on function public._checklist_item_to_json(public.checklist_turnos)    from public;
revoke all on function public._checklist_summary(date, text)                      from public;
revoke all on function public._checklist_turno_payload(date, text)               from public;
revoke all on function public.handover_checklist_gerar(uuid, text)               from public;
revoke all on function public.handover_checklist_status(uuid, uuid, text)        from public;
revoke all on function public.handover_checklist_observacao(uuid, uuid, text)    from public;

-- 3) Internal helpers must not be anon-callable (defensive, Supabase auto-grants).
revoke execute on function public._handover_fmt_ts(timestamptz)                    from anon, authenticated;
revoke execute on function public._checklist_item_to_json(public.checklist_turnos) from anon, authenticated;
revoke execute on function public._checklist_summary(date, text)                   from anon, authenticated;
revoke execute on function public._checklist_turno_payload(date, text)            from anon, authenticated;

-- 4) Grant EXECUTE to anon ONLY on the public-facing checklist RPCs.
grant execute on function public.handover_checklist_gerar(uuid, text)            to anon;
grant execute on function public.handover_checklist_status(uuid, uuid, text)     to anon;
grant execute on function public.handover_checklist_observacao(uuid, uuid, text) to anon;
