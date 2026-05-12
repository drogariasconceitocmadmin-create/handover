# Handover v77 (oficial)

Projeto: Handover — Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit do código em produção (v77): `039a758` — `fix(handover): corrige reabertura de itens do historico`

## Deployment oficial (v77 — ativo)

Deployment: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Versão interna do deployment: `@77` — descrição: **Handover v77 reabrir historico**

Status: **APROVADA EM PRODUÇÃO** (validação manual 2026-05-07)

Rollback: **NÃO**

---

## Validação manual v77 — reabertura no Histórico

| Item | Resultado | Detalhe |
|------|-----------|---------|
| Medicamento cancelado reabriu | OK | Fluxo fallback Medicamentos |
| Voltou para Medicamentos | OK | Fila Pendente |
| Histórico atualizado | OK | Após reabrir |
| Atualizar agora preservou | OK | Sem regressão |
| Trilha de auditoria | OK | Preservada / registrada |
| Pendência comum reabriu | OK | Geral a partir do arquivo |
| POP | NÃO tocado | — |
| Compras / reset / runbooks destrutivos | NÃO tocados | Sem `sincronizarComprasMedicamentos_`, sem `zerarHandoverParaProducao` nesta entrega |

### Escopo da correção v77

- Reabrir / reverter itens do **Histórico** sem assumir que todo registro está só em **Arquivo_Resolvidos**.
- **Fallback** para medicamentos **cancelados** ainda na aba **Medicamentos** (listados no histórico quando não há linha no arquivo).
- Busca no arquivo por **ID** e, quando existir coluna, **ID_Handover** (aliases compatíveis com o sistema).
- Mensagens de erro mais claras para o operador quando o item não for localizável.
- **Auditoria** alinhada ao fluxo existente (sem PIN/token em relatório).

---

## Referência — Smoke v68 (virada 2026-05-12)

Registro histórico da virada Compras / produção limpa. Não invalida a aprovação v77.

| Item | Resultado (época v68) |
|------|------------------------|
| Login/PIN | OK |
| Dashboard limpo | OK |
| Criar Pendência | OK |
| Encomenda sem preço | OK |
| Encomenda com data | OK |
| Medicamentos (Handover) | OK |
| Compras_Medicamentos (nova planilha) | OK |
| Aba antiga não recebe registro | OK |
| Atualizar agora | OK |
| Checklist Manhã | OK |
| Trigger Compras → Handover | OK |
| Falhas críticas / médias | NENHUMA |

---

## Virada de produção (v68) — concluída (2026-05-12)

| # | Fase | Função GAS | Status |
|---|------|-----------|--------|
| 1 | Backup | `backupHandoverPlanilha` | ✅ BACKUP_20260512_1406 |
| 2 | Criar planilha Compras | `setupComprasPlanilha` | ✅ Compras_Drogarias_Conceito |
| 3 | Script Properties | — | ✅ COMPRAS_SPREADSHEET_ID |
| 4 | Migrar dados legados | `sincronizarComprasMedicamentos_` | ⛔ NÃO EXECUTADA |
| 5 | Renomear aba legada | `renomearAbaComprasLegacy` | ✅ LEGACY_Compras_20260512 |
| 5.1 | Trigger Compras | `instalarTriggerComprasMedicamentos` | ✅ |
| 6 | Zerar Handover | `zerarHandoverParaProducao` | ✅ (época v68) |
| 7 | Smoke staging | URL staging | ✅ APROVADO |
| 8 | Deploy oficial | `clasp deploy` | ✅ (época @71) |

---

## Histórico de versões (trecho)

| Versão | Status |
|--------|--------|
| v57–v67 | Ver tabela histórica no repositório / JSON legado |
| v68 | Virada produção — Compras separada, baseline 2026-05-12 |
| v69–v76 | Evolução (histórico resolvidos/cancelados, filtros, etc.) — ver git |
| **v77** | **ATIVA OFICIAL** (2026-05-07) — reabertura Histórico + fallback Medicamentos cancelados + busca ID/ID_Handover |

---

## Próximo passo

Operação normal. Monitorar reaberturas no Histórico e feedback da loja.
