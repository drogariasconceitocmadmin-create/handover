# Handover v98 (oficial)

Projeto: Handover - Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit publicado: `7276368` - `fix(handover): mostra nao encontrado em encomendas`

## Deployment oficial

Deployment: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Versao interna do deployment: `@105` - descricao: **Handover v98 nao encontrado encomendas**

Status: **APROVADA EM PRODUCAO** (validacao manual 2026-05-22)

Rollback: **NAO**

---

## Validacao manual v98

| Item | Resultado | Detalhe |
|------|-----------|---------|
| Encomenda Nao encontrado mostra badge | OK | Badge visual correto |
| Encomenda Nao encontrado aparece em Encomendas | OK | Filtro correto |
| Encomenda Nao encontrado aparece em Todos | OK | Filtro correto |
| Encomenda Nao encontrado aparece em Pendentes | OK | Filtro correto |
| Encomenda Nao encontrado NAO aparece em Comprados | OK | Filtro correto |
| Encomenda Nao encontrado NAO aparece em Entregues | OK | Filtro correto |
| Card agrupado mostra nao encontrados | OK | Resumo multi-itens correto |
| Faltas continuam funcionando | OK | Preservado |
| Compras_Reposicao continua funcionando | OK | Preservado |
| Atualizar agora mantem correto | OK | Refresh preservado |
| POP | NAO tocado | - |
| Setup | NAO executado | - |
| Dados apagados | NAO | - |
| Falhas criticas | NENHUMA | - |

### Escopo da entrega v98

- Backend: `enrichMedicamentosWithNaoEncontrado_` (nova funcao) le `Compras_Medicamentos` e sobreescreve `item.Status = 'Nao encontrado'` para itens cujo status ainda e pendente.
- `fetchData` e `refreshDashboardBundle` chamam o enriquecimento antes de retornar a lista de medicamentos.
- Frontend: `normalizeMedicationStatus_` recebe fallback por `item.Status_Compra` (v98).
- `buildMedicationGroupCardHtml_`: adiciona `nao_encontrado` ao `counts` e ao `summaryParts` (exibe "X/N nao encontrados" no resumo do card agrupado).
- Faltas (Compras_Reposicao) preservadas.
- Multi-itens preservado.
- POP, Login/PIN, Checklist, dados: intocados.

---

## Referencias recentes

| Versao | Status |
|--------|--------|
| v86 | APROVADA (2026-05-20) - Formatacao simples segura em textos longos (@93, commit `cb99c24`) |
| v94 | APROVADA - Status Nao encontrado propagado via trigger Compras_Medicamentos |
| v95 | APROVADA - Correcoes diversas de estabilidade |
| v96 | APROVADA (2026-05-22) - Backfill Compras_Reposicao com canonical key matching (@103, commit `1fc168a`) |
| v97 | APROVADA (2026-05-22) - Exibe Compras_Reposicao sincronizadas na UI (@104, commit `cdbff9b`) |
| **v98** | **ATIVA OFICIAL** (2026-05-22) - Nao encontrado em Encomendas/Medicamentos (@105, commit `7276368`) |

---

## Proximo passo

Operacao normal. Sistema em producao com badge "Nao encontrado" funcional em Encomendas, Faltas e Compras_Reposicao.
