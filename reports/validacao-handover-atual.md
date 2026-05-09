# Validacao Handover - Release limpa Checklist v54

Projeto: Handover - Drogarias Conceito

Branch publicada: `release/handover-v54-checklist-clean`

Commit publicado: `f248a9a - fix(handover): torna Item_ID do checklist aditivo e corrige textos`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada: 54.

Rollback feito: SIM, deployment retornado para versao 51.

POP tocado: NAO.

## Preflight

- Branch atual `release/handover-v54-checklist-clean`: OK.
- HEAD `f248a9a`: OK.
- Branch `feat/handover-auth-pin-v41-recebimento` nao publicada: OK.
- `d12ccd6` fora do historico publicado: OK.
- `Auditoria_Handover`: ausente.
- `updateHandoverItem`: ausente.
- `getHandoverAuditTrail`: ausente.
- Botao/modal Editar: ausente.
- `.clasp.json` do Handover oficial: OK.
- POP ausente: OK.
- `sheet.clear()` novo: ausente.
- `deleteRow` novo: ausente; ocorrencia existente e legada nao entrou neste release.
- Templates Checklist: Manha 17, Tarde 11, Noite 12.
- `Item_ID`: 40 IDs unicos.
- `Checklist_Turnos` com `ensureHeadersLegacyAdditive_`: OK.
- Texto `operacao deste periodo`: sem mojibake no codigo.
- Diff contra `feb9351`: apenas `Code.gs` e `Index.html`.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- Versao criada: 54.
- Deployment oficial atualizado para v54.
- URL oficial mantida.
- Novo deployment nao foi criado.

## Smoke P0 - Login e Medicamentos

Login/PIN: OK.

- Tela abriu bloqueada sem login.
- PIN errado bloqueou acesso e nao ficou preso em Entrando.
- Login Carlos/admin funcionou.
- Header Carlos/admin confirmado.

Medicamentos/Compras: FALHA critica.

Registro de teste:

- `CODEX_V54_MED_OK`

Resultado:

- O modal de Medicamento fechou apos salvar.
- O item apareceu temporariamente na UI.
- O item apareceu apos clicar Atualizar agora.
- Apos logout/login, o item nao apareceu mais.
- Busca direta na planilha oficial nao encontrou o item em `Medicamentos`.
- Busca direta na planilha oficial nao encontrou o item em `Compras_Medicamentos`.

Conclusao:

- O item ficou apenas como estado otimista/local.
- A persistencia real em `Medicamentos` falhou.
- O espelho em `Compras_Medicamentos` falhou.
- Criterio de rollback acionado antes do smoke de Checklist.

## Smoke P1 - Checklist

Nao executado apos P0, porque a regra exigia rollback imediato quando Medicamentos nao persistisse.

## Rollback

Executado:

`clasp.cmd deploy --deploymentId AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw --versionNumber 51 --description "Rollback v51 apos falha persistencia v54 release limpa checklist"`

Versao ativa apos acao: 51.

Validacao pos-rollback:

- URL oficial voltou a exibir bloqueio de login.

## Limpeza

- Nenhuma linha real foi gravada na planilha para `CODEX_V54_MED_OK`; portanto nao houve registro persistido a remover.
- Usuarios, cabecalhos e abas nao foram alterados manualmente.

## Falhas

Criticas:

- v54 nao persistiu a nova Encomenda criada pelo Web App em `Medicamentos`.
- v54 nao espelhou a nova Encomenda em `Compras_Medicamentos`.
- O item apareceu apenas como estado otimista/local e desapareceu apos nova sessao.

Medias:

- Checklist v54 nao foi testado no Web App publicado, porque o P0 de Medicamentos falhou antes.

Leves:

- Nenhuma.

## Decisao

Rollback aplicado para v51. Release limpa v54 bloqueada por falha critica de persistencia Medicamentos/Compras.
