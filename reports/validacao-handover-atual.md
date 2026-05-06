# Validacao Handover - Auth PIN login object fix

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch validada/publicada temporariamente: `feat/handover-auth-pin`

Commits validados/publicados temporariamente:
- `95eaf37 - login operacional por PIN e sessao`
- `211d3b6 - perfis e exclusao logica com auditoria`
- `00527e6 - bloqueia dashboard ate sessao validada`
- `239274c - corrige avatar do operador apos login`
- `5b44717 - login retorna objeto e destrava UI do PIN`

Base estavel: v33

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada para teste: 37.

Rollback feito: SIM, deployment oficial voltou para v33.

POP tocado: NAO.

Registros criados: nenhum.

## Usuarios

- Usuarios configurados: SIM, conforme bootstrap manual anterior.
- Carlos/admin esperado: SIM.
- PIN puro na planilha: NAO, validado estaticamente por uso de `Pin_Hash`.

## Pre-deploy

- Branch atual confirmada: `feat/handover-auth-pin`.
- Commits obrigatorios `95eaf37`, `211d3b6`, `00527e6`, `239274c` e `5b44717` presentes.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: nao encontrado.
- `sheet.clear`: ausente.
- PIN com `Pin_Hash`, SHA-256 e salt em ScriptProperties.
- `loginHandover` retorna objeto `{ success: true, token }` no sucesso.
- `loginHandover` retorna `{ success: false, message }` na falha.
- Front usa `res.token`.
- Front limpa/trata `Entrando...` em sucesso, falha, excecao e timeout.
- Dashboard gated presente.

## Publicacao

- `clasp status`: OK.
- `clasp push`: OK.
- `clasp version`: criada versao 37.
- `clasp deploy`: deployment oficial atualizado temporariamente para v37.

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

Login Carlos/admin com o PIN informado retornou erro:

`Usuario ou PIN invalido.`

Evidencia:
- `loginAdmin.loginVisible=true`
- `loginAdmin.appHidden=true`
- `loginAdmin.error=Usuario ou PIN invalido.`
- `loginAdmin.header=""`
- `loginAdmin.logoutVisible=false`

O PIN errado tambem nao destravou a tela, mas ficou em `Entrando...` no tempo observado antes da segunda tentativa.

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

- Login Carlos/admin falha com `Usuario ou PIN invalido` usando o PIN informado do bootstrap.

### Medias

- PIN errado ficou em `Entrando...` no tempo observado antes da tentativa seguinte.

### Leves

- `deleteRow` legado permanece em `moveRowToResolved`; nao faz parte da nova exclusao logica.

## Proxima correcao

Cursor deve investigar divergencia entre PIN informado no Logger e hash validado em `Usuarios_Handover`:
- conferir salt em ScriptProperties;
- conferir se `setupUsuariosHandover` foi executado antes/depois da troca de salt/codigo;
- conferir `Ativo`, `Usuario`, `Perfil` e `Pin_Hash` de Carlos;
- rodar `debugAuthUsuariosHandover_` / `selfTestAuthHandover_` pelo editor, se necessario.

## Veredito

Publicado para teste, reprovado no smoke real e rollback executado para v33. Login deixou de travar em `Entrando...` na tentativa admin, mas Carlos/admin nao autentica com o PIN informado.
