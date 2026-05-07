# Validacao Handover - Auth PIN v41 sessao obrigatoria

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch publicada para teste: `feat/handover-auth-pin-v41`

Commit publicado para teste: `fca559a - feat(handover): session obrigatoria nas APIs criticas, autoria e logos v41`

ScriptId: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Versao publicada para teste: 42.

Rollback feito: SIM, deployment oficial restaurado para versao 41.

POP tocado: NAO.

## Pre-deploy

- Branch atual confirmada: `feat/handover-auth-pin-v41`.
- `HEAD`: `fca559a`.
- `.clasp.json`: scriptId oficial do Handover.
- POP proibido: ausente.
- `sheet.clear()` / `.clear()`: ausente.
- `loginHandover`, `validateSessionHandover`, `logoutHandover`: presentes.
- Front possui bloqueio de dashboard sem sessao.
- Front envia `sessionToken` nas acoes criticas.
- `Compras_Medicamentos`: preservado.
- `cancelMedicationRequest`: preservado.
- `deleteRow` novo: nao validado como novo; `deleteRow` legado permanece no arquivamento.

## Publicacao

- `clasp.cmd status`: OK.
- `clasp.cmd push`: OK.
- `clasp.cmd version`: criada versao 42.
- `clasp.cmd deploy`: deployment oficial atualizado para versao 42.

## Smoke real auth

- Web App abriu.
- Dashboard sem login: OK, nao apareceu.
- Overlay/login: OK, apareceu com `Handover — acesso com PIN`.
- PIN errado: FALHA. Tela ficou em `Entrando...`; nao exibiu erro.
- Login Carlos/admin com PIN informado: FALHA. Permaneceu em `Entrando...`; dashboard nao liberou.
- Header `Carlos · admin`: nao validado por falha de login.

## Rollback

Rollback executado imediatamente apos falha P0:

- Comando: `clasp.cmd deploy -i AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw -V 41 -d "Rollback Handover v41 estavel apos falha auth PIN v42"`
- Resultado: deployment oficial em `@41`.

## Fluxos nao executados

Por falha P0 no login:

- Novo Registro Geral.
- Medicamento Encomenda.
- Marcar comprado.
- Cancelar medicamento.
- Checklist.
- Historico.
- Compras_Medicamentos.
- Sair/logout.

## Falhas

### Criticas

- Login fica preso em `Entrando...` para PIN errado e para Carlos/admin com PIN informado. Impacto: uso bloqueado; v42 nao pode ficar publicada.

### Medias

- Nenhuma.

### Leves

- Nenhuma.

## Veredito

Nao aprovado. v42 falhou no login e foi revertida para v41 estavel. Proxima correcao deve focar em destravar retorno de `loginHandover`/handler do front para sucesso, falha e excecao.
