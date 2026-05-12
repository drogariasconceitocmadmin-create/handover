# Handover v68 (oficial)

Projeto: Handover - Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit atual: `c79a025`

## Deployment Oficial (v68 — ativo)

Deployment: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Versão interna do deployment: `@71`

Status: **APROVADA EM PRODUÇÃO** (smoke 2026-05-12)

---

## Smoke v68 (oficial)

| Item | Resultado | Detalhe |
|------|-----------|---------|
| Login/PIN | OK | — |
| Dashboard limpo | OK | Sem cards antigos |
| Criar Pendência | OK | Card aparece |
| Encomenda sem preço | OK | Preço não obrigatório |
| Encomenda com data | OK | Data prevista obrigatória |
| Medicamentos (Handover) | OK | Linha gravada corretamente |
| Compras_Medicamentos (nova planilha) | OK | Linha espelhada na Compras_Drogarias_Conceito |
| Aba antiga não recebe registro | OK | LEGACY_Compras_20260512 oculta e inativa |
| Atualizar agora | OK | Sem erros |
| Checklist Manhã | OK | Carrega limpo |
| Trigger Compras → Handover | OK | Status_Compra atualiza Handover |
| Falhas críticas | NENHUMA | — |
| Falhas médias | NENHUMA | — |

---

## Virada de Produção — Concluída (2026-05-12)

| # | Fase | Função GAS | Status |
|---|------|-----------|--------|
| 1 | Backup | `backupHandoverPlanilha` | ✅ BACKUP_20260512_1406 — id: 1lmItMfShNxeIEX01C27Qy5v5s9VnCiod88enkcMxdq0 |
| 2 | Criar planilha Compras | `setupComprasPlanilha` | ✅ Compras_Drogarias_Conceito criada |
| 3 | Verificar Script Properties | — | ✅ COMPRAS_SPREADSHEET_ID confirmado |
| 4 | Migrar dados legados | `sincronizarComprasMedicamentos_` | ⛔ NÃO EXECUTADA — produção limpa, histórico não migrado |
| 5 | Renomear aba legada | `renomearAbaComprasLegacy` | ✅ LEGACY_Compras_20260512 oculta no Handover |
| 5.1 | Instalar trigger Compras | `instalarTriggerComprasMedicamentos` | ✅ Trigger ativo na Compras_Drogarias_Conceito |
| 6 | Zerar Handover | `zerarHandoverParaProducao` | ✅ Geral(4) Medicamentos(24) Arquivo(8) Checklist(551) Auditoria(2) |
| 7 | Smoke staging v70 | URL staging | ✅ APROVADO |
| 8 | Deploy oficial | `clasp deploy` @71 | ✅ Deployment oficial atualizado |

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
| v67 | APROVADA (2026-05-12) — modal otimista, preço opcional, checklist rápido |
| v68 | **ATIVA OFICIAL** (2026-05-12) — Compras planilha separada, virada produção limpa |
