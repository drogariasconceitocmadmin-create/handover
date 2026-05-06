# Validacao Handover - Auth PIN / perfis / exclusao logica

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch validada/publicada temporariamente: `feat/handover-auth-pin`

Commits validados/publicados temporariamente:
- `95eaf37 - feat(handover): login operacional por PIN e sessao`
- `211d3b6 - feat(handover): perfis e exclusao logica com auditoria`
- `e8e17a6 - fix(handover): expose user bootstrap runner`

Base publicada anterior: v33 estavel

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada para teste: 34.

Rollback feito: SIM, deployment oficial voltou para v33.

POP tocado: NAO.

Registros criados: nenhum.

## Usuarios

- Usuarios configurados: SIM.
- PINs foram obtidos pelo Logger do Apps Script apos execucao manual de `setupUsuariosHandover`.
- PIN puro nao foi gravado na planilha pelo codigo; apenas `Pin_Hash`.

## Pre-deploy

- Branch atual confirmada: `feat/handover-auth-pin`.
- Commits `95eaf37`, `211d3b6` e wrapper `e8e17a6` presentes.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: nao encontrado.
- `sheet.clear`: ausente.
- Exclusao logica validada estaticamente em `deleteItemHandover`.

## Publicacao

- `clasp push`: OK.
- `clasp version`: criada versao 34.
- `clasp deploy`: deployment oficial atualizado temporariamente para v34.

## Smoke real

### Falha critica encontrada

Sem sessao/token no navegador, o Web App abriu o dashboard diretamente e a tela de login ficou oculta:

- `auth-login-overlay`: `modal-overlay hidden`
- `handover_session_token_v1`: `null`
- header usuario vazio
- botao Sair oculto
- dashboard renderizado

Isso falha o requisito P0:

- Tela de login deve aparecer antes do uso.
- Login operacional por PIN deve controlar a entrada.

Como a tela de login nao apareceu, os testes de login/perfis/exclusao nao foram prosseguidos. Publicar assim deixaria o Handover acessivel sem login inicial, mesmo que acoes criticas chamem autenticacao depois.

## Rollback

- Comando executado: deployment oficial atualizado de volta para v33.
- URL oficial preservada.
- v33 estavel mantida para uso operacional.

## Falhas

### Criticas

- Login inicial nao aparece sem sessao. Dashboard fica acessivel sem token.

### Medias

- Nenhuma.

### Leves

- `deleteRow` legado permanece em `moveRowToResolved`; nao faz parte da nova exclusao logica.

## Veredito

Publicado para teste, reprovado no smoke real e rollback executado para v33. Proxima correcao para Cursor: forcar tela de login quando nao houver sessao valida antes de renderizar/liberar dashboard.
