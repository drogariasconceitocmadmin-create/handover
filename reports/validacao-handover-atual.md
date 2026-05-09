# Incidente P0 - Diagnostico e hotfix persistencia Medicamentos

Projeto: Handover - Drogarias Conceito

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

## Resultado

Status geral: OK COM RESSALVA

Versao ativa inicial: 48.

Versao ativa final: 55.

Producao protegida: SIM para criacao/persistencia de Medicamentos e espelho Compras.

POP tocado: NAO.

## Diagnostico

Teste controlado:

- `TESTE_P0_SAVE_LOG_2`

Evidencia capturada no Web App:

- Modal fechava antes da confirmacao real do backend.
- Item ficava visivel como estado otimista.
- Apos aproximadamente 10 segundos, o front recebia erro de backend.
- Erro exato exibido:

`Error: Estrutura de cabecalho incompativel na aba "Checklist_Turnos". Ajuste manualmente os cabecalhos para: ID, Data, Turno, Horario_Referencia, Categoria, Item, Descricao, Status, Responsavel, Data_Hora_Check, Observacao.`

Console do navegador:

- `[Handover] saveData_fail ms= 10232`
- `[Handover] refreshDashboardBundle_fail ms= 9280`

Conclusao:

- `saveData` chegava ao backend.
- A falha nao era em Medicamentos diretamente.
- `saveData` chamava `setupSpreadsheet()`.
- `setupSpreadsheet()` validava `Checklist_Turnos` com cabecalho rigido via `ensureHeaders_`.
- A aba `Checklist_Turnos` ja tinha estrutura diferente/aditiva.
- A validacao rigida de Checklist derrubava o salvamento de Medicamentos antes do append.
- O front mascarava o problema ao fechar o modal e exibir item otimista antes do sucesso real.

## Patch

Branch: `hotfix/handover-p0-save-medicamentos`

Commit: `228e109 - fix(handover): corrige persistencia real de medicamentos`

Arquivos alterados:

- `Code.gs`
- `Index.html`

Alteracoes:

- `Code.gs`: `Checklist_Turnos` passou a usar `ensureHeadersLegacyAdditive_` em `setupSpreadsheet()`.
- `Index.html`: modal de Novo Registro so fecha apos resposta de sucesso real.
- `Index.html`: se o backend falhar ou nao retornar `record.ID`, o placeholder otimista e removido e o erro aparece no modal.

Nao houve:

- alteracao de Checklist UX/templates;
- alteracao de layout;
- alteracao de POP;
- `sheet.clear()`;
- `deleteRow` novo.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- Versao criada: 55.
- Deployment oficial atualizado para v55.

## Smoke do hotfix

### Encomenda

Registro:

- `TESTE_P0_SAVE_REAL`

Resultado:

- Login Carlos/admin: OK.
- Criacao pelo Web App: OK.
- Gravou em `Medicamentos`: OK.
- Espelhou em `Compras_Medicamentos`: OK.
- Persistiu apos logout/login: OK.
- Visivel na UI apos reload: OK.
- Fornecedor: `Panpharma`.
- Codigo: `P0REAL`.
- Forma de recebimento: `A combinar`.

### Falta

Registro:

- `TESTE_P0_FALTA_REAL`

Resultado:

- Criacao pelo Web App: OK.
- Gravou em `Medicamentos`: OK.
- Espelhou em `Compras_Medicamentos`: OK.
- Persistiu apos Atualizar agora/reload: OK.

### Comprado / WhatsApp / Cancelamento

Registro usado:

- `TESTE_P0_SAVE_REAL`

Resultado:

- Marcar como Comprado: OK.
- `Medicamentos.Status = Comprado`: OK.
- `Compras_Medicamentos.Status_Compra = Comprado`: OK.
- WhatsApp abriu sem envio real: OK.
- URL WhatsApp sem mojibake:
  `Olá, Teste Real! ... Você ... está ... você`
- Cancelar Encomenda pelo Handover: OK.
- `Medicamentos.Status = Cancelado`: OK.
- `Compras_Medicamentos.Status_Compra = Cancelado`: OK.
- `Cancelado_Por = Carlos`: OK.
- `Motivo_Cancelamento = limpeza teste p0`: OK.

## Falha residual

Ao cancelar `TESTE_P0_FALTA_REAL` pelo Handover:

- `Medicamentos.Status = Cancelado`: OK.
- `Compras_Medicamentos` continuou com `Status_Compra = Pendente de compra`.

Classificacao: falha media, porque o P0 de persistencia foi corrigido e o cancelamento da Encomenda validou o espelho principal.

## HANDOVER_SPREADSHEET_ID

Nao foi possivel consultar `clasp run getSpreadsheetIdForDebug` porque o script nao esta publicado como API executable.

Evidencia indireta:

- Os registros criados pelo Web App v55 apareceram na planilha oficial esperada:
  `1tHDX3I5yVx2UioNki695UIoNxHjXxpxCuKZwv2l7Dv8`.

## Apps Script Executions

`clasp logs --json` falhou porque o GCP project ID nao esta configurado no ambiente.

Evidencia usada:

- Console do navegador.
- Mensagem de erro visivel no Web App.
- Busca direta na planilha oficial.
- Retorno visual do Web App apos reload/login.

## Versao ativa final

Deployment oficial ativo em v55.

## Falhas

Criticas:

- Nenhuma apos hotfix v55.

Medias:

- Cancelamento de Falta nao refletiu `Status_Compra = Cancelado` em `Compras_Medicamentos`.
- `clasp logs` indisponivel sem GCP project ID.
- `clasp run` indisponivel porque o script nao esta publicado como API executable.

Leves:

- Testes de limpeza foram feitos por cancelamento logico, nao por remocao fisica.

## Veredito

P0 de persistencia de Medicamentos corrigido em v55. Producao protegida para criacao de Medicamentos e espelho principal em Compras_Medicamentos.
