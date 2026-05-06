# Validacao Handover - Hotfix dropdown e busca Medicamentos

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada: `fix/handover-v31-dropdown-search`

Commit publicado: `9a50a06 - fix(handover): corrige dropdown Novo registro e amplia busca Medicamentos`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: OK

Versao publicada: 33.

Rollback feito: NAO.

POP tocado: NAO.

Registros criados: nenhum.

## Pre-deploy

- Branch atual confirmada: `fix/handover-v31-dropdown-search`.
- Commit alvo confirmado: `9a50a06`.
- `.clasp.json`: scriptId oficial do Handover.
- Diff do hotfix: somente `Index.html`.
- `Code.gs`: sem alteracao.
- `appsscript.json`: sem alteracao.
- Commit `2f45b08`: NAO esta na branch publicada.
- `LockService`, `getScriptLock`, `acquireHandoverWriteLock_`, `releaseHandoverWriteLock_`: ausentes.
- `HANDOVER_AUTO_REFRESH*`, `dashboardLastFingerprint`, `dashboardRefreshInFlight`, `refreshDashboardNow_(true, 'auto')`: ausentes.
- Pill/texto `Atualizacao automatica` e texto fixo `Atualizando...`: ausentes.
- `sheet.clear`: ausente.
- Referencias ao POP proibido: ausentes.

## Publicacao

- `clasp status`: OK.
- `clasp push`: OK.
- `clasp version`: criada versao 33.
- `clasp deploy`: deployment oficial atualizado para versao 33.
- DeploymentId e URL oficial preservados.

## Smoke real

- Abertura: OK. Web App abriu e dashboard carregou sem erro critico capturado no console.
- Dropdown Novo registro: OK. Dropdown abriu inteiro, abaixo do botao e acima dos cards/KPIs; `z-index=10050`; area dentro do viewport.
- Novo Registro > Pendencia da loja: OK. Abriu modal Geral.
- Novo Registro > Medicamento solicitado: OK. Abriu modal Medicamentos.
- Medicamento Falta: OK. Cliente, telefone, pre-pago e preco ficam ocultos.
- Medicamento Encomenda: OK. Cliente, telefone, pre-pago e preco ficam visiveis.
- Busca Medicamentos: OK.
  - Medicamento/atendente: busca por `CODEX` e `CODEX_V` retornou cards.
  - Telefone sem mascara: `21999999999` retornou card.
  - Telefone com mascara: `(21) 99999-9999` retornou card.
  - Preco: `50`, `50,00` e `R$ 50,00` retornaram cards.
  - Status: `Pendente` retornou cards; `Comprado` e `Entregue` nao tinham cards visiveis no estado atual.
  - Tipo: `Falta` e `Encomenda` retornaram cards.
- Checklist: OK. Abriu com categorias.
- Menu tres pontos: OK. Sem `Imprimir`; contem Ver detalhes, Ver trilha de auditoria e Copiar informacoes.

## Evidencias objetivas

- Versao publicada: 33.
- Dropdown rect: top 75, left 1009, width 320, height 166, bottom 241.
- Dropdown `withinViewport=true`, `topElementInsideMenu=true`, `zIndex=10050`.
- Busca Medicamentos antes dos filtros: 3 cards.
- Busca por telefone/preco/tipo/status Pendente retornou resultados.
- Registros criados: nenhum.

## Falhas

### Criticas

- Nenhuma.

### Medias

- Nenhuma.

### Leves

- Nenhuma.

## Veredito

Hotfix publicado e aprovado. Dropdown Novo registro corrigido, busca de Medicamentos ampliada validada, sem `Code.gs`, sem POP, sem locks/sync/auto-refresh novo.
