# Validacao Handover - Auth PIN login fix

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch validada/publicada temporariamente: `feat/handover-auth-pin`

Commits validados/publicados temporariamente:
- `95eaf37 - login operacional por PIN e sessao`
- `211d3b6 - perfis e exclusao logica com auditoria`
- `00527e6 - bloqueia dashboard ate sessao validada`
- `239274c - corrige avatar do operador apos login`

Base estavel: v33

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada para teste: 36.

Rollback feito: SIM, deployment oficial voltou para v33.

POP tocado: NAO.

Registros criados: nenhum.

## Usuarios

- Usuarios configurados: SIM, conforme bootstrap manual anterior.
- Carlos/admin esperado: SIM.
- PIN puro na planilha: NAO, validado estaticamente por uso de `Pin_Hash`.

## Pre-deploy

- Branch atual confirmada: `feat/handover-auth-pin`.
- Commits `95eaf37`, `211d3b6`, `00527e6` e `239274c` presentes.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: nao encontrado.
- `sheet.clear`: ausente.
- `updateOperadorAvatar_`: ausente.
- `syncOperadorUiFromSession_` chama `syncOperadorAvatar_`.
- PIN com `Pin_Hash`, SHA-256 e salt em ScriptProperties.
- Sessao em `CacheService`.
- Exclusao logica validada estaticamente em `deleteItemHandover`.
- `deleteItemHandover` exige admin/gerente e nao usa `deleteRow`.
- `deleteRow` legado existe apenas em `moveRowToResolved`.

## Publicacao

- `clasp status`: OK.
- `clasp push`: OK.
- `clasp version`: criada versao 36.
- `clasp deploy`: deployment oficial atualizado temporariamente para v36.

## Smoke real

### Resultado antes da falha

- Dashboard oculto antes do login: OK.
- Overlay de login visivel: OK.
- Sem token local: OK.

Evidencia:
- `loginVisible=true`
- `appHidden=true`
- `bodyHasDashboardText=false`
- `token=null`

### Falha critica

Login Carlos/admin nao concluiu. A tela permaneceu no overlay com status `Entrando...`:

- `loginAdmin.loginVisible=true`
- `loginAdmin.appHidden=true`
- `loginAdmin.error=Entrando...`
- `loginAdmin.header=""`
- `loginAdmin.logoutVisible=false`

Nenhum erro de console foi capturado durante esta tentativa.

Por regra, foi feito rollback imediato para v33.

## Testes nao executados por bloqueio

- Login operador.
- Perfis admin/gerente/operador.
- Excluir item.
- Exclusao logica via Web App.
- Regressao de Geral/Medicamentos/Checklist/Historico.

## Rollback

- Deployment oficial restaurado para v33.
- URL oficial preservada.
- v33 estavel mantida para operacao.

## Falhas

### Criticas

- Login Carlos/admin nao conclui apos PIN correto; fluxo fica em `Entrando...`.

### Medias

- Nenhuma.

### Leves

- `deleteRow` legado permanece em `moveRowToResolved`; nao faz parte da nova exclusao logica.

## Proxima correcao

Cursor deve investigar por que `loginHandover('carlos', PIN)` nao retorna ao front no Web App publicado. Pontos provaveis:
- falha backend silenciosa na chamada `loginHandover`;
- handler do `google.script.run` nao recebendo success/failure;
- erro Apps Script em `loginHandover`, `validateUsuarioLogin_`, hash/salt ou acesso a `Usuarios_Handover`.

## Veredito

Publicado para teste, reprovado no smoke real e rollback executado para v33. O dashboard gated continua OK, mas login admin nao conclui.
