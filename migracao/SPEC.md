# SPEC — Migração 1:1 Handover (Apps Script → Supabase)

Contrato de implementação para os agentes. **Leia primeiro** as migrations existentes (padrão de segurança e estilo):
`handover-v2/supabase/migrations/0001_auth_pendencias.sql`, `0002_harden_grants.sql`, `0003_fix_pgcrypto_search_path.sql`.

Projeto Supabase: `handover` (ref `pxswpufbkisdniojwdtt`). Timezone: `America/Sao_Paulo`.

---

## 1. Convenções obrigatórias (toda migration/RPC)

- **Tabelas**: `create table if not exists public.<nome>`; PK `id uuid default gen_random_uuid()`; `alter table ... enable row level security;` **sem nenhuma policy** (anon nunca lê direto).
- **Grants de tabela**: `revoke all on public.<tabela> from anon, authenticated;`
- **Funções**: `language plpgsql security definer set search_path = public, extensions` (o `extensions` é necessário p/ pgcrypto — ver 0003).
- **Token**: toda RPC pública recebe `p_token uuid` e valida no início:
  ```sql
  s := public.handover_check_session(p_token);
  if s.token is null then raise exception 'sessao_invalida'; end if;
  ```
  (`handover_check_session` retorna `public.sessoes`; tem `usuario`, `nome`, `perfil`.)
- **Grants de função**: `revoke all on function ... from public;` e depois `grant execute on function ... to anon;` **apenas** nas RPCs públicas. Funções internas (`_`-helpers) ficam sem grant.
- **Perfil**: gates por `s.perfil` quando aplicável (`admin`, `gerente`, `operador`, `comprador`).
- **Auditoria**: toda ação de escrita grava em `public.auditoria` (ver §4) via helper `public._handover_audit(...)`.
- **Idempotência**: `create or replace function`, `create table if not exists`, `create index if not exists`. Migrations aplicáveis mais de uma vez.

## 2. Shape de retorno (CRÍTICO — frontend 1:1)

O frontend lê chaves **PascalCase iguais aos cabeçalhos das planilhas** (`item.Medicamento`, `item.Status`, `item.Pre_Pago`, `item.Ultima_Acao_Em`...). Portanto **toda RPC retorna `jsonb` montado com essas chaves** via `jsonb_build_object`, não as colunas snake_case cruas.

Helpers de formatação (crie como funções `_`):
- timestamp → `to_char(v at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS')`
- date → `to_char(v, 'YYYY-MM-DD')`
- boolean → booleano JSON real
- `Preco_Venda` → número (numeric)

Cada domínio terá um `_<dominio>_to_json(row)` que devolve o objeto PascalCase completo + `'Origem'`. Ex. medicamentos: `{ID, Origem:'Medicamentos', Timestamp, Tipo, Medicamento, Pre_Pago, Cliente, Atendente, Previsao_Entrega, Comprado, Entregue, Telefone, Status, Status_Aviso_WhatsApp, Data_Aviso_WhatsApp, Preco_Venda, Ultima_Acao_Por, Ultima_Acao_Em, Revertido_Por, Data_Reversao, Status_Anterior, Motivo_Reversao, Cancelado_Por, Data_Cancelamento, Motivo_Cancelamento, Fornecedor_Compra, Codigo_Compra_Fornecedor, Forma_Recebimento, Observacao_Solicitacao, Pedido_ID, Item_Indice, Total_Itens, Quantidade_Item, Observacao_Item}`.

Envelopes esperados pelo frontend:
- criar item único → `{ "success": true, "record": <json> }`
- criar multi-item → `{ "success": true, "records": [<json>, ...] }`
- comprar/entregar/reverter/whatsapp/editar → `{ "success": true, "record": <json> }` (whatsapp inclui `"whatsAppUrl"`)
- resolver/cancelar (sai da fila) → `{ "success": true, "removedId": "<id>" }`
- login → `{ "success": true, "token", "usuario", "nome", "perfil", "displayName" }` (já existe; ajustar `handover_login` p/ retornar `success` em vez de `ok` **ou** adicionar shim no front — ver nota)
- erros: `raise exception` com mensagem curta; o front mostra a mensagem.

> Nota login: o `handover_login` atual retorna `{ok, token, ...}`. O frontend legado espera `{success, token, usuario, nome, perfil, displayName}`. **Resolver no adapter do front** (mapear `ok→success`) para não mexer na função já validada, OU criar `handover_login_v2`. Preferir o adapter.

## 3. Máquina de status — Medicamentos

Status possíveis: `Pendente`, `Comprado`, `Entregue`, `Cancelado`, `Não encontrado`.
Função `public._medicamento_sync_status(comprado bool, entregue bool, status_atual text) returns text`:
- se `status_atual = 'Cancelado'` e não comprado/entregue → mantém `Cancelado`
- senão se `entregue` → `Entregue`
- senão se `comprado` → `Comprado`
- senão → `Pendente`
(`Não encontrado` é setado explicitamente pelo comprador; não é derivado.)
Regras de ação (espelham o Code.gs):
- **comprar**: `comprado=true`, status sync → `Comprado`.
- **entregar**: `comprado=true, entregue=true` → `Entregue` (sai da fila ativa; aparece no histórico).
- **reverter**: `comprado=false, entregue=false` → `Pendente`; grava `Revertido_Por/Data_Reversao/Status_Anterior/Motivo_Reversao`.
- **cancelar**: status `Cancelado`, grava `Cancelado_Por/Data_Cancelamento/Motivo_Cancelamento`; sai da fila (vai p/ histórico).
- **não encontrado** (comprador): status `Não encontrado`; gera `Mensagem_Cliente` (ver §7).
Fila ativa (dashboard) exclui `Cancelado` e `Entregue`. Histórico = `Entregue`/`Cancelado`/`Não encontrado` (e resolvidos de Geral/Compras).

## 4. Tabelas novas (colunas)

Tipos: `id uuid pk`, datas `timestamptz` (exceto `Previsao_Entrega`/`Data_Vencimento`/`Previsao_Desejada` = `date`; `Hora_Vencimento` = `text`), flags `boolean default false`, `preco_venda numeric(10,2)`, textos `text`.

**`medicamentos`** (snake_case): id, criado_em (=Timestamp), tipo, medicamento, pre_pago, cliente, atendente, previsao_entrega, comprado, entregue, telefone, status (default 'Pendente'), status_aviso_whatsapp, data_aviso_whatsapp, preco_venda, ultima_acao_por, ultima_acao_em, revertido_por, data_reversao, status_anterior, motivo_reversao, cancelado_por, data_cancelamento, motivo_cancelamento, fornecedor_compra, codigo_compra_fornecedor, forma_recebimento, observacao_solicitacao, mensagem_cliente, observacao_compra, pedido_id uuid, item_indice int, total_itens int, quantidade_item text, observacao_item text. Índice: `(status, criado_em desc)`, `(pedido_id)`.

**`compras_reposicao`**: id, data_solicitacao, categoria_compra, item, quantidade, unidade, prioridade, motivo, solicitante, observacao, fornecedor_sugerido, previsao_desejada, status_compra (default 'Pendente de compra'), status_handover (default 'Pendente'), comprado, comprado_por, data_compra, cancelado, cancelado_por, data_cancelamento, motivo_cancelamento, ultima_acao_por, ultima_acao_em, excluido, excluido_por, excluido_em, pedido_id uuid, item_indice int, total_itens int, quantidade_item text, observacao_item text. Índice `(status_compra, data_solicitacao desc)`, `(pedido_id)`.

**`auditoria`**: id_auditoria uuid pk, data_hora timestamptz default now(), acao text, origem text, id_item uuid, usuario text, nome text, perfil text, campo text, valor_anterior text, valor_novo text, resumo text. Índice `(id_item, data_hora)`.

**`checklist_templates`**: id uuid pk, turno text, ordem int, item_id text, categoria text, item text, descricao text, horario_referencia text. Único `(turno, item_id)`. (Seed em §6 / `CHECKLIST_TEMPLATES.md`.)

**`checklist_turnos`**: id uuid pk, data date, turno text, horario_referencia text, categoria text, item text, descricao text, status text default 'Pendente', responsavel text, data_hora_check timestamptz, observacao text. Único `(data, turno, item)`.

Constantes:
- Status_Compra (compras): `Pendente de compra`, `Comprado`, `Não encontrado`, `Cancelado`.
- Prioridade: `Baixa`, `Normal`, `Alta`, `Urgente`.
- Forma_Recebimento: `A combinar`, `Retira na loja`, `Entregar no endereço cadastrado`.
- Fornecedor_Compra: `Não informado`, `Panpharma`, `Santa Cruz` (código só p/ Panpharma/Santa Cruz).
- Checklist status: `Pendente`, `Feito`, `Não aplicável`.
- `usuarios.perfil` CHECK passa a aceitar `comprador` (além de operador/gerente/admin).

## 5. RPCs (assinatura → comportamento). Todas `p_token uuid` primeiro.

**Migration 0004 — medicamentos + auditoria**
- `handover_medicamento_criar(p_token, p_payload jsonb)` — `p_payload`: {tipo, medicamento, prePago, cliente, atendente, telefone, previsaoEntrega, precoVenda, fornecedorCompra, codigoCompraFornecedor, formaRecebimento, observacaoSolicitacao, itens:[{medicamento,quantidade,observacaoItem}]}. Se `itens` tem ≥1 → cria N linhas com mesmo `pedido_id`, item_indice/total_itens. Falta: sem cliente/telefone/preço. Encomenda: exige `previsaoEntrega`. Audita "Criado". Retorna `{success, records|record}`.
- `handover_medicamento_comprar(p_token, p_id)` / `_entregar(p_token,p_id)` / `_reverter(p_token,p_id,p_motivo)` / `_cancelar(p_token,p_id,p_motivo)`.
- `handover_medicamento_whatsapp(p_token, p_id)` — exige Comprado/Entregue/Resolvido parcialmente; marca `Status_Aviso_WhatsApp='Tentativa registrada'`, `Data_Aviso_WhatsApp=now()`; monta `whatsAppUrl` `https://wa.me/<fone normalizado>?text=<urlencoded msg>` (msg conforme §7). Retorna `{success, whatsAppUrl, record}`.
- `handover_item_editar(p_token, p_id, p_origem, p_payload jsonb)` — origem `Geral`|`Medicamentos`; aplica patch de campos editáveis (ver Code.gs `buildAllowedEditPatch_`); audita cada campo alterado (anterior→novo). Retorna `{success, itemAtualizado}`.
- `handover_audit_trail(p_token, p_id)` — lista auditoria do item (ordem desc), chaves PascalCase `{ID_Auditoria, Data_Hora, Acao, Campo, Valor_Anterior, Valor_Novo, Resumo, Nome, Usuario}`. Retorna `{success, auditoria:[...]}`.

**Migration 0005 — compras_reposicao**
- `handover_compra_reposicao_criar(p_token, p_payload)` (multi-item, mesmo padrão).
- `handover_compra_reposicao_comprar(p_token, p_id)` / `_cancelar(p_token,p_id,p_motivo)`.

**Migration 0006 — comprador**
- `alter table usuarios` CHECK + perfil `comprador`.
- `handover_compras_listar(p_token)` — gate perfil in (comprador,gerente,admin). Retorna `{success, medicamentos:[...], comprasReposicao:[...]}` só com itens a comprar (medicamentos status Pendente; compras_reposicao status_compra 'Pendente de compra'), shape PascalCase, agrupáveis por Pedido_ID no front.
- `handover_compra_marcar(p_token, p_origem, p_id, p_status, p_obs)` — `p_origem` Medicamentos|ComprasReposicao; `p_status` ∈ Status_Compra. Aplica máquina de status; `Não encontrado` → grava `Mensagem_Cliente`. Audita. Retorna `{success, record}`.

**Migration 0007 — checklist**
- seed `checklist_templates` (de `CHECKLIST_TEMPLATES.md`).
- `handover_checklist_gerar(p_token, p_turno)` — garante linhas de hoje (data local SP) p/ o turno a partir do template (insert das que faltam; sem duplicar). Retorna `{success, checklistTurno:{data,turno,horarioReferencia,isAfterDeadline,items:[...],summary:{...}}}`. `summary`: totalItens, itensFeitos, itensNaoAplicaveis, itensPendentes, percentualConcluido. `isAfterDeadline` = turno Manhã e hora local ≥ 07:30.
- `handover_checklist_status(p_token, p_id, p_status)` — status ∈ Pendente/Feito/Não aplicável; seta responsavel (nome da sessão) e data_hora_check (vazio se Pendente). Retorna `{success, checklistItem, checklistSummary}`.
- `handover_checklist_observacao(p_token, p_id, p_observacao)` — idem retorno.
- Itens do checklist no shape `{ID, Data, Turno, Horario_Referencia, Categoria, Item, Descricao, Status, Responsavel, Data_Hora_Check, Observacao}`.

**Migration 0008 — dashboard + histórico**
- `handover_dashboard_bundle(p_token, p_turno)` → `{geral:[...], medicamentos:[...], comprasReposicao:[...], checklistTurno:{...}, bundleTurno}`. geral = pendencias não resolvidas/não excluídas; medicamentos = status != Cancelado e não Entregue; comprasReposicao = status_compra ativo (não Comprado/Cancelado). Turno default por hora (Manhã 07–13:59, senão Noite).
- `handover_historico(p_token, p_limit)` → `{success, historico:[...]}` unindo: pendencias resolvidas (Estado_Arquivo 'Resolvido'/'Reaberto'), medicamentos Entregue/Cancelado, compras_reposicao Comprado/Cancelado. Cada item com `Origem`, `Estado_Arquivo`, campos de auditoria. Ordena por data de fechamento desc; limita.
- `handover_historico_reabrir(p_token, p_id, p_motivo)` → recria/reativa como pendente; Geral cria nova linha com `reaberto_de`; Medicamentos cancelado/entregue volta a Pendente; Compras volta a 'Pendente de compra'. Audita. Retorna `{success, tipo, record}`.

**Migration 0009 — admin usuários** (gate admin)
- `handover_usuario_criar(p_token, p_nome, p_usuario, p_perfil)`, `handover_usuario_reset_pin(p_token, p_usuario, p_pin)` (reusa lógica de `handover_set_pin`), `handover_usuario_ativar/inativar(p_token, p_usuario)`.

## 6. Checklist — ver `CHECKLIST_TEMPLATES.md` (conteúdo verbatim Manhã + Noite). Turnos: `Manhã`, `Noite` (Tarde do legado foi descontinuado).

## 7. Mensagens
- **WhatsApp (cliente)** por `Forma_Recebimento` (texto exato no Code.gs `buildWhatsAppMessage_`): saudação "Olá, <Nome>!" + variação Retira/Entrega/A combinar.
- **Não encontrado** (`buildMensagemClienteNaoEncontrado_`): 3 parágrafos (indisponível / alternativa equivalente / pergunta se quer alternativa).
- **Telefone**: normalizar BR (`normalizeBrazilPhone_`): só dígitos, prefixo 55, 12–13 dígitos.

## 8. Email de encomenda (Edge Function)
- `supabase/functions/enviar-encomenda-email/index.ts` (Deno + provedor, ex. Resend). Assunto/corpo iguais a `sendOrderEmail_` (ID, Medicamento, Cliente, Atendente, Pré-pago, Previsão + link de compras). Destinatário `drogariasconceitocm@gmail.com`.
- Disparo: trigger `after insert on medicamentos when (tipo='Encomenda')` → `pg_net` `http_post` para a function. Secret `RESEND_API_KEY` (a fornecer).

## 9. Aplicação
Aplicar cada migration via Supabase MCP `apply_migration` (project_id=pxswpufbkisdniojwdtt, name=`0004_medicamentos` etc.). Depois `get_advisors` (security) — não pode haver `function_search_path_mutable` novo nem tabela sem RLS.
