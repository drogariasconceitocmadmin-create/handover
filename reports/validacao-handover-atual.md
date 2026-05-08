# Validacao Handover - hotfix espelho recebimento

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada: `feat/handover-auth-pin-v41-recebimento`

Commit publicado: `8f9d037 - fix(handover): espelha fornecedor e recebimento em Compras por cabecalho`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: PARCIAL

Versao publicada: 44.

Rollback feito: NAO.

POP tocado: NAO.

## Pre-deploy

- Branch atual confirmada: `feat/handover-auth-pin-v41-recebimento`.
- `HEAD`: `8f9d037`.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: ausente.
- `sheet.clear()`: ausente.
- `deleteRow` novo no diff: ausente.
- `saveData` Medicamentos usa `buildAppendRowValuesFromNamedMap_(sheet, ...)`.
- `selfTestEspelhoComprasRecebimento_`: presente.
- Login/PIN: presente.
- `PIN_Novo_Temporario`: presente.
- `Compras_Medicamentos`: presente.
- `Fornecedor_Compra`, `Codigo_Compra_Fornecedor`, `Forma_Recebimento`: presentes em `Medicamentos` e `Compras_Medicamentos`.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- `clasp.cmd version`: criada versao 44.
- `clasp.cmd deploy`: deployment oficial atualizado para versao 44.
- URL oficial mantida.

## Smoke P0 - Auth

- Web App abriu: OK.
- Dashboard sem login: OK, nao apareceu antes do login.
- Overlay/login: OK.
- PIN errado: OK, exibiu erro e saiu de `Entrando...`.
- Login Carlos/admin: OK com PIN informado.
- Header: OK, exibiu `Carlos · admin`.
- Logout/Sair: OK, voltou para login.

## Smoke P1 - Espelho recebimento

### Panpharma

Registro criado:

- Medicamento: `CODEX_RECEB_HOTFIX_PANPHARMA_1778198890775`
- Cliente: `CODEX`
- Telefone: `21999999999`
- Preco: `50`
- Fornecedor_Compra: `Panpharma`
- Codigo_Compra_Fornecedor: `PX12345`
- Forma_Recebimento: `A combinar`

Validacao em `Medicamentos`:

- `Fornecedor_Compra = Panpharma`: OK.
- `Codigo_Compra_Fornecedor = PX12345`: OK.
- `Forma_Recebimento = A combinar`: OK.

Validacao em `Compras_Medicamentos`:

- `Fornecedor_Compra = Panpharma`: OK.
- `Codigo_Compra_Fornecedor = PX12345`: OK.
- `Forma_Recebimento = A combinar`: OK.

### Santa Cruz

Registro criado:

- Medicamento: `CODEX_RECEB_HOTFIX_SANTACRUZ_1778199080510`
- Cliente: `CODEX`
- Telefone: `21999999999`
- Preco: `50`
- Fornecedor_Compra: `Santa Cruz`
- Codigo_Compra_Fornecedor: `SC98765`
- Forma_Recebimento: `Retira na loja`

Validacao em `Medicamentos`:

- `Fornecedor_Compra = Santa Cruz`: OK.
- `Codigo_Compra_Fornecedor = SC98765`: OK.
- `Forma_Recebimento = Retira na loja`: OK.

Validacao em `Compras_Medicamentos`:

- `Fornecedor_Compra = Santa Cruz`: OK.
- `Codigo_Compra_Fornecedor = SC98765`: OK.
- `Forma_Recebimento = Retira na loja`: OK.

## Smoke P2

- Falta criada: `CODEX_RECEB_HOTFIX_FALTA_1778199080510`.
- `Forma_Recebimento` nao apareceu no formulario de Falta: OK.
- Marcar Comprado pelo Handover/backend da Web App: OK para Panpharma e Santa Cruz.
- WhatsApp A combinar: OK, URL gerada sem envio real, com texto de combinar retirada/entrega.
- WhatsApp Retira na loja: OK, URL gerada sem envio real, com texto de retirada na loja.
- Cancelamento pelo Handover/backend da Web App: OK para Santa Cruz.
- `Compras_Medicamentos` refletiu `Status_Compra = Cancelado`, `Status_Handover = Cancelado`, `Cancelado_Por = Carlos`: OK.
- Cancelado sem stamp inclinado: OK por validação estática; `qk-card-shell::after` nao existe mais.
- Checklist abre: OK.
- Historico: NAO VALIDADO pela automacao; clique na aba/botao nao ativou a tela em Playwright, sem erro critico visivel no console.

## Falhas

### Criticas

- Nenhuma.

### Medias

- Historico nao foi validado pela automacao nesta rodada.

### Leves

- Mensagens WhatsApp foram validadas por URL/retorno do Web App sem envio real. A URL contem texto semanticamente correto; acentuacao no retorno aparece com codificacao visual do Apps Script/terminal.

## Registros criados

- `CODEX_RECEB_HOTFIX_PANPHARMA_1778198890775`
- `CODEX_RECEB_HOTFIX_DEBUG_1778198959787`
- `CODEX_RECEB_HOTFIX_SANTACRUZ_1778199080510`
- `CODEX_RECEB_HOTFIX_FALTA_1778199080510`

## Veredito

Publicado com ressalvas. O hotfix P0/P1 de espelhamento foi aprovado em planilha real. Manter v44 publicada; proxima correcao sugerida: validar manualmente/ajustar automacao do Historico e revisar acentuacao final das mensagens WhatsApp.
