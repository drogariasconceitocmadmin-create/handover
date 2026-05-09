# Validacao Handover v56 - Cancelamento Falta/Encomenda em Compras

Projeto: Handover - Drogarias Conceito

Branch publicada: `hotfix/handover-p0-save-medicamentos`

Commit publicado: `4fbe8d6 - fix(handover): espelha cancelamento Falta/Encomenda em Compras_Medicamentos`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: OK COM RESSALVA

Versao publicada: 56.

Rollback feito: NAO.

POP tocado: NAO.

## Preflight

- Branch `hotfix/handover-p0-save-medicamentos`: OK.
- HEAD `4fbe8d6`: OK.
- `.clasp.json` do Handover oficial: OK.
- POP ausente: OK.
- `sheet.clear()` novo: ausente.
- `deleteRow` novo: ausente; ocorrencia existente e legada nao entrou neste hotfix.
- Hotfix de codigo alterou somente `Code.gs`: OK.
- Checklist/Login/PIN/WhatsApp/layout nao foram alterados neste commit: OK.
- Base funcional v55 preservada: OK.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- Versao criada: 56.
- Deployment oficial atualizado para v56.
- Novo deployment nao foi criado.

## Smoke P0 - Criacao ainda funciona

### Encomenda

Registro:

- `TESTE_V56_ENCOMENDA_OK`

Resultado:

- Login Carlos/admin: OK.
- Criacao pelo Web App: OK.
- Gravou em `Medicamentos`: OK.
- Espelhou em `Compras_Medicamentos`: OK.
- Persistencia apos refresh/reload confirmada por backend/planilha: OK.
- Campos conferidos:
  - Fornecedor_Compra: `Panpharma`.
  - Codigo_Compra_Fornecedor: `V56ENC`.
  - Forma_Recebimento: `A combinar`.

### Falta

Registro:

- `TESTE_V56_FALTA_CANCEL`

Resultado:

- Criacao pelo Web App: OK.
- Gravou em `Medicamentos`: OK.
- Espelhou em `Compras_Medicamentos`: OK.

## Smoke P1 - Cancelamento de Encomenda

Registro:

- `TESTE_V56_ENCOMENDA_OK`

Resultado em `Medicamentos`:

- Status = `Cancelado`.
- Cancelado_Por = `Carlos`.
- Data_Cancelamento preenchida.
- Motivo_Cancelamento = `limpeza teste v56`.

Resultado em `Compras_Medicamentos`:

- Status_Compra = `Cancelado`.
- Status_Handover = `Cancelado`.
- Cancelado_Por = `Carlos`.
- Data_Cancelamento preenchida.
- Comprado_Por vazio.
- Data_Compra vazia.

## Smoke P2 - Cancelamento de Falta

Registro:

- `TESTE_V56_FALTA_CANCEL`

Resultado em `Medicamentos`:

- Status = `Cancelado`.
- Cancelado_Por = `Carlos`.
- Data_Cancelamento preenchida.
- Motivo_Cancelamento = `limpeza teste v56`.

Resultado em `Compras_Medicamentos`:

- Status_Compra = `Cancelado`.
- Status_Handover = `Cancelado`.
- Cancelado_Por = `Carlos`.
- Data_Cancelamento preenchida.
- Nao permaneceu `Pendente de compra`.

## Regressao curta

Registro adicional:

- `TESTE_V56_WHATSAPP_OK`

Resultado:

- Criacao de Encomenda simples: OK.
- Persistencia em `Medicamentos`: OK.
- Espelho em `Compras_Medicamentos`: OK.
- Cancelamento logico: OK.
- Espelho Cancelado em Compras: OK.
- Menu sem `Imprimir`: OK.
- Login/logout: OK.
- Atualizar agora: parcial/inconclusivo na automacao final, mas operou durante o fluxo principal de criacao/cancelamento.
- WhatsApp: inconclusivo; a automacao nao conseguiu abrir a janela antes do cancelamento do item.

## Limpeza

Registros criados nesta rodada:

- `TESTE_V56_ENCOMENDA_OK`
- `TESTE_V56_FALTA_CANCEL`
- `TESTE_V56_WHATSAPP_OK`

Limpeza realizada:

- Os tres registros foram cancelados logicamente pelo Handover.
- Nenhuma linha foi apagada fisicamente.
- Usuarios, cabecalhos e abas nao foram alterados manualmente.

## Falhas

Criticas:

- Nenhuma.

Medias:

- Nenhuma.

Leves:

- WhatsApp ficou inconclusivo na automacao desta rodada.
- Atualizar agora ficou parcial/inconclusivo na automacao final, apesar de o fluxo principal ter atualizado dados e planilha corretamente.

## Veredito

v56 publicada e aprovada com ressalva leve. O objetivo principal foi atendido: cancelamento de Falta e Encomenda agora espelha `Cancelado` em `Compras_Medicamentos`.
