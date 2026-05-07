# Validacao Handover - recebimento, fornecedor e WhatsApp

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada para teste: `feat/handover-auth-pin-v41-recebimento`

Commit publicado para teste: `5479efe - feat(handover): consolida auth v41 com fornecedor forma recebimento e WhatsApp`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada para teste: 43.

Rollback feito: SIM, deployment oficial restaurado para versao 41.

POP tocado: NAO.

## Pre-deploy

- Branch atual confirmada: `feat/handover-auth-pin-v41-recebimento`.
- `HEAD`: `5479efe`.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: ausente.
- `sheet.clear()`: ausente.
- `deleteRow` novo no diff: ausente.
- Login/PIN: presente.
- `PIN_Novo_Temporario`: presente.
- `aplicarPinsTemporariosHandover`: presente.
- `Compras_Medicamentos`: presente.
- `cancelMedicationRequest`: presente.
- `Fornecedor_Compra` e `Codigo_Compra_Fornecedor`: presentes.
- `Forma_Recebimento`: presente.
- Mensagens WhatsApp por `Forma_Recebimento`: presentes no backend e no front.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- `clasp.cmd version`: criada versao 43.
- `clasp.cmd deploy`: deployment oficial atualizado para versao 43.
- URL oficial mantida.

## Smoke real

- Web App abriu.
- Dashboard sem login: OK, nao apareceu antes do login.
- Overlay/login: OK.
- PIN errado: OK, exibiu erro e saiu de `Entrando...`.
- Login Carlos/admin: OK com PIN informado.
- Header: OK, exibiu `Carlos · admin`.

## Falha critica encontrada

Ao criar Encomenda com:

- Fornecedor: `Panpharma`
- Codigo_Compra_Fornecedor: `COD-PAN-...`
- Forma_Recebimento: `A combinar`

o registro foi salvo em `Medicamentos`, mas a aba `Compras_Medicamentos` nao recebeu corretamente fornecedor/codigo:

- `Fornecedor_Compra` em Compras ficou como `Nao informado`.
- `Codigo_Compra_Fornecedor` em Compras ficou vazio.
- A leitura da planilha tambem indicou possivel desalinhamento de colunas ao redor de cancelamento/forma de recebimento.

Evidencia objetiva:

- `Medicamentos` contem `CODEX_RECEB_AC_1778197198732` com `Fornecedor_Compra = Panpharma`, `Codigo_Compra_Fornecedor = COD-PAN-1778197198732`, `Forma_Recebimento = A combinar`.
- `Compras_Medicamentos` contem o mesmo ID, mas com `Fornecedor_Compra = Nao informado`, `Codigo_Compra_Fornecedor` vazio e `Forma_Recebimento = A combinar`.

Impacto:

- A compra operacional nao recebe dados essenciais do fornecedor/codigo.
- O fluxo de compras fica inconsistente entre `Medicamentos` e `Compras_Medicamentos`.

Arquivo/funcoes provaveis:

- `Code.gs`
- `HEADERS.Medicamentos`
- `HEADERS.Compras_Medicamentos`
- `buildRowFromHeaders_`
- `saveData`
- `mirrorComprasMedicamentosRowForMedicamentoId_`
- `buildComprasRowNamedValuesFromMedicamento_`

## Rollback

Rollback executado imediatamente apos falha critica:

- Comando: `clasp.cmd deploy -i AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw -V 41 -d "Rollback Handover v41 estavel apos falha recebimento fornecedor"`
- Resultado: deployment oficial restaurado para `@41`.

## Fluxos nao concluidos

Por falha critica em `Compras_Medicamentos`, o smoke foi interrompido antes de:

- Validar mensagens WhatsApp das 3 formas.
- Validar Falta sem `Forma_Recebimento`.
- Marcar Comprado pelo Handover.
- Cancelar medicamento pelo Handover.
- Validar Checklist.
- Validar Historico.

## Registros de teste criados

- `CODEX_RECEB_AC_1778197032166`
- `CODEX_RECEB_AC_1778197117755`
- `CODEX_RECEB_AC_1778197198732`

Todos foram criados como Encomenda para teste de fornecedor/codigo/forma.

## Falhas

### Criticas

1. `Compras_Medicamentos` nao recebeu corretamente `Fornecedor_Compra` e `Codigo_Compra_Fornecedor` ao espelhar Encomenda por ID.

### Medias

- Smoke funcional completo nao concluido por rollback obrigatorio.

### Leves

- Nenhuma.

## Veredito

Nao aprovado. Versao 43 foi publicada para teste, falhou no espelhamento de `Compras_Medicamentos` e foi revertida para v41 estavel.
