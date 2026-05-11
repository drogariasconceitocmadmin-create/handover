# Incidente Handover — Rollback v62 → v57

Projeto: Handover - Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Data: 2026-05-11

## Resultado

Status geral: **ROLLBACK_V57**

Versão antes: @62 (publicada como "v61 hotfix refresh/render")

Rollback: **SIM** — deployment voltou para @57

Versão ativa final: **57**

POP tocado: **NÃO**

## Smoke v62

| Item | Resultado | Detalhe |
|------|-----------|---------|
| TypeError na abertura | **FALHOU P0** | `TypeError: Assignment to constant variable` visível na tela |
| Login | NÃO TESTADO | Bloqueado pelo TypeError |
| Atualizar agora | NÃO TESTADO | — |
| Medicamentos | NÃO TESTADO | — |
| Checklist | NÃO TESTADO | — |

## Rollback

```
clasp deploy --versionNumber 57 --deploymentId AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw
```

Saída: `Deployed AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw @57`

Confirmado via `clasp deployments`: `@57`.

## Histórico de Rollbacks

| Versão | Data | Motivo | Rollback para |
|--------|------|--------|---------------|
| v59 | 2026-05-11 | Persistência pós-logout falhou. Erro "constant variable" ao Atualizar agora. | v57 |
| v62 | 2026-05-11 | `TypeError: Assignment to constant variable` persistiu mesmo após hotfix refresh/render. | v57 |

## Diagnóstico

**Erro:** `TypeError: Assignment to constant variable`

**Diagnóstico estático (realizado):** análise completa de `Index.html` e `Code.gs` não encontrou reatribuição direta de variável `const`. Nenhum `for (const i = ...)`, nenhuma reatribuição top-level encontrada.

**Hipótese principal:** o erro ocorre dentro do callback `withSuccessHandler` de `google.script.run.refreshDashboardBundle`. O GAS API não envolve callbacks do `withSuccessHandler` em `try/catch` — qualquer `TypeError` dentro do callback propaga como exceção não capturada (visível no console do Chrome mas não tratada pela aplicação).

## Próximos Passos Obrigatórios

1. **Capturar stack trace** via Chrome DevTools (F12 → Console) clicando "Atualizar agora" na versão afetada. O stack trace apontará a linha exata.
2. Identificar e corrigir cirurgicamente a linha com o `TypeError`.
3. Publicar correção como v63+.
4. Smoke completo antes de promover para produção.

## Histórico de Versões

| Versão | Status |
|--------|--------|
| v57 | **ATIVA** — produção após rollbacks de v59 e v62 |
| v58 | APROVADO COM RESSALVAS (2026-05-11) |
| v59 | REPROVADA (2026-05-11) — P0: constant variable / persistência |
| v60 | criada em ciclo anterior |
| v61 | demo checklist temporária (deployment separado, não oficial) |
| v62 | **REPROVADA** (2026-05-11) — TypeError persistiu |

## Veredito

v62 **REPROVADA**. Rollback imediato para v57 efetuado e confirmado.
`TypeError: Assignment to constant variable` persiste entre versões.
**Próxima ação obrigatória:** capturar stack trace no DevTools antes de qualquer novo patch.
POP não tocado.
