# Validacao Handover - commit 16c9a6e

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch: `master`

Commit validado: `16c9a6e - style(handover): polimento visual desktop antes da auditoria`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada: nenhuma nesta rodada.

Rollback feito: NAO.

POP tocado: NAO.

## Pre-deploy

- Pasta Handover confirmada.
- Branch `master` confirmada.
- `.clasp.json` confirmado com scriptId do Handover.
- Commit `16c9a6e` presente no HEAD.
- O commit `16c9a6e` isoladamente alterou somente `Index.html`.
- `git diff --check 16c9a6e^..16c9a6e`: OK.
- Nao ha `sheet.clear()` no diff do commit `16c9a6e`.
- Nao ha referencia ao scriptId/deploymentId do POP no diff do commit `16c9a6e`.

## Bloqueio de publicacao

A publicacao foi bloqueada porque o deployment oficial atual esta na versao 28, baseada no commit `a3d9a20`, mas o HEAD atual contem tambem o commit anterior `2f45b08 - Add safe auto refresh and write locks`, que altera `Code.gs`.

Publicar o HEAD agora enviaria ao Apps Script:

- `Code.gs`
- `Index.html`

Isso contrariaria o escopo informado para esta tarefa, que declara polimento visual em `Index.html` sem backend, schema ou `Code.gs`.

## Publicacao

- `clasp status`: nao executado para publicacao.
- `clasp push`: NAO.
- `clasp version`: NAO.
- `clasp deploy`: NAO.
- Deployment oficial permaneceu em v28.

## Smoke real

Nao executado pos-publicacao, porque nao houve publicacao.

## Falhas

### Criticas

- Risco de publicar mudanca de backend fora do escopo visual: `Code.gs` difere da base v28 devido ao commit `2f45b08` ainda nao publicado.

### Medias

- Nenhuma.

### Leves

- Arquivos `ux-handover-*.png` permanecem untracked e fora do commit de relatorio.

## Veredito

Publicacao bloqueada. Proxima acao: decidir se a v29 deve incluir tambem o commit `2f45b08` de auto-refresh/LockService ou preparar uma branch/commit visual baseado diretamente na v28 publicada.
