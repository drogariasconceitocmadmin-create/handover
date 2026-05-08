# Validacao Handover - P0 medicamentos filtros encoding menu

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada: `feat/handover-auth-pin-v41-recebimento`

Commit validado: `f627fc5 - fix(handover): corrige save/render medicamentos filtros e encoding WhatsApp`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada para teste: 45.

Rollback feito: SIM.

Versao ativa apos acao: 41.

POP tocado: NAO.

## Pre-deploy

- Branch atual confirmada: `feat/handover-auth-pin-v41-recebimento`.
- `HEAD`: `f627fc5`.
- `.clasp.json`: scriptId oficial do Handover.
- Diff principal: `Code.gs`, `Index.html` e reports.
- POP proibido: ausente.
- `sheet.clear()` novo no diff: ausente.
- `deleteRow` novo no diff: ausente.
- LockService/polling/auto-refresh novo no diff: ausente.
- Sintaxe de `Code.gs`: OK.
- Sintaxe dos scripts de `Index.html`: OK.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- `clasp.cmd version`: criada versao 45.
- `clasp.cmd deploy`: deployment oficial atualizado temporariamente para versao 45.
- URL oficial mantida.

## Smoke real

### Login/PIN

- Web App abriu: OK.
- Dashboard sem login: OK, bloqueado.
- PIN errado: OK, exibiu erro e nao liberou.
- Login Carlos/admin: OK.
- Logout: validacao interrompida antes da etapa final por falha critica no fluxo de Medicamentos.

### Nova Encomenda pos-save

Registro tentado:

- Medicamento: `CODEX_P0_DIRECT_1778273820684`
- Cliente: `CODEX`
- Telefone: `21999999999`
- Fornecedor_Compra: `Panpharma`
- Codigo_Compra_Fornecedor: `P0TESTE`
- Forma_Recebimento: `Entregar no endereco cadastrado`

Resultado: FALHA.

Evidencia:

- Apos salvar, o modal fechou e a tela foi para Medicamentos/Pendentes.
- A nova encomenda nao apareceu na lista.
- O console registrou erro critico: `chunks is not defined`.
- Tambem apareceu erro `Gs` apos o refresh.

### Filtros Medicamentos

Resultado: FALHA.

Evidencia:

- A tela mostrou contadores em Medicamentos, mas a lista nao renderizou o item recem-criado.
- A renderizacao foi interrompida pelo erro `chunks is not defined`.

### Compras_Medicamentos

Resultado: NAO VALIDADO.

Motivo:

- O criterio de rollback foi atingido antes da validacao da planilha, porque a nova Encomenda nao apareceu no front e houve erro critico no console.

### WhatsApp encoding

Resultado: PARCIAL.

Evidencia:

- O select publicado exibiu corretamente `Entregar no endereco cadastrado` com codigo Unicode de `ç` valido no DOM.
- A validacao completa do WhatsApp nao foi concluida porque o fluxo P0 falhou antes.

### Menu contextual

Resultado: NAO VALIDADO.

Motivo:

- O fluxo foi interrompido antes da abertura segura do menu no card de teste.

### Cancelamento

Resultado: NAO VALIDADO.

Motivo:

- O fluxo foi interrompido antes de criar um card validado para cancelamento.

### Regressao

Resultado: NAO VALIDADO COMPLETO.

Motivo:

- A validacao foi interrompida pelo criterio de rollback.

## Rollback

Acao executada:

`clasp.cmd deploy -i AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw -V 41 -d "Rollback Handover v41 falha smoke P0 f627fc5"`

Confirmacao:

- Deployment oficial voltou para `@41 - Rollback Handover v41 falha smoke P0 f627fc5`.

## Falhas

### Criticas

1. Nova Encomenda nao apareceu apos salvar.
   - Evidencia: `CODEX_P0_DIRECT_1778273820684` nao apareceu no front apos save.
   - Console: `chunks is not defined`.
   - Causa provavel: `Index.html` chama `chunks.push(...)` em `renderMedicationQueue_` antes de declarar `chunks`.
   - Local provavel: `Index.html`, bloco de renderizacao de cards de Medicamentos.

2. Filtros/lista de Medicamentos nao puderam ser aprovados.
   - Evidencia: renderizacao interrompida pelo erro `chunks is not defined`.

### Medias

- WhatsApp encoding nao foi validado fim a fim por causa do rollback.
- Menu contextual nao foi validado por causa do rollback.
- Cancelamento nao foi validado por causa do rollback.

### Leves

- Nenhuma alem das validacoes interrompidas.

## Veredito

Publicacao reprovada. Rollback executado para v41. A correcao `f627fc5` nao deve ser mantida em producao ate corrigir o erro `chunks is not defined` e repetir o smoke P0.
