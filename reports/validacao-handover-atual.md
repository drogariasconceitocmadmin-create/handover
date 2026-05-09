# Validacao Handover v57 - Performance Save Medicamentos

Projeto: Handover - Drogarias Conceito

Branch publicada: `hotfix/handover-p0-save-medicamentos`

Commit publicado: `636ef8d - perf(handover): reduz espera ao salvar medicamento e melhora leitura dos cards`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: OK COM RESSALVA

Versao publicada: 57.

Rollback feito: NAO.

POP tocado: NAO.

## Preflight

- Branch `hotfix/handover-p0-save-medicamentos`: OK.
- HEAD `636ef8d`: OK.
- `.clasp.json` do Handover oficial: OK.
- POP ausente: OK.
- `sheet.clear()` novo: ausente.
- `deleteRow` novo: ausente; ocorrencia existente e legada nao entrou neste hotfix.
- Checklist nao foi alterado pelo hotfix: OK.
- Login/PIN nao foi alterado pelo hotfix: OK.
- `Status_Compra` nao foi alterado pelo hotfix: OK.
- `saveData` nao chama `setupSpreadsheet()` diretamente: OK.
- Observacao: `requireSessionHandover_` ainda chama `setupSpreadsheet()` por caminho legado de validacao de sessao.
- Log de performance presente: `[Handover][perf] saveData total...` no backend e `[Handover] saveData ms=...` no console do front.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- Versao criada: 57.
- Deployment oficial atualizado para v57.
- Novo deployment nao foi criado.

## Smoke 1 - Login

- Login Carlos/admin: OK.
- Dashboard abriu: OK.

## Smoke 2 - Performance Encomenda

Registro:

- `TESTE_PERF_ENCOMENDA_V57`

Resultado:

- Tempo do clique Salvar ate modal fechar com sucesso real: 11,7s.
- Log capturado: `[Handover] saveData ms= 11121`.
- Gravou em `Medicamentos`: OK.
- Espelhou em `Compras_Medicamentos`: OK.
- Persistiu apos logout/login: OK.
- Modal nao fechou em falso: OK.
- Campos conferidos:
  - Fornecedor_Compra: `Panpharma`.
  - Codigo_Compra_Fornecedor: `PERF57`.
  - Forma_Recebimento: `A combinar`.

Observacao:

- Uma tentativa sem `Previsao_Entrega` foi bloqueada pela validacao do formulario com a mensagem `Informe a previsao de entrega.`; nao houve chamada de sucesso falsa.

## Smoke 3 - Performance Falta

Registro:

- `TESTE_PERF_FALTA_V57`

Resultado:

- Tempo do clique Salvar ate modal fechar com sucesso real: 19,9s.
- Log capturado: `[Handover] saveData ms= 19619`.
- Gravou em `Medicamentos`: OK.
- Espelhou em `Compras_Medicamentos`: OK.
- Cancelamento pelo Handover: OK.
- `Compras_Medicamentos.Status_Compra` ficou `Cancelado`: OK.

## Smoke 4 - Regressao curta

WhatsApp:

- Encomenda marcada como Comprado.
- Botao `Avisar no WhatsApp` abriu URL `api.whatsapp.com` sem envio real.
- Texto decodificado conferido com acentuacao correta:
  - `Olá, Teste Perf!`
  - `está`
  - `você`
  - `Você`
- Mojibake visual: nao observado.

Atualizar agora:

- Botao virou `Atualizando...`: OK.
- Botao voltou para `Atualizar agora`: OK.

Menu:

- Menu do card nao trouxe `Imprimir`: OK.

Cards:

- Titulo do card medido em `19px`: OK.
- Descricao do card medida em `15px`: OK.
- Sem overflow horizontal observado: OK.

## Performance residual

- Estimativa anterior: 25-30s.
- Encomenda v57 medida: 11,7s.
- Falta v57 medida: 19,9s.
- `refreshDashboardBundle` ainda aparece pesado em logs do front, com medicoes observadas de 14,8s, 20,0s e 26,4s.

## Limpeza

Registros criados nesta rodada:

- `TESTE_PERF_ENCOMENDA_V57`
- `TESTE_PERF_FALTA_V57`

Limpeza realizada:

- Os dois registros foram cancelados logicamente pelo Handover.
- Nenhuma linha foi apagada fisicamente.
- Usuarios, cabecalhos e abas nao foram alterados manualmente.

## Falhas

Criticas:

- Nenhuma.

Medias:

- Falta ainda levou 19,9s para salvar; abaixo do pior caso de 25-30s, mas ainda perceptivelmente lenta.
- `refreshDashboardBundle` continua pesado, com medicoes entre 14,8s e 26,4s.

Leves:

- Tentativa sem previsao de entrega foi bloqueada corretamente por validacao do formulario.

## Veredito

v57 publicada e mantida. Persistencia real, espelho em `Compras_Medicamentos`, WhatsApp, Atualizar agora e cards passaram. A performance melhorou na Encomenda, mas ainda ha gargalo residual no refresh e na Falta.
