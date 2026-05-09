# Validacao Handover - v49 detalhes medicamentos e limpeza segura

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada: `feat/handover-auth-pin-v41-recebimento`

Commit minimo validado: `5d4e161 - ux(handover): ficha por secoes no modal Ver detalhes (Medicamentos)`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Planilha: `1tHDX3I5yVx2UioNki695UIoNxHjXxpxCuKZwv2l7Dv8`

## Resultado

Status geral: PARCIAL

Versao publicada: 49.

Rollback feito: NAO.

Versao ativa apos acao: 49.

POP tocado: NAO.

## Pre-flight

- Branch atual: `feat/handover-auth-pin-v41-recebimento`.
- `HEAD` contem `5d4e161`.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: ausente no diff.
- `sheet.clear()` novo no diff: ausente.
- `deleteRow` novo no diff: ausente.
- Login/PIN: presente.
- `PIN_Novo_Temporario`: presente.
- `aplicarPinsTemporariosHandover`: presente.
- `Compras_Medicamentos`: presente.
- Modal `Ver detalhes` de Medicamentos em ficha por secoes: presente.
- Sintaxe de `Code.gs`: OK.
- Sintaxe dos scripts de `Index.html`: OK.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- `clasp.cmd version`: criada versao 49.
- `clasp.cmd deploy`: deployment oficial atualizado para versao 49.
- URL oficial mantida.

## Login/PIN e usuarios

Resultado: OK.

- Dashboard bloqueado sem login.
- Login Carlos/admin funcionou com PIN operacional.
- Logout voltou para tela de login.
- Usuarios oficiais conferidos na aba `Usuarios_Handover`:
  - Ainale / ainale / operador / Ativo TRUE / Pin_Hash presente.
  - Marco / marco / admin / Ativo TRUE / Pin_Hash presente.
  - Carlos / carlos / admin / Ativo TRUE / Pin_Hash presente.
  - Jelcinei / jelcinei / gerente / Ativo TRUE / Pin_Hash presente.
  - Priscila / priscila / operador / Ativo TRUE / Pin_Hash presente.
  - Marcelo / marcelo / operador / Ativo TRUE / Pin_Hash presente.
- `PIN_Novo_Temporario`: vazio para os usuarios oficiais.
- PIN em texto puro na planilha: nao identificado.

Observacao: `clasp.cmd run debugAuthUsuariosHandover` e `selfTestAuthHandover` retornaram `Script function not found` por configuracao de execucao via clasp; a validacao foi feita pela aba `Usuarios_Handover` e pelo login real no Web App.

## Limpeza segura de dados de teste

Resultado: OK.

Modo usado: exclusao de linhas identificadas por criterio textual, de baixo para cima, sem apagar abas, sem remover cabecalhos e sem `sheet.clear()`.

Critérios aplicados, em campos principais: `CODEX`, `CODEX_`, `TESTE`, `TESTE_`, `SELFTEST`, `V46`, `V47`, `V48`, `P0TESTE`, `V48PAN`, `V48SC`, `V48ENT`, `CODEX_RECEB`, `CODEX_V48`, `TESTE_V46`, `CODEX_P0`.

Abas limpas:

- `Geral`: 1 linha removida.
- `Medicamentos`: 34 linhas removidas, incluindo o registro final `TESTE_FINAL_LIMPEZA`.
- `Compras_Medicamentos`: 18 linhas removidas, incluindo o espelho final `TESTE_FINAL_LIMPEZA`.
- `Arquivo_Resolvidos`: 20 linhas removidas.
- `Checklist_Turnos`: 0 linhas removidas; preservada para evitar remover estrutura historica do checklist.
- `Usuarios_Handover`: 0 linhas removidas; usuarios oficiais preservados.

Total removido: 73 linhas.

Confirmacoes apos limpeza:

- Cabecalhos preservados.
- Abas oficiais preservadas.
- `Usuarios_Handover` preservada com usuarios oficiais.
- `Compras_Medicamentos` preservada com colunas e dropdown operacional.

## Smoke apos limpeza

Resultado: PARCIAL.

Registro criado para validacao e removido ao final:

- `TESTE_FINAL_LIMPEZA`
  - Cliente: `Teste Final`
  - Telefone: `21999999999`
  - Fornecedor_Compra: `Panpharma`
  - Codigo_Compra_Fornecedor: `FINAL01`
  - Forma_Recebimento: `A combinar`

Validacoes:

- Web App abriu na URL oficial.
- Login obrigatorio exibido.
- Login Carlos/admin funcionou.
- Nova Encomenda foi salva em `Medicamentos`.
- Espelho em `Compras_Medicamentos` foi criado com `Panpharma`, `FINAL01` e `A combinar`.
- Item apareceu na aba Medicamentos apos `Atualizar agora`.
- `Marcar como comprado` funcionou e atualizou `Medicamentos.Status = Comprado`.
- Cancelamento pelo Handover disparou confirmacao clara.
- Cancelamento refletiu em `Medicamentos` e `Compras_Medicamentos` como `Cancelado`, com `Cancelado_Por = Carlos`.
- Checklist abriu.
- Historico abriu.
- Menu contextual nao mostrou `Imprimir`.
- Logout voltou para login.

Ressalvas:

- A automacao nao conseguiu capturar a URL final do WhatsApp no smoke v49. A acentuacao e a capitalizacao ja estavam validadas na rodada v48 e a UI manteve os campos de recebimento corretos.
- O item criado apareceu no Web App apos acionar `Atualizar agora`; o save e o espelho foram confirmados pela planilha.

## Falhas

Falhas criticas: nenhuma.

Falhas medias:

- WhatsApp do registro final nao teve URL capturada pela automacao nesta rodada.

Falhas leves:

- `clasp.cmd run` nao executou os self-tests de auth por configuracao de API executable.
- Registro final precisou de `Atualizar agora` para confirmacao visual na aba Medicamentos.

## Decisao

Manter v49 publicada. A publicacao, login, limpeza segura, criacao/espelho/cancelamento de Encomenda, Checklist, Historico e logout passaram. A rodada fica PARCIAL apenas pela captura automatica do WhatsApp no smoke final.
