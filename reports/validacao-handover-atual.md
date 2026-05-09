# Incidente P0 - Handover nao persiste Medicamentos

Projeto: Handover - Drogarias Conceito

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

## Resultado

Status geral: FALHA CRITICA / P0

Versao ativa antes: 51.

Rollback feito: SIM.

Versao ativa depois: 48.

Producao protegida: NAO. Nenhuma versao estavel foi identificada no teste de persistencia.

POP tocado: NAO.

## Contencao

### v51

Situacao inicial confirmada:

- Deployment oficial estava em `@51`.
- URL oficial abriu com login obrigatorio.

Teste executado:

- `TESTE_BASE_V51_MED`

Resultado:

- Login Carlos/admin: OK.
- Modal de Medicamento fechou apos salvar.
- Item apareceu temporariamente na UI.
- Item apareceu apos Atualizar agora.
- Item desapareceu apos logout/login.
- Busca na planilha oficial nao encontrou o item em `Medicamentos`.
- Busca na planilha oficial nao encontrou o item em `Compras_Medicamentos`.

Conclusao:

- v51 nao persiste Medicamentos.

### v50

Rollback executado para `@50`.

Teste executado:

- `TESTE_ROLLBACK_V50_MED`

Resultado:

- Login Carlos/admin: OK.
- Modal de Medicamento fechou apos salvar.
- Item apareceu temporariamente na UI.
- Item apareceu apos Atualizar agora.
- Item desapareceu apos logout/login.
- Busca na planilha oficial nao encontrou o item em `Medicamentos`.
- Busca na planilha oficial nao encontrou o item em `Compras_Medicamentos`.

Conclusao:

- v50 tambem nao persiste Medicamentos.

### v48

Rollback executado para `@48`.

Teste executado:

- `TESTE_ROLLBACK_V48_MED`

Resultado:

- Login Carlos/admin: OK.
- Modal de Medicamento fechou apos salvar.
- Item apareceu temporariamente na UI.
- Item apareceu apos Atualizar agora.
- Item desapareceu apos logout/login.
- Busca na planilha oficial nao encontrou o item em `Medicamentos`.
- Busca na planilha oficial nao encontrou o item em `Compras_Medicamentos`.

Conclusao:

- v48 tambem nao persiste Medicamentos.

## Planilha oficial

Planilha conferida:

`https://docs.google.com/spreadsheets/d/1tHDX3I5yVx2UioNki695UIoNxHjXxpxCuKZwv2l7Dv8/edit`

Resultados:

- `TESTE_BASE_V51_MED`: ausente em `Medicamentos` e `Compras_Medicamentos`.
- `TESTE_ROLLBACK_V50_MED`: ausente em `Medicamentos` e `Compras_Medicamentos`.
- `TESTE_ROLLBACK_V48_MED`: ausente em `Medicamentos` e `Compras_Medicamentos`.

## Diagnostico

Causa raiz: NAO investigada nesta rodada, porque a regra determinava parar se v48 falhasse.

Hipotese mais forte:

- `saveData`/front cria placeholder otimista e fecha modal sem confirmar persistencia real.
- Ou o backend nao grava na planilha oficial usada para validacao.
- Ou a execucao falha/retorna erro sem ser exposta ao usuario.

## Falhas

Criticas:

- v51 nao persiste Medicamentos.
- v50 nao persiste Medicamentos.
- v48 nao persiste Medicamentos.
- Nenhuma versao estavel foi identificada pela sequencia de rollback indicada.

Medias:

- Nao foi possivel confirmar `HANDOVER_SPREADSHEET_ID` em runtime nesta rodada.
- Nao foram consultados logs de Apps Script nesta rodada.

Leves:

- Nenhuma.

## Decisao

Parar. Producao permanece em `@48`, mas nao pode ser considerada protegida para criacao de Medicamentos.

Proximo passo recomendado:

1. Consultar Apps Script Executions para os testes `TESTE_BASE_V51_MED`, `TESTE_ROLLBACK_V50_MED` e `TESTE_ROLLBACK_V48_MED`.
2. Confirmar o valor runtime de `HANDOVER_SPREADSHEET_ID`.
3. Corrigir o fluxo `saveData` para nao fechar modal/fingir sucesso sem persistencia real.
4. Publicar hotfix minimo apenas depois de validar gravacao em `Medicamentos` e espelho em `Compras_Medicamentos`.
