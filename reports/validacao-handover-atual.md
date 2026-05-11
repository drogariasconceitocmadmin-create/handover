# Incidente Handover — Rollback v59 → v57

Projeto: Handover - Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit local: `e7eccee — fix(handover): v59 valida encomenda preco+data e modal cancelar medicamento`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Data incidente: 2026-05-11

## Resultado

Status geral: **ROLLBACK_V57**

Versão antes do incidente: 59

Rollback: **SIM** — deployment voltou para v57

Versão ativa final: **57**

POP tocado: **NÃO**

## Cronologia

| Hora | Evento |
|------|--------|
| ~13:29 | v59 publicada via `clasp push` + `clasp deploy @59` |
| ~13:30–13:46 | Smoke manual iniciado pelo operador |
| ~13:46 | Falha P0 detectada: constant variable + persistência |
| ~14:xx | Decisão: rollback imediato para v57 |
| ~14:xx | `clasp deploy --versionNumber 57 ...` executado. Deployment confirmado @57 |

## Smoke v59 — Resultados

| Item | Resultado | Detalhe |
|------|-----------|---------|
| Validação Encomenda sem preço+data | PASSOU | Bloqueou corretamente. |
| Gravação em Medicamentos | PASSOU | Item salvo na planilha. |
| Persistência após logout/login | **FALHOU P0** | Item salvo não recarrega na tela após novo login. |
| Atualizar agora | **FALHOU P0** | Erro "constant variable" exibido ao clicar. |
| Modal cancelar medicamento | NÃO TESTADO | Smoke interrompido por P0 antes deste item. |
| WhatsApp | NÃO TESTADO | — |
| Edição auditada | NÃO TESTADO | — |
| Logo/header/cards | NÃO TESTADO | — |

## Falhas P0

### 1. Erro "constant variable" ao Atualizar agora

Ao clicar "Atualizar agora" após o login, o app exibe erro relacionado a `constant variable`.
Causa provável: conflito de declaração `const` ou `let` introduzido no `Index.html` da v59
(possivelmente dentro do novo código do modal de cancelamento ou das hints de validação).

### 2. Item salvo não recarrega após logout/login

Após salvar um medicamento (gravação confirmada na planilha) e fazer logout + login,
o item não aparece na tela. Causa provável: o mesmo erro de `constant variable` impede
a execução do `loadData` no carregamento da sessão.

## Rollback

```
clasp deploy --versionNumber 57 --deploymentId AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw
```

Saída: `Deployed AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw @57`

Confirmado via `clasp deployments`: deployment oficial exibe `@57`.

## Próximos Passos

1. Investigar `constant variable` no `Index.html` da v59: procurar por `const` redeclarado ou `let` em escopo conflitante no código novo do modal de cancelamento e nas hints de validação.
2. Verificar se a causa raiz do `constant variable` é a mesma que impede o carregamento após login.
3. Corrigir em nova branch ou commit. Rodar smoke completo antes de publicar como v60.
4. Não tocar POP neste ciclo.

## Histórico de Versões

| Versão | Status |
|--------|--------|
| v57 | **ATIVA** — versão de produção após rollback |
| v58 | APROVADO COM RESSALVAS (2026-05-11) — recursos: edição auditada, ajustes UX |
| v59 | **REPROVADA** (2026-05-11) — P0: constant variable / persistência |

## Veredito

v59 **REPROVADA**. Rollback imediato para v57 efetuado e confirmado.
Deployment oficial aponta para v57. POP não tocado.
Causas raiz de v59 a investigar antes de novo ciclo de publicação.
