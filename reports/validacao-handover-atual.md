# Validacao Handover - Checklist Item_ID aditivo v53

Projeto: Handover - Drogarias Conceito

Branch publicada: `feat/handover-auth-pin-v41-recebimento`

Commit obrigatorio validado: `4a26376 - fix(handover): torna Item_ID do checklist aditivo e corrige textos`

HEAD publicado da branch: `2ee9388 - ux(handover): ajusta textos e clareza visual do checklist e medicamentos`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada: 53.

Rollback feito: SIM, deployment retornado para versao 51.

POP tocado: NAO.

## Preflight

- Branch correta: OK.
- Commit `4a26376` presente no historico imediato: OK.
- `.clasp.json` do Handover: OK.
- POP ausente: OK.
- `sheet.clear()` novo: ausente.
- `deleteRow` novo: ausente; ocorrencia existente e legada nao entrou neste commit.
- `Checklist_Turnos` usando `ensureHeadersLegacyAdditive_`: OK.
- `Item_ID` aditivo/tolerante por mapa de cabecalhos: OK estatico.
- `selfTestChecklistTurnosSchema_`: presente.
- Templates: Manha 17, Tarde 11, Noite 12.
- `Item_ID`: 40 IDs unicos.
- Texto `operacao deste periodo` no Checklist: sem mojibake no smoke.
- Login/PIN: presente.
- `Compras_Medicamentos`: presente.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- Versao criada: 53.
- Deployment oficial atualizado para v53.
- URL oficial mantida.

## Smoke P0 - Login

Login/PIN: OK.

- Tela abriu bloqueada sem login.
- Login Carlos/admin funcionou.
- Header Carlos/admin confirmado.

## Smoke P1 - Checklist

Checklist: OK.

- Sem erro de cabecalho na geracao/renderizacao.
- Manha mostrou itens de abertura da loja.
- Tarde mostrou itens de passagem/continuidade.
- Noite mostrou itens de fechamento.
- Itens de Manha, Tarde e Noite ficaram diferentes.
- Troca visual rapida: aproximadamente 340-365 ms no Playwright.
- Status Feito na Tarde mudou imediatamente e persistiu ao voltar ao turno.
- Manha nao foi alterada ao marcar item da Tarde.
- Observacao digitada na Tarde foi preservada ao ir para Noite e voltar.
- Auto-sync preservou o turno ativo Tarde.
- Sidebar/resumo acompanhou o turno ativo.
- Texto sem mojibake confirmado no Checklist.

## Planilha - Checklist_Turnos

- A geracao do Checklist nao retornou erro de cabecalho.
- `Item_ID` foi tratado como cabecalho tolerante/aditivo.
- Linhas novas de Checklist funcionaram com IDs por turno.
- Cabecalhos antigos nao exigiram reordenacao manual durante o smoke.

## Smoke P2 - Regressao curta

Medicamentos/Compras: FALHA critica.

- Criada Encomenda via Web App: `CODEX_V53_REG_1778337287369`.
- O modal fechou e o item apareceu temporariamente na UI.
- Ao consultar a planilha oficial, o item nao foi encontrado em `Medicamentos`.
- O item tambem nao foi encontrado em `Compras_Medicamentos`.
- Em nova sessao do Web App, o item nao apareceu mais, indicando placeholder otimista sem persistencia real.
- Por regra, foi feito rollback para v51.

Demais itens da regressao:

- Atualizar agora: OK.
- Logout voltou para login: OK.
- Menu e Ver detalhes: nao validados de forma conclusiva, porque a falha critica de persistencia exigiu rollback.
- WhatsApp: nao validado por depender do item persistido.

## Rollback

Executado:

`clasp.cmd deploy --deploymentId AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw --versionNumber 51 --description "Rollback v51 apos falha regressao v53 checklist"`

Versao ativa apos acao: 51.

Validacao pos-rollback:

- URL oficial voltou a exibir bloqueio de login.

## Falhas

Criticas:

- v53 nao persistiu nova Encomenda criada pelo Web App na aba `Medicamentos`.
- v53 nao espelhou a nova Encomenda em `Compras_Medicamentos`.
- A UI exibiu item otimista que desapareceu em nova sessao.

Medias:

- Menu/Ver detalhes/WhatsApp nao foram concluidos apos a falha critica de persistencia.

Leves:

- Publicacao saiu do HEAD atual da branch (`2ee9388`), com `4a26376` presente no historico, nao do hash `4a26376` como HEAD exato.

## Decisao

Rollback aplicado para v51. Checklist v53 corrigiu a falha de `Item_ID`, mas a regressao de persistencia de Medicamentos/Compras bloqueia aprovacao.
