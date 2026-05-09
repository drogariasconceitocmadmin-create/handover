# Validacao Handover - Checklist por turno v52

Projeto: Handover - Drogarias Conceito

Branch publicada: `feat/handover-auth-pin-v41-recebimento`

Commit validado: `e9745ff - fix(handover): reconstrói checklist por turno com templates próprios e UX rápida`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada: 52.

Rollback feito: SIM, deployment retornado para versao 51.

POP tocado: NAO.

## Preflight

- Branch correta: OK.
- Commit `e9745ff` no HEAD: OK.
- `.clasp.json` do Handover: OK.
- POP ausente: OK.
- `sheet.clear()` novo: ausente.
- `deleteRow` novo: ausente; ocorrencia existente e legada nao entrou neste commit.
- `Item_ID`: 40 IDs unicos.
- Templates: Manha 17, Tarde 11, Noite 12.
- Login/PIN: presente.
- `Compras_Medicamentos`: presente.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- Versao criada: 52.
- Deployment oficial atualizado para v52.
- URL oficial mantida.

## Smoke

Login/PIN: OK.

- Tela abriu bloqueada sem login.
- PIN errado nao liberou acesso.
- Login Carlos/admin funcionou.

Checklist: FALHA critica.

- Troca visual Manha/Tarde/Noite: OK, em aproximadamente 280-300 ms.
- Ao gerar checklist, o backend retornou erro de cabecalho:
  `Estrutura de cabecalho incompativel na aba "Checklist_Turnos". Ajuste manualmente os cabecalhos para: ID, Data, Turno, Horario_Referencia, Item_ID, Categoria, Item, Descricao, Status, Responsavel, Data_Hora_Check, Observacao.`
- Manha, Tarde e Noite ficaram vazios.
- Nao foi possivel validar status otimista, observacao preservada e diferenca real de itens no Web App publicado.

Medicamentos/Compras/WhatsApp/Menu/Atualizar: nao concluido, porque a falha critica do Checklist exigiu rollback.

## Rollback

Executado:

`clasp.cmd deploy --deploymentId AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw --versionNumber 51 --description "Rollback para v51 apos falha checklist templates v52"`

Versao ativa apos acao: 51.

## Falhas

Criticas:

- v52 bloqueia geracao do Checklist por incompatibilidade de cabecalho em `Checklist_Turnos` ao exigir `Item_ID`.

Medias: nenhuma.

Leves: nenhuma.

## Decisao

Publicacao bloqueada por falha critica no Checklist. Rollback aplicado para v51.

Proxima correcao: tornar `Item_ID` aditivo/tolerante em `Checklist_Turnos`, sem exigir reordenacao manual de cabecalhos existentes.
