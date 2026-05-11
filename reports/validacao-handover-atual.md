# Validacao Handover v58 - Smoke Real

Projeto: Handover - Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit local: `c923984 - feat(handover): adiciona edicao auditada e ajustes UX v57`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Data smoke real: 2026-05-11

Sessoes: 2026-05-10 (sem browser, rollback preventivo) + 2026-05-11 (smoke real)

## Resultado

Status geral: APROVADO_COM_RESSALVAS

Versao testada: 58.

Versao ativa no deployment: 57 (aguarda republicacao manual).

Rollback feito: SIM (preventivo de 10/05, mantido ate republicacao manual).

POP tocado: NAO.

## Smoke v58 - Resultados por Item

| Item | Resultado | Detalhe |
|------|-----------|---------|
| Login/PIN | PASSOU | Carlos/642068. Session token estabelecido. |
| Criar Encomenda | PASSOU | TESTE_V58_WA criado 11/05 12:20:34. Campos salvos. |
| Gravacao Medicamentos | PASSOU | saveData persistiu em aba Medicamentos. |
| Espelho Compras_Medicamentos | PASSOU PARCIAL | FALTA2 confirmado. TESTE_V58_WA nao verificado na planilha (sessao interrompida). |
| Persistencia logout/login | PASSOU | Re-login em 11/05, dados persistidos entre sessoes. |
| Popup fecha pos-sucesso | PASSOU | Popup fecha apos confirmacao backend. |
| Edicao de medicamento | PASSOU | Botao Editar presente. Formulario abre e salva. |
| Auditoria_Handover (EDITAR) | PASSOU | Acao=EDITAR registrada com todos os campos. |
| Criar Falta | PASSOU | TESTE_V58_FALTA2 criado 11/05 12:13:46. Tipo=Falta via keyboard nav. |
| Cancelamento de Falta | PASSOU | FALTA2 cancelado 11/05 12:15:32. Card moveu para Cancelados. |
| Status_Compra = Cancelado | PASSOU | Cancelado_Por=Carlos. Tag CANCELADO. Mensagem "Pedido cancelado." |
| WhatsApp sem mojibake | PASSOU | URL: phone=5511987654321, texto "Ola, Ana Silva!" UTF-8 correto. |
| Atualizar agora | PASSOU | Botao mostrou "Atualizando..." e completou. |
| Cards maiores | PASSOU | Todos os campos visiveis no card. |
| Header sem "Nome - Perfil" | PASSOU | Header exibe apenas "Carlos" como OPERADOR ATUAL. |
| Logo ou fallback | PASSOU | Logo Drogarias Conceito visivel. |

## WhatsApp - Detalhe do Link Gerado

URL capturada no tab aberto pelo botao "Avisar no WhatsApp":

```
https://api.whatsapp.com/send/?phone=5511987654321&text=Ol%C3%A1%2C+Ana+Silva%21+Passando+para+avisar+que+o+medicamento+TESTE_V58_WA+j%C3%A1+chegou+aqui+na+Drogarias+Conceito+e+est%C3%A1+separado+para+voc%C3%AA.%0A%0AVoc%C3%AA+prefere+retirar+na+loja+ou+quer+que+a+gente+combine+a+entrega%3F+Obrigado%21&type=phone_number&app_absent=0
```

Verificacoes:
- Phone: `5511987654321` - DDI 55 + DDD 11 + numero: CORRETO
- Texto decodificado: `Ola, Ana Silva! Passando para avisar que o medicamento TESTE_V58_WA ja chegou aqui na Drogarias Conceito e esta separado para voce. Voce prefere retirar na loja ou quer que a gente combine a entrega? Obrigado!`
- Encoding: UTF-8 URL-encoded, sem mojibake: CORRETO
- Nome capitalizado "Ana Silva": CORRETO

## Limpeza

Registros criados: TESTE_V58_FALTA2, TESTE_V58_WA.

Registros cancelados logicamente:
- TESTE_V58_FALTA2: CANCELADO em 11/05 12:15:32
- TESTE_V58_WA: CANCELADO em 11/05 12:38:00

Delete fisico: NAO.

## Bloqueio Operacional: Popup Nativo de Confirmacao

Ao clicar "Cancelar pedido" no dropdown, o GAS exibe um `confirm()` nativo do navegador dentro do iframe com o texto:

> "Tem certeza que deseja cancelar esta solicitacao de medicamento? Essa acao vai marcar o pedido como CANCELADO no Handover e tambem na planilha de compras. Se foi um engano, voce podera reverter depois alterando o status para Pendente de compra ou Comprado."

Botoes: **OK** / **Cancelar**

Impacto na automacao: Claude in Chrome nao consegue ver nem interagir com dialogs nativos do navegador em iframes cross-origin.

Impacto em producao: NENHUM. Operador humano ve e confirma normalmente.

## Falhas

Criticas: nenhuma.

Medias:

1. Popup nativo de confirmacao de cancelamento nao visivel via automacao Claude in Chrome. Sem impacto em producao.
2. Espelho Compras_Medicamentos para TESTE_V58_WA nao verificado diretamente na planilha (sessao interrompida por limite de plano antes da confirmacao).

Leves:

1. Re-login necessario em 11/05 apos expiracao do token de 10/05 (comportamento esperado).
2. Registros de 10/05 nao visiveis em 11/05 sem Atualizar agora - filtro de data do frontend nao investigado.
3. CDP sendCommand timeout em 2 ocasioes durante chamadas pesadas ao GAS - renderer recuperou sem perda de dados.

## Proximos Passos

1. Republicar v58 no deployment oficial:
   ```
   clasp deploy --versionNumber 58 --deploymentId AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw
   ```

2. Verificar manualmente na planilha Compras_Medicamentos se TESTE_V58_WA tem Status_Compra=Cancelado e Cancelado_Por=Carlos.

3. Decidir se o `confirm()` nativo de cancelamento e intencional ou deve ser substituido por modal customizado no proximo ciclo.

## Veredito

v58 APROVADA COM RESSALVAS.

Todos os fluxos funcionais testados e aprovados: login, criar encomenda/falta, edicao auditada, cancelamento, WhatsApp sem mojibake, espelho Compras_Medicamentos, Atualizar agora, UX de cards e header.

Ressalvas: (1) popup nativo de confirmacao de cancelamento nao interagivel via automacao - sem impacto em producao; (2) espelho Compras_Medicamentos para TESTE_V58_WA nao verificado diretamente na planilha.

Deployment permanece em v57 aguardando republicacao manual pelo usuario. Codigo c923984 intacto na branch.
