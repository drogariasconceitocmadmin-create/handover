# Validacao Handover - Cancelar medicamento e espelhar Compras

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada: `feat/handover-compras-medicamentos`

Commit publicado: `07d8806 - feat(handover): cancelar medicamento no painel e espelhar em Compras`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: OK

Versao publicada: 41.

Rollback feito: NAO.

POP tocado: NAO.

## Pre-deploy

- Branch atual confirmada: `feat/handover-compras-medicamentos`.
- `HEAD`: `07d8806`.
- `.clasp.json`: scriptId oficial do Handover.
- Auth/PIN: ausente.
- POP proibido: ausente.
- `sheet.clear()` / `.clear()`: ausente.
- `deleteRow` novo no diff do commit: ausente. O `deleteRow` existente permanece apenas no arquivamento legado `moveRowToResolved`.
- Funcao `cancelMedicationRequest`: presente.
- Schema aditivo confirmado: `Cancelado_Por`, `Data_Cancelamento`, `Motivo_Cancelamento`.
- Espelho por `ID_Handover` em `Compras_Medicamentos`: confirmado no codigo.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- `clasp.cmd version`: criada versao 41.
- `clasp.cmd deploy`: deployment oficial atualizado para versao 41.
- DeploymentId e URL oficial preservados.

## Smoke real

- Web App oficial abriu.
- Dashboard carregou.
- Aba Medicamentos abriu.
- Criada Encomenda de teste `CODEX_CANCELAR_HANDOVER`.
- Menu do card contem `Cancelar pedido`.
- Cancelamento pelo Handover confirmado via dialogs nativos:
  - confirmacao: `Cancelar esta solicitação de medicamento?`
  - prompt de motivo preenchido com `Smoke Codex cancelamento`
- Apos atualizar, card aparece no filtro `Cancelados`.
- Card mostra `CANCELADO`.
- Card mostra `CODEX · 07/05/2026, 17:51:06 · Smoke Codex cancelamento`.
- Acoes indevidas de WhatsApp/Comprado/Entregue nao aparecem no item cancelado.

## Espelho em planilha

### Medicamentos

- Registro `CODEX_CANCELAR_HANDOVER`, ID `76a008e6-13d7-43b8-930f-bf98d79884bd`.
- `Status`: `Cancelado`.
- `Comprado`: `FALSE`.
- `Entregue`: `FALSE`.
- `Cancelado_Por`: `CODEX`.
- `Data_Cancelamento`: preenchida.
- `Motivo_Cancelamento`: `Smoke Codex cancelamento`.

### Compras_Medicamentos

- Mesmo `ID_Handover`: `76a008e6-13d7-43b8-930f-bf98d79884bd`.
- `Status_Compra`: `Cancelado`.
- `Status_Handover`: `Cancelado`.
- `Cancelado_Por`: `CODEX`.
- `Data_Cancelamento`: preenchida.
- `Motivo_Cancelamento`: `Smoke Codex cancelamento`.

## Regressao minima

- Novo Registro abre: OK.
- Falta sem cliente/telefone/pre-pago/preco: OK.
- Encomenda completa: OK.
- Checklist abre: OK.
- Historico abre: OK.
- Menu sem Imprimir: OK.
- Comprado pela planilha: nao revalidado nesta rodada; ja coberto pelo fluxo de trigger/Compras.

## Registros criados

- `CODEX_CANCELAR_HANDOVER` / ID `76a008e6-13d7-43b8-930f-bf98d79884bd`.

## Falhas

### Criticas

- Nenhuma.

### Medias

- Nenhuma.

### Leves

- Nenhuma.

## Veredito

Publicado e aprovado. A versao 41 permite cancelar medicamento pelo Handover, registra autoria/motivo/data e espelha o cancelamento em `Compras_Medicamentos` por `ID_Handover`.
