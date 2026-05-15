# Handover v81 (oficial)

Projeto: Handover — Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit do código em produção (v81): `61f8fdd` — `fix(handover): aplica filtro de compras ativas na planilha de compras`

## Deployment oficial (v81 — ativo)

Deployment: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Versão interna do deployment: `@87` — descrição: **Handover v81 filtro compras ativas**

Status: **APROVADA EM PRODUÇÃO** (validação manual 2026-05-15)

Rollback: **NÃO**

---

## Validação manual v81 — filtro operacional Compras_Medicamentos

| Item | Resultado | Detalhe |
|------|-----------|---------|
| Filtro aplicado (`aplicarFiltroComprasAtivas`) | OK | Executado no Apps Script Editor |
| Comprado oculto na aba principal | OK | `Status_Compra = Comprado` |
| Cancelado oculto na aba principal | OK | `Status_Compra = Cancelado` |
| Pendente de compra visível | OK | Fluxo operacional de compras |
| Não encontrado visível | OK | Fluxo operacional de compras |
| Dados preservados | OK | Sem apagar linhas |
| Compras_Compradas | OK | Intacta (arquivo v80) |
| Compras_Canceladas | OK | Intacta (arquivo v80) |
| Web App oficial alinhado | OK | Deployment @87 |
| POP | NÃO tocado | — |
| Login/PIN / Checklist / Medicamentos | NÃO tocados | — |
| Reset / limpeza / smoke automático | NÃO executados | — |

### Escopo da entrega v81

- Função **`aplicarFiltroComprasAtivas()`** na planilha `Compras_Drogarias_Conceito`, aba **`Compras_Medicamentos`**.
- Critério de filtro em **`Status_Compra`**: oculta **Comprado** e **Cancelado** via `hiddenValues`.
- Linhas permanecem fisicamente na aba principal; **`ID_Handover`** preservado.
- Integração ao reaplicar layout: chamada ao final de **`applyComprasMedicamentosLayout_`**.
- Não usa `sheet.clear()`, não usa `deleteRow`, não move linhas.
- Não altera abas **`Compras_Compradas`** / **`Compras_Canceladas`** (arquivamento v80 mantido).

---

## Referência — v80 arquivamento por status (@86)

| Item | Resultado |
|------|-----------|
| Comprado → upsert em Compras_Compradas | OK (época v80) |
| Cancelado → upsert em Compras_Canceladas | OK (época v80) |
| Compras_Medicamentos como aba principal | OK |
| Dados não apagados | OK |

Commit v80: `409e5cd` — versão interna `@86` — *Handover v80 compras por status*

---

## Referência — v77 reabertura Histórico (@77)

Registro histórico. Commit `039a758`. Não invalida a aprovação v81.

| Item | Resultado (época v77) |
|------|------------------------|
| Reabertura Histórico + fallback Medicamentos cancelados | OK |
| POP / Compras reset | NÃO tocados |

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
| **v81** | **ATIVA OFICIAL** (2026-05-15) — filtro compras ativas na aba principal (@87) |

---

## Próximo passo

Operação normal. Se o filtro for removido manualmente na UI da planilha, reaplicar `aplicarFiltroComprasAtivas()` ou `aplicarLayoutComprasMedicamentos()`.
