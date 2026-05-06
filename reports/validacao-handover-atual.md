# Validacao Handover - Auth PIN / dashboard gated

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch validada/publicada temporariamente: `feat/handover-auth-pin`

Commits validados/publicados temporariamente:
- `95eaf37 - feat(handover): login operacional por PIN e sessao`
- `211d3b6 - feat(handover): perfis e exclusao logica com auditoria`
- `00527e6 - fix(handover): bloqueia dashboard ate sessao validada`

Base estavel: v33

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada para teste: 35.

Rollback feito: SIM, deployment oficial voltou para v33.

POP tocado: NAO.

Registros criados: nenhum.

## Usuarios

- Usuarios configurados: SIM.
- PINs obtidos via Logger do Apps Script apos execucao manual de `setupUsuariosHandover`.
- Existe admin configurado: SIM (Carlos/Marco).

## Pre-deploy

- Branch atual confirmada: `feat/handover-auth-pin`.
- Commits `95eaf37`, `211d3b6` e `00527e6` presentes.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: nao encontrado.
- `sheet.clear`: ausente.
- PIN com `Pin_Hash`, SHA-256 e salt em ScriptProperties.
- Sessao em `CacheService`.
- Exclusao logica validada estaticamente em `deleteItemHandover`.
- `deleteItemHandover` exige admin/gerente e nao usa `deleteRow`.
- `deleteRow` legado existe apenas em `moveRowToResolved`.

## Publicacao

- `clasp push`: OK.
- `clasp version`: criada versao 35.
- `clasp deploy`: deployment oficial atualizado temporariamente para v35.

## Smoke real

### Resultado parcial antes da falha

- Dashboard bloqueado antes do login: OK.
- Overlay de login aparece: OK.
- Sem token local: OK.

Evidencia:
- `loginVisible=true`
- `appHidden=true`
- `bodyHasDashboardText=false`
- `token=null`

### Falha critica

Login admin nao concluiu.

Erro de console capturado:

`updateOperadorAvatar_ is not defined`

Com isso:
- PIN errado nao retornou conclusivamente mensagem final, ficou em `Entrando...`.
- Login admin ficou em `Entrando...`.
- Header nao recebeu `Carlos · admin`.
- Testes de perfis, exclusao logica e regressao nao puderam prosseguir.

## Rollback

- Deployment oficial restaurado para v33.
- URL oficial preservada.
- v33 estavel mantida para operacao.

## Falhas

### Criticas

- `updateOperadorAvatar_ is not defined` quebra o fluxo de login; admin nao consegue entrar.

### Medias

- Nenhuma.

### Leves

- `deleteRow` legado permanece em `moveRowToResolved`; nao faz parte da nova exclusao logica.

## Proxima correcao

Cursor deve corrigir a chamada/definicao inconsistente de avatar no front:
- `syncOperadorUiFromSession_` chama `updateOperadorAvatar_`;
- verificar se a funcao real foi renomeada/removida ou deveria chamar `syncOperadorAvatar_`.

Depois commitar/pushar e devolver para Codex publicar/testar novamente.

## Veredito

Publicado para teste, reprovado no smoke real e rollback executado para v33. Dashboard gated foi corrigido, mas login admin quebra por funcao JavaScript ausente.
