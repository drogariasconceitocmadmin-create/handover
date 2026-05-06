# Validacao Handover - Auth PIN / perfis / exclusao logica

Projeto: Handover - Drogarias Conceito

Pasta: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`

Branch validada: `feat/handover-auth-pin`

Commits validados:
- `95eaf37 - feat(handover): login operacional por PIN e sessao`
- `211d3b6 - feat(handover): perfis e exclusao logica com auditoria`

Base publicada atual: v33 estavel

Deployment oficial preservado: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial preservada: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

## Resultado

Status geral: FALHA

Publicacao: NAO realizada.

Rollback feito: NAO necessario; deployment oficial nao foi atualizado.

POP tocado: NAO.

## Preflight

- Branch atual confirmada: `feat/handover-auth-pin`.
- Commits `95eaf37` e `211d3b6` presentes.
- `.clasp.json`: scriptId oficial do Handover.
- Alteracoes esperadas encontradas: `Code.gs`, `Index.html`, `aios/skills/handover-auth-audit/SKILL.md`, `reports/cursor-atual.md`.
- POP proibido: nao encontrado.
- `sheet.clear`: ausente.

## Validacao estatica de seguranca

- PIN em texto puro na planilha: nao encontrado.
- `Pin_Hash`: presente.
- Hash: `Utilities.DigestAlgorithm.SHA_256`.
- Salt: `PropertiesService.getScriptProperties()` com chave `HANDOVER_PIN_SALT_V1`.
- Sessao: token gerado com UUID e armazenado em `CacheService` com TTL.
- `loginHandover`: retorna token e dados minimos.
- `validateSessionHandover`: valida token.
- `logoutHandover`: remove sessao do cache.
- Backend deriva operador/autoria da sessao via `resolveOperadorFromSessionOrThrow_`.
- Backend nao confia em perfil vindo do front para exclusao; perfil vem da sessao.
- Usuario inativo bloqueado por `Ativo`.

## Acoes criticas com token

Validadas estaticamente com `sessionToken`:
- `saveData`
- `markAsPurchased`
- `markAsDelivered`
- `markAsResolved`
- `revertMedicationToPending`
- `reopenHistoricoItem`
- `updateChecklistItemStatus`
- `updateChecklistItemObservation`
- `registerWhatsAppAttempt`
- `deleteItemHandover`

## Exclusao logica

- `deleteItemHandover(id, tabOpt, sessionToken, motivoOpt)`: existe.
- Valida sessao.
- Exige perfil `admin` ou `gerente`.
- Operador e perfil sao derivados da sessao.
- Nao usa `deleteRow`.
- Marca `Excluido`, `Excluido_Por`, `Data_Exclusao`, `Motivo_Exclusao`, `Excluido_Por_Perfil`.
- `fetchData` e `refreshDashboardBundle` filtram `Excluido`.
- UI mostra `Excluir item` apenas quando `canCurrentUserDelete_()` permite.
- `Excluir item` aparece abaixo de `Copiar informacoes`.

Observacao: existe `deleteRow` legado em `moveRowToResolved`, usado no arquivamento de resolvidos, nao na nova exclusao logica. Nao foi introduzido por esta branch.

## Usuarios iniciais

`setupUsuariosHandover_()` foi validado estaticamente:
- Usuarios esperados presentes: Ainale, Marco, Carlos, Jelcinei, Priscila, Marcelo.
- Aba `Usuarios_Handover` criada defensivamente.
- Cabecalhos aditivos via `ensureHeadersLegacyAdditive_`.
- PIN temporario vai para `Logger.log`.
- Planilha recebe `Pin_Hash`, nao PIN puro.

Tentativa operacional:
- `clasp push`: executado para disponibilizar a funcao no projeto Apps Script.
- `clasp run setupUsuariosHandover_`: FALHOU antes de executar.
- Erro: `Script function not found. Please make sure script is deployed as API executable.`

Pela regra da task, como nao foi possivel rodar `setupUsuariosHandover_` via Codex/clasp, a publicacao foi bloqueada.

## Publicacao

- `clasp push`: SIM, executado antes da tentativa de setup.
- `clasp deploy`: NAO.
- Nova versao: NAO criada.
- Deployment oficial: preservado na v33 estavel.

## Smoke real

Nao executado, porque nao houve deploy. Publicar sem confirmar usuario admin funcional poderia bloquear o uso da loja.

## Falhas

### Criticas

- Nao foi possivel executar `setupUsuariosHandover_` via `clasp run`; sem usuarios/PINs confirmados, o login poderia bloquear o Web App apos deploy.

### Medias

- Nenhuma.

### Leves

- `deleteRow` legado continua existindo em `moveRowToResolved`; nao faz parte da exclusao logica nova, mas deve permanecer monitorado em futuras auditorias.

## Proxima acao necessaria

Carlos deve abrir o Apps Script Editor do Handover e rodar manualmente:

`setupUsuariosHandover_`

Depois deve coletar os PINs temporarios no Logger, confirmar login admin funcional e devolver para Codex publicar/testar.

## Veredito

Publicacao bloqueada. v33 estavel mantida. Motivo: usuarios iniciais nao puderam ser configurados via Codex/clasp, e publicar agora pode bloquear o uso por falta de login admin confirmado.
