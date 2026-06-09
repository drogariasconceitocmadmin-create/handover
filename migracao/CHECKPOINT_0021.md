# Checkpoint — Migration 0021 (notificações de compras + cotação)

## Status: PRONTA — **NÃO APLICADA EM PRODUÇÃO**

**Projeto:** `handover` · `pxswpufbkisdniojwdtt` · sa-east-1
**Criada em:** 2026-06-09
**Contexto:** Issue #5 — Fase 1 backend (notificação in-app para admin/comprador
quando solicitação de encomenda/falta/compra é criada) + Fase 3 (registro de
cotação WhatsApp no histórico).

---

## O que a migration faz

### 1. CHECKs de `handover_notificacoes` expandidos
`tipo` e `ref_tipo` passam a aceitar: `tarefa_acompanhada`, `encomenda`,
`compra_reposicao`, `cotacao` (antes: só `tarefa_acompanhada`).

### 2. Helper interno `_notificar_perfis` — sem grant anon
`(p_perfis text[], p_excecao, p_titulo, p_corpo, p_tipo, p_ref_tipo, p_ref_id)` —
fan-out para `usuarios` **ativos** com perfil na lista, exceto o autor.

### 3. RPCs de criação recriadas com notificação inline
- `handover_medicamento_criar` (corpo da 0004 + notificação `encomenda`)
- `handover_compra_reposicao_criar` (corpo da 0005 + notificação `compra_reposicao`)
- **Uma notificação por solicitação** (não por item; multi-item agrega "N itens")
- Destinatários: perfis `admin` + `comprador` ativos, exceto o autor
- **Inline, não trigger** — `migracao/import.mjs` insere direto nas tabelas;
  trigger dispararia notificações em re-import

### 4. Nova RPC pública `handover_cotacao_registrar(p_token, p_itens)`
- Perfil exigido: `comprador`/`gerente`/`admin` (igual à fila do comprador, 0006)
- Grava 1 linha de auditoria por item (`acao='Cotação'`), preservando trilha por item
- Valida: array não-vazio, máx. 100 itens, ids uuid (inválidos ignorados)
- Retorna `{ok: true, registrados: N}`

---

## Decisões registradas

### Endurecimento de perfil NÃO aplicado a 3 RPCs (deliberado)
O plano original previa adicionar check de perfil a `handover_compra_reposicao_comprar`,
`handover_compra_reposicao_cancelar` e `handover_medicamento_cancelar`. A verificação
de call sites mostrou que **as três são usadas por fluxos de operador comum**:

| RPC | Call site de operador |
|-----|----------------------|
| `handover_medicamento_cancelar` | `web/medicamentos.js:334` (aba Encomendas), `web-redesign` `medAction` |
| `handover_compra_reposicao_comprar` | `web-redesign/handover-app.jsx:477` (botão Resolver, aba Compras e reposição) |
| `handover_compra_reposicao_cancelar` | `web/compras.js:144`, `web-redesign/handover-app.jsx:484` |

Endurecê-las quebraria o atendente cancelando encomenda de cliente e o fluxo
"Resolver" da loja. **A exigência da Issue #5 ("backend valida permissão") está
atendida nas RPCs da fila do comprador** (`compras_listar`, `compra_marcar`,
`compras_listar_status` — perfil-gated desde 0006/0015) e na nova
`cotacao_registrar`. As ações de loja permanecem session-gated, com auditoria
de usuário real em todas.

---

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/0021_notificacoes_compras.sql` | Migration principal |
| `migracao/preflight_0021_notificacoes_compras.sql` | Verificação pré-aplicação |
| `migracao/smoke_0021_notificacoes_compras.sql` | Smoke T1–T8 (BEGIN…ROLLBACK) |
| `migracao/anon_test_0021_notificacoes_compras.sql` | Teste de segurança anon A1–A5 |
| `migracao/rollback_0021_notificacoes_compras.sql` | Rollback de emergência |
| `migracao/CHECKPOINT_0021.md` | Este arquivo |

## Plano de aplicação (pendente de autorização explícita)
1. Rodar preflight → conferir 6 resultados esperados
2. `apply_migration` via MCP (project `pxswpufbkisdniojwdtt`)
3. Rodar smoke T1–T8 (rollback automático, nada persiste)
4. Rodar anon test A1–A5
5. `get_advisors` (security) → sem ERROR, sem `function_search_path_mutable`
6. Atualizar este checkpoint com resultados

## Resultados (preencher após aplicação)
- Preflight: —
- Smoke: —
- Anon: —
- Advisors: —
