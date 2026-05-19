# Handover v84 (oficial)

Projeto: Handover — Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit do código em produção (v84): `dcdad30` — `fix(handover): inclui compras reposicao no historico e oculta categoria`

## Deployment oficial (v84 — ativo)

Deployment: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Versão interna do deployment: `@90` — descrição: **Handover v84 historico compras reposicao**

Status: **APROVADA EM PRODUÇÃO** (validação manual 2026-05-19)

Rollback: **NÃO**

---

## Validação manual v84

| Item | Resultado | Detalhe |
|------|-----------|---------|
| Categoria sumiu do Novo registro | OK | Campo técnico interno |
| Pendência abre sem Categoria | OK | — |
| Encomenda abre sem Categoria / Tipo | OK | Tipo = Encomenda interno |
| Compra e reposição abre sem Categoria | OK | Categoria = Compras interno |
| Item comprado aparece no Histórico | OK | Compra e reposição |
| Item cancelado aparece no Histórico | OK | Compra e reposição |
| Filtro Histórico mostra Compras e reposição | OK | — |
| Compras_Reposicao preservado | OK | — |
| Encomendas preservadas | OK | — |
| Pendências preservadas | OK | — |
| POP | NÃO tocado | — |
| Login/PIN / Checklist / Medicamentos | NÃO tocados | — |
| Setup / reset / limpeza | NÃO executados | — |
| Falhas críticas | NENHUMA | — |

### Escopo da entrega v84

- **Campo Categoria** ocultado do modal Novo registro — valor técnico (Geral / Medicamentos / Compras_Reposicao) permanece interno.
- **Campo Tipo** ocultado em Encomenda de medicamentos — valor `Encomenda` preenchido internamente.
- **Histórico** agora inclui itens de Compra e reposição com status Comprado, Cancelado ou Resolvido.
- Filtro do Histórico exibe seção "Compras e reposição".
- Não usa `sheet.clear()`, não usa `deleteRow`, não move linhas, não apaga dados.
- POP, Login/PIN, Checklist e planilha Compras não tocados.

---

## Referência — v83 UX formulários (@89)

| Item | Resultado |
|------|-----------|
| Clique Encomenda de medicamentos corrigido | OK |
| `openNovoRegistroEncomenda_` adicionada | OK |
| Descrição do menu Encomenda corrigida | OK |
| Campos Categoria e Tipo ocultos no formulário | OK |
| Campos Categoria, Unidade e Motivo removidos de Compra e reposição | OK |
| Atalhos Amanhã / Depois de amanhã / Semana que vem em Compra e reposição | OK |

Commit v83: `76511d9` — versão interna `@89`

---

## Referência — v82 fluxo Compra e reposição (@88)

Novo fluxo de Compra e reposição implementado como tab separada.
Commits: `cbe6353..b00f1ed` — versão interna `@88`

---

## Referência — v81 filtro operacional Compras_Medicamentos (@87)

| Item | Resultado |
|------|-----------|
| Filtro `aplicarFiltroComprasAtivas` aplicado | OK (época v81) |
| Comprado / Cancelado ocultos na aba principal | OK |
| Pendente / Não encontrado visíveis | OK |
| Dados preservados | OK |

Commit v81: `61f8fdd` — versão interna `@87`

---

## Referência — v80 arquivamento por status (@86)

| Item | Resultado |
|------|-----------|
| Comprado → upsert em Compras_Compradas | OK (época v80) |
| Cancelado → upsert em Compras_Canceladas | OK (época v80) |
| Dados não apagados | OK |

Commit v80: `409e5cd` — versão interna `@86`

---

## Referência — Smoke v68 (virada 2026-05-12)

Registro histórico da virada Compras / produção limpa.

---

## Histórico de versões (trecho)

| Versão | Status |
|--------|--------|
| v68 | Virada produção — Compras separada |
| v77 | Reabertura Histórico (@77) |
| v80 | Arquivamento Comprado/Cancelado (@86) |
| v81 | APROVADA (2026-05-15) — filtro compras ativas (@87) |
| v82 | APROVADA — novo fluxo Compra e reposição (@88) |
| v83 | APROVADA — UX formulários, clique Encomenda (@89) |
| **v84** | **ATIVA OFICIAL** (2026-05-19) — Histórico unificado, Categoria interna (@90) |

---

## Próximo passo

Operação normal. Sistema em produção com Histórico unificado (Medicamentos + Compra e reposição).
