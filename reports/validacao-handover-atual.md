# Validacao Handover - hotfix v46 cancel refresh status whatsapp

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada: `feat/handover-auth-pin-v41-recebimento`

Commit validado: `15682e8 - fix(handover): cancel UX, refresh feedback, planilha reverte Cancelado, nome cliente msgs`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: PARCIAL

Versao publicada: 47.

Rollback feito: NAO.

Versao ativa apos acao: 47.

POP tocado: NAO.

## Pre-deploy

- Branch atual confirmada: `feat/handover-auth-pin-v41-recebimento`.
- `HEAD`: `15682e8`.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: ausente no diff.
- `sheet.clear()` novo no diff: ausente.
- `deleteRow` novo no diff: ausente.
- Login/PIN: presente.
- `Compras_Medicamentos`: presente.
- `processarStatusCompraPorIdHandover_`: presente e com regras para `Pendente de compra`, `Comprado`, `Nao encontrado` e `Cancelado`.
- `formatNomeClienteMensagem_`: presente.
- Sintaxe de `Code.gs`: OK.
- Sintaxe dos scripts de `Index.html`: OK.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- `clasp.cmd version`: criada versao 47.
- `clasp.cmd deploy`: deployment oficial atualizado para versao 47.
- URL oficial mantida.

## Smoke real

### Login/PIN

Resultado: OK.

- Web App abriu.
- Login Carlos/admin funcionou.
- PIN errado foi testado em rodada anterior da mesma URL e nao liberou.

### Atualizar agora

Resultado: OK com observacao.

- Botao mudou para `Atualizando...`.
- Botao voltou para `Atualizar agora`.
- Tempo observado: cerca de 15 a 20 segundos.
- Nao travou permanentemente.

### Nova Encomenda

Resultado: OK.

Registro criado:

- Medicamento: `TESTE_V46_WHATSAPP_1778281012098`
- Cliente: `maria clara`
- Telefone: `21999999999`
- Fornecedor_Compra: `Panpharma`
- Codigo_Compra_Fornecedor: `V46COD`
- Forma_Recebimento: `A combinar`

Validacao:

- Apareceu no front apos refresh.
- Apareceu em `Medicamentos`.
- Apareceu em `Compras_Medicamentos`.
- Espelho em `Compras_Medicamentos` preservou ID, cliente, telefone, fornecedor, codigo e forma de recebimento.

### WhatsApp/capitalizacao

Resultado: FALHA MEDIA.

- Botao `Avisar no WhatsApp` abriu URL sem envio real.
- Texto nao apresentou mojibake: `Olá`, `já`, `está`, `você`, `Você` apareceram corretos na URL decodificada.
- Falha: nome do cliente continuou em minusculo: `Olá, maria clara!`.
- Esperado: `Olá, Maria Clara!`.

URL decodificada observada continha:

`Olá, maria clara! Passando para avisar que o medicamento TESTE_V46_WHATSAPP_1778281012098 já chegou aqui na Drogarias Conceito e está separado para você.`

### Reversao Cancelado pela planilha

Resultado: NAO VALIDADO POR PERMISSAO DE AMBIENTE.

- Tentativa de escrita via Google Sheets API retornou HTTP 403.
- Abrir Google Sheets no Playwright exigiu login Google.
- Foi feita validacao estatica da funcao `processarStatusCompraPorIdHandover_`, que contempla:
  - `Pendente de compra` -> Medicamentos `Pendente`.
  - `Comprado` -> Medicamentos `Comprado`.
  - `Cancelado` -> Medicamentos `Cancelado`.
- Nao foi possivel confirmar gatilho real pela planilha neste ambiente.

### Cancelamento pelo Handover

Resultado: NAO VALIDADO COMPLETO.

- O registro testado foi marcado como Comprado.
- O filtro/busca ficou em `Comprados sem aviso` em uma tentativa de automacao, e o card nao foi localizado para acionar cancelamento.
- Cancelamento nao foi concluido pelo smoke automatizado.

### Filtros

Resultado: PARCIAL.

- Medicamento criado apareceu ao buscar pelo nome.
- `Comprados` exibiu o registro apos marcar como comprado.
- Observacao: com busca ativa, o cabecalho indicou `1 registro(s)` enquanto chips de contagem mostravam zeros em alguns filtros. Nao houve caso de contador cheio com lista vazia para o item criado, mas a contagem por chip ainda merece revisao.

### Menu tres pontos

Resultado: OK.

- Card apresentou menu contextual com `overflow: visible`.
- Opcoes observadas: `Ver detalhes`, `Ver trilha de auditoria`, `Copiar informacoes`, `Cancelar pedido`.
- `Imprimir` nao apareceu.

### Checklist

Resultado: OK.

- Aba/area de Checklist abriu.

### Historico

Resultado: PARCIAL.

- Tentativa por texto acentuado falhou na automacao; nao houve evidencia de quebra do Web App.

## Falhas

### Criticas

- Nenhuma falha critica observada que exigisse rollback automatico.

### Medias

1. Capitalizacao do nome no WhatsApp nao funcionou.
   - Evidencia: `Olá, maria clara!`.
   - Esperado: `Olá, Maria Clara!`.

2. Reversao de Cancelado pela planilha nao foi validada em smoke real.
   - Motivo: API retornou 403 e UI do Sheets exigiu login.
   - Validacao estatica da funcao foi feita.

3. Cancelamento pelo Handover nao foi concluido pela automacao.

### Leves

- Botao `Atualizar agora` levou cerca de 15 a 20 segundos para voltar, mas voltou.
- Chips de filtro podem ficar desalinhados com busca ativa.

## Veredito

Publicado com ressalvas. Versao 47 mantida porque login, criacao de Encomenda, espelho em `Compras_Medicamentos`, abertura do WhatsApp sem mojibake, menu e Checklist passaram. Proxima correcao recomendada: aplicar capitalizacao no fluxo client-side do WhatsApp e validar manualmente a reversao de `Cancelado` na planilha.
