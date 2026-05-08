# Validacao Handover - v48 WhatsApp capitalizacao e smoke completo

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada: `feat/handover-auth-pin-v41-recebimento`

Commit validado: `e6c2380 - fix(handover): capitaliza nome cliente no WhatsApp (front)`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Planilha: `1tHDX3I5yVx2UioNki695UIoNxHjXxpxCuKZwv2l7Dv8`

## Resultado

Status geral: PARCIAL

Versao publicada: 48.

Rollback feito: NAO.

Versao ativa apos acao: 48.

POP tocado: NAO.

## Pre-flight

- Branch atual: `feat/handover-auth-pin-v41-recebimento`.
- `HEAD`: `e6c2380`.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: ausente no diff.
- `sheet.clear()` novo no diff: ausente.
- `deleteRow` novo no diff: ausente.
- Login/PIN: presente.
- `Compras_Medicamentos`: presente.
- `formatNomeClienteMensagem_` no `Index.html`: presente.
- `buildWhatsAppMessageClient_`: presente, sem mojibake encontrado nas buscas de `VocÃ`, `estÃ`, `OlÃ`, `endereÃ`.
- Sintaxe de `Code.gs`: OK.
- Sintaxe dos scripts de `Index.html`: OK.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- `clasp.cmd version`: criada versao 48.
- `clasp.cmd deploy`: deployment oficial atualizado para versao 48.
- URL oficial mantida.

## Smoke 1 - Login/PIN

Resultado: OK.

- Web App abriu com overlay de login.
- PIN errado foi testado; a automacao nao capturou o texto do erro por acentuacao, mas nao houve liberacao indevida.
- Login Carlos/admin funcionou.
- Logout voltou para login.
- Login Carlos/admin novamente funcionou para continuar os testes.

## Smoke 2 - Nova Encomenda + Compras_Medicamentos

Resultado: OK.

Registros criados:

1. `CODEX_V48_ENCOMENDA`
   - Cliente: `maria clara`
   - Fornecedor_Compra: `Panpharma`
   - Codigo_Compra_Fornecedor: `V48PAN`
   - Forma_Recebimento: `A combinar`

2. `CODEX_V48_RETIRA`
   - Cliente: `ana paula`
   - Fornecedor_Compra: `Santa Cruz`
   - Codigo_Compra_Fornecedor: `V48SC`
   - Forma_Recebimento: `Retira na loja`

3. `CODEX_V48_ENTREGA`
   - Cliente: `joao da silva`
   - Fornecedor_Compra: `Panpharma`
   - Codigo_Compra_Fornecedor: `V48ENT`
   - Forma_Recebimento: `Entregar no endereço cadastrado`

Validacao:

- Os tres itens apareceram na aba Medicamentos do Web App.
- Os tres itens apareceram em `Medicamentos` na planilha.
- Os tres itens apareceram em `Compras_Medicamentos`.
- Fornecedor, codigo e forma de recebimento foram espelhados corretamente.
- `Status_Compra` inicial foi `Pendente de compra`, exceto o item marcado como comprado no smoke.

## Smoke 3 - WhatsApp / Capitalizacao / Acentuacao

Resultado: OK.

### A combinar

Item: `CODEX_V48_ENCOMENDA`

Mensagem decodificada conteve:

`Olá, Maria Clara! Passando para avisar que o medicamento CODEX_V48_ENCOMENDA já chegou aqui na Drogarias Conceito e está separado para você.`

Tambem conteve:

`Você prefere retirar na loja ou quer que a gente combine a entrega? Obrigado!`

### Retira na loja

Item: `CODEX_V48_RETIRA`

Mensagem decodificada conteve:

`Olá, Ana Paula!`

E:

`está separado para retirada na loja.`

`Pode vir buscar! Responda essa mensagem se precisar de entrega.`

### Entregar no endereco cadastrado

Item: `CODEX_V48_ENTREGA`

Mensagem decodificada conteve:

`Olá, Joao da Silva!`

E:

`está separado para entrega no endereço cadastrado.`

`Podemos seguir com a entrega?`

Confirmado:

- Sem `maria clara` em minusculo na saudacao.
- Sem `VocÃª`, `estÃ¡`, `OlÃ¡`, `endereÃ§o`.
- Select exibiu `Entregar no endereço cadastrado` corretamente.
- WhatsApp abriu por URL sem envio real.

## Smoke 4 - Formas de Recebimento

Resultado: OK.

- `A combinar`: mensagem correta.
- `Retira na loja`: mensagem correta.
- `Entregar no endereço cadastrado`: mensagem correta.

## Smoke 5 - Reversao Cancelado pela planilha

Resultado: NAO VALIDADO POR LIMITACAO TECNICA DO AMBIENTE.

- O conector Google Sheets permite `batch_update`, mas edicoes por API nao disparam gatilho `onEdit` do Apps Script.
- Abrir Google Sheets via Playwright exigiu login Google.
- Para evitar falso negativo, nao foi alterado `Status_Compra` via API como substituto de edicao humana.
- Validacao estatica confirmou que `processarStatusCompraPorIdHandover_` contempla:
  - `Cancelado` -> `Status_Handover = Cancelado`.
  - `Comprado` -> volta para status comprado.
  - `Pendente de compra` -> volta para pendente.

## Smoke 6 - Cancelamento pelo Handover

Resultado: OK.

Registro criado:

- `CODEX_V48_CANCELAR`

Validacao:

- Menu tres pontos abriu com `overflow: visible`.
- `Imprimir` nao apareceu.
- Confirmacao exibiu mensagem melhorada:
  - `Tem certeza que deseja cancelar esta solicitação de medicamento?`
  - `Essa ação vai marcar o pedido como CANCELADO no Handover e também na planilha de compras.`
  - `Se foi um engano, você poderá reverter depois alterando o status para Pendente de compra ou Comprado.`
- Prompt de motivo apareceu.
- Card ficou `CANCELADO`.
- Em `Compras_Medicamentos`:
  - `Status_Compra = Cancelado`
  - `Status_Handover = Cancelado`
  - `Cancelado_Por = Carlos`
  - `Data_Cancelamento` preenchida
  - `Motivo_Cancelamento = Smoke v48 cancelamento`
- Botao WhatsApp nao apareceu indevidamente no item cancelado.

## Smoke 7 - Filtros Medicamentos

Resultado: OK com ressalva leve.

Filtros validados:

- Todos
- Pendentes
- Faltas
- Encomendas
- Comprados
- Comprados sem aviso
- Entregues
- Cancelados
- Vencidos/Hoje
- Resolvidos parcialmente

Nenhum caso de contador positivo com lista vazia foi observado com a busca limpa.

Ressalva:

- A automacao por texto pode clicar `Comprados sem aviso` quando procura `Comprados`; foi contornado com selecao exata por botao.

## Smoke 8 - Atualizar agora

Resultado: OK com ressalva de performance.

- Botao mudou para `Atualizando...`.
- Botao voltou para `Atualizar agora`.
- Tempo aproximado observado: 26 segundos.
- Nao ficou travado.

## Smoke 9 - Menu, Checklist e Historico

Resultado: PARCIAL.

- Menu tres pontos em Medicamentos: OK, nao cortou e sem `Imprimir`.
- Checklist abriu: OK.
- Historico: a automacao por texto nao confirmou a aba em uma rodada, mas nao houve erro de console nem quebra visivel.
- Reabrir/Reverter nao foi executado por seguranca.

## Falhas

### Criticas

- Nenhuma.

### Medias

- Reversao `Cancelado -> Comprado` e `Cancelado -> Pendente de compra` pela planilha nao foi validada por limitacao tecnica: edicao por API nao dispara `onEdit`, e UI do Sheets exigiu login.
- Historico nao foi validado completamente.

### Leves

- `Atualizar agora` levou cerca de 26 segundos.
- Automacao por texto exige cuidado com chips `Comprados` vs `Comprados sem aviso`.

## Veredito

Publicado e aprovado com ressalvas operacionais. v48 mantida publicada. Proxima acao: Carlos deve validar manualmente na planilha a reversao de `Status_Compra` de `Cancelado` para `Comprado` e para `Pendente de compra`, porque isso depende de edicao humana/onEdit no Google Sheets.
