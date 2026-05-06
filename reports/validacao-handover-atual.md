# Validacao Handover - v29 visual limpa

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada: `release/handover-v29-visual-clean`

Commit publicado: `6fa9e8b - style(handover): reaplica polimento visual desktop sobre v28 publicada`

Base usada: `e5aa219 - reports: validacao Handover a3d9a20`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: OK

Versao publicada: 29.

Rollback feito: NAO.

POP tocado: NAO.

## Pre-deploy

- `git fetch origin`: OK.
- Branch atual confirmada: `release/handover-v29-visual-clean`.
- `HEAD`: `6fa9e8b`.
- `git diff --name-only e5aa219..6fa9e8b`: somente `Index.html`.
- `Code.gs`: sem alteracao em relacao a `e5aa219`.
- Commit `2f45b08`: NAO esta na branch publicada.
- Nao ha `sheet.clear()` no diff.
- Nao ha referencia ao scriptId/deploymentId do POP no diff.
- Schema/backend nao foram alterados nesta publicacao.

## Publicacao

- `clasp status`: OK.
- `clasp push`: OK. O clasp enviou os arquivos rastreados do Apps Script, mas a unica alteracao relevante em relacao a base foi `Index.html`.
- `clasp version`: criada versao 29.
- `clasp deploy`: deployment oficial atualizado para versao 29.
- DeploymentId e URL oficial preservados.

## Smoke real pos-publicacao

- Abertura: OK. Web App abriu sem erro critico.
- Visual desktop: OK. Header compacto, largura desktop aproveitada, KPIs com icones SVG e cards mais compactos.
- 1366px: OK. `scrollWidth` = 1366, sem rolagem horizontal grosseira.
- KPIs: OK. 5 KPIs visiveis.
- Abas: OK. Pendencias, Medicamentos, Checklist e Historico aparecem e alternam.
- Pendencias: OK. Cards compactos e legiveis.
- Medicamentos: OK. Cards compactos e legiveis.
- Sidebar: OK. Coluna lateral Checklist/Historico aparece.
- Novo Registro: OK. Dropdown abre; Pendencia abre `Geral`; Medicamento solicitado abre `Medicamentos`.
- Falta: OK. Cliente, telefone, pre-pago e preco ficam ocultos.
- Encomenda: OK. Cliente, telefone, preco e pre-pago ficam visiveis.
- Checklist: OK. Checklist abre, botoes `Feito`, `N/A`, `Pendente` aparecem e respondem; rascunho de observacao nao sumiu ao alterar outro item.
- Historico: OK. Aba abre, filtros aparecem e dados carregam sob demanda.
- Menu tres pontos: OK. Nao existe `Imprimir`; existem `Ver detalhes`, `Ver trilha de auditoria` e `Copiar informacoes`.
- Atualizar agora: OK. Botao presente e acionado sem erro critico.
- WhatsApp: OK. Abriu `api.whatsapp.com/send` em nova aba com telefone normalizado em `55...`; nenhuma mensagem real foi enviada.
- Mobile regressao minima: OK. Viewport 390px, sem largura interna 980px e sem overflow horizontal critico.
- Registros criados: nenhum.

## Evidencias objetivas

- Versao publicada: 29.
- Desktop 1366px: `scrollWidth=1366`, `viewportWidth=1366`, `horizontalOverflow=false`.
- Mobile 390px: `innerWidth=390`, `scrollWidth=390`, `has980=false`, `overflowCritical=false`.
- SVGs encontrados: 23.
- KPIs encontrados: 5.
- WhatsApp abriu: `https://api.whatsapp.com/send/?phone=5521999999999&text=...`.

## Falhas

### Criticas

- Nenhuma.

### Medias

- Nenhuma.

### Leves

- Nenhuma.

## Veredito

Publicado e aprovado. v29 visual limpa publicada a partir da branch `release/handover-v29-visual-clean`, sem incluir `2f45b08` e sem alterar `Code.gs` em relacao a base v28 aprovada.
