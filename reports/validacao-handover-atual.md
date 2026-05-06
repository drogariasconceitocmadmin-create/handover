# Validacao Handover - Compras_Medicamentos trigger sync fix

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada: `feat/handover-compras-medicamentos`

Commit publicado: `17a0e42` (`HEAD`), contendo:
- `712fb69 - feat(handover): aba Compras_Medicamentos espelha Medicamentos e sincroniza por ID`
- `97b22f9 - feat(handover): handler Compras + trigger instalavel e diagnostico por ID`
- `9876bfc - feat(handover): regra Status_Compra Compras para Medicamentos por ID`
- `17a0e42 - fix(handover): sync Compras reversa, Pendente seguro e instrucoes pos-deploy`

Base: v33 estavel / sem auth/PIN / sem POP.

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: OK

Versao publicada: 39.

Rollback feito: NAO.

POP tocado: NAO.

Registros criados nesta rodada: nenhum.

## Pre-deploy

- Branch atual confirmada: `feat/handover-compras-medicamentos`.
- `HEAD`: `17a0e42`.
- Commits obrigatorios presentes: `712fb69`, `97b22f9`, `9876bfc`, `17a0e42`.
- `.clasp.json`: scriptId oficial do Handover.
- Auth/PIN: ausente (`loginHandover`, `validateSessionHandover`, `Pin_Hash`, `Usuarios_Handover` nao encontrados).
- POP proibido: ausente.
- `sheet.clear()` / `.clear()`: ausente.
- Padroes perigosos de `getRange` usando linha/coluna final: ausentes.
- `clasp status`: OK; Apps Script rastreia apenas `appsscript.json`, `Code.gs`, `Index.html`.

## Compras_Medicamentos preflight

- `instalarTriggerComprasMedicamentos_`: presente.
- `listarTriggersHandover_`: presente.
- `removerTriggerComprasMedicamentos_`: presente.
- `handleComprasMedicamentosEdit_`: presente.
- `processarStatusCompraPorIdHandover_`: presente.
- `Status_Compra = Pendente de compra`: regra segura; atualiza colunas de apoio em Compras, mas nao forca `Medicamentos.Status` para Pendente.
- Reversao explicita no Handover: `mirrorComprasMedicamentosRowForMedicamentoId_` aceita `fromRevertToPending` e forca Compras para `Pendente de compra`.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- `clasp.cmd version`: criada versao 39.
- `clasp.cmd deploy`: deployment oficial atualizado para versao 39.
- DeploymentId e URL oficial preservados.

## Smoke real Web App

- Abertura: OK. Web App abriu na URL oficial.
- Dashboard: OK. KPIs, fila e checklist carregaram.
- Console: OK. Sem erro critico capturado; apenas warnings do iframe/sandbox do Apps Script.
- Novo Registro: OK. Dropdown abre.
- Medicamentos: OK. Aba abre, filtros aparecem e item Cancelado existente nao quebra a listagem.
- Busca Medicamentos: OK. Campo de busca aceitou busca por `CODEX` e manteve a tela funcional.
- Checklist: OK. Aba abre e mostra turno, filtros e categorias.
- Historico: OK. Aba abre e carrega sob demanda (`fetchHistoricoResolvidos` executou).

## Teste manual pendente

Nao foi executado Compras -> Handover via Playwright, por regra expressa da rodada.

Pendente para Carlos apos instalar/confirmar o gatilho:
1. Executar `instalarTriggerComprasMedicamentos_()` no Apps Script Editor, se ainda nao instalado.
2. Rodar `listarTriggersHandover_()` e confirmar `handleComprasMedicamentosEdit_`.
3. Na planilha autenticada, alterar `Status_Compra` de item seguro para `Comprado`, `Nao encontrado` e `Cancelado`.
4. Confirmar propagacao por `ID_Handover` nas abas `Medicamentos` e `Compras_Medicamentos`.

## Falhas

### Criticas

- Nenhuma.

### Medias

- Nenhuma.

### Leves

- O smoke de planilha Compras -> Handover continua manual por restricao operacional desta rodada.

## Veredito

Publicado e aprovado para smoke Web App. Versao 39 mantida no deployment oficial. Validacao da regra reversa Compras -> Handover fica como teste manual autenticado apos instalacao do gatilho.
