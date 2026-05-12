# Handover v67 (oficial) | v68 (staging)

Projeto: Handover - Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit atual: `f682b87`

## Deployment Oficial (v67 — ativo)

Deployment: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Status: **APROVADA** (smoke 2026-05-12)

## Deployment Staging (v68 — aguardando smoke)

Deployment: `AKfycbwrk9JXS2-6XsIFan8ky7YCtBvGm3mhcfUptaKXe6iBm5XLO-tOQx2d8QTuN15aIcSo`

URL staging: `https://script.google.com/macros/s/AKfycbwrk9JXS2-6XsIFan8ky7YCtBvGm3mhcfUptaKXe6iBm5XLO-tOQx2d8QTuN15aIcSo/exec`

Status: **STAGING** — aguardando execução do runbook + smoke

---

## Smoke v67 (oficial)

| Item | Resultado | Detalhe |
|------|-----------|---------|
| Login/PIN | OK | — |
| Atualizar agora | OK | Sem TypeError |
| Encomenda sem preço | OK | Preço não obrigatório |
| Data obrigatória | OK | Data prevista continua obrigatória |
| Preço BRL | OK | Formatação R$ funcionando |
| Modal Encomenda | OK | Fecha rapidamente após Salvar |
| Modal Pendência | OK | Fecha rapidamente após Salvar |
| Medicamentos | OK | Grava corretamente |
| Compras_Medicamentos | OK | Espelha corretamente |
| Checklist Manhã | OK | Instantâneo (cache) |
| Checklist Tarde/Noite | LEVE | ~25s primeiro carregamento; aceitável |
| Falhas críticas | NENHUMA | — |
| Falhas médias | NENHUMA | — |

---

## Virada de Produção (v68) — Status

### Código implementado (commit `c79a025`)

- `COMPRAS_SPREADSHEET_ID_KEY` e `COMPRAS_SPREADSHEET_TITLE` adicionados
- `getComprasSpreadsheet_()` — abre planilha Compras_Drogarias_Conceito via propriedade
- `getComprasMedicamentosSheet_()` — usa `getComprasSpreadsheet_()` (não Handover)
- `setupSpreadsheet()` — pula `COMPRAS_MEDICAMENTOS` (planilha separada)
- `ensureSheetHeadersFor_()` — remove `COMPRAS_MEDICAMENTOS` do branch legacy-additive
- `handleComprasMedicamentosEdit_` — valida contra planilha de Compras
- `instalarTriggerComprasMedicamentos_` — instala trigger na planilha de Compras
- `backupHandoverPlanilha()` — copia planilha Handover como backup
- `setupComprasPlanilha()` — cria `Compras_Drogarias_Conceito` e configura propriedade
- `renomearAbaComprasLegacy()` — renomeia/oculta aba legada no Handover
- `zerarHandoverParaProducao()` — limpa dados de teste das abas operacionais

### Passos manuais pendentes (executar no editor GAS)

Ver runbook completo: `tasks/producao-virada-runbook.md`

| # | Função GAS | Status |
|---|-----------|--------|
| 1 | `backupHandoverPlanilha` | ⬜ Pendente |
| 2 | `setupComprasPlanilha` | ⬜ Pendente |
| 3 | Verificar `COMPRAS_SPREADSHEET_ID` em Script Properties | ⬜ Pendente |
| 4 | `sincronizarComprasMedicamentos_` (migrar dados) | ⬜ Pendente |
| 5 | `renomearAbaComprasLegacy` | ⬜ Pendente |
| 5.1 | `instalarTriggerComprasMedicamentos` | ⬜ Pendente |
| 6 | `zerarHandoverParaProducao` | ⬜ Pendente |
| 7 | Smoke na URL staging v68 | ⬜ Pendente |
| 8 | `clasp deploy` no deployment oficial | ⬜ Pendente |

---

## Histórico de Versões

| Versão | Status |
|--------|--------|
| v57 | ROLLBACK TARGET (2026-05-11) — base estável |
| v58 | APROVADO COM RESSALVAS (2026-05-11) |
| v59 | REPROVADA (2026-05-11) — P0: constant variable / persistência |
| v60 | criada em ciclo anterior |
| v61 | demo checklist temporária (deployment separado, não oficial) |
| v62 | REPROVADA (2026-05-11) — TypeError persistiu |
| v63 | APROVADA (2026-05-11) — fix const→let em ensureTodayChecklistForTurno_ |
| v64 | APROVADA (2026-05-11) — UX checklist: cache, sync status, botão renomeado |
| v65 | APROVADA (2026-05-11) — modal fecha após sucesso real (v1) |
| v66 | APROVADA (2026-05-12) — popup BRL, separação guarda success/record |
| v67 | **ATIVA OFICIAL** (2026-05-12) — modal otimista, preço opcional, checklist rápido |
| v68 | **STAGING** (2026-05-12) — Compras planilha separada, funções virada produção |

## Próximo Passo

Executar o runbook `tasks/producao-virada-runbook.md` no editor GAS (Fases 1–6), depois smoke na URL staging v68, depois promover para deployment oficial.
