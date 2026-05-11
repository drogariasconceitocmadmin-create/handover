# Validacao Handover v58 - Tentativa de Release / Rollback Preventivo

Projeto: Handover - Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Commit local: `c923984 - feat(handover): adiciona edicao auditada e ajustes UX v57`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Data tentativa: 2026-05-10

## Resultado

Status geral: ROLLBACK PREVENTIVO

Versao tentada: 58.

Versao ativa apos rollback: 57.

Rollback feito: SIM.

Motivo: Extensao Claude in Chrome indisponivel em duas tentativas consecutivas. Smoke real nao executado. Rollback preventivo obrigatorio conforme regras da release.

POP tocado: NAO.

## Preflight v58

- Branch `hotfix/handover-p0-save-medicamentos`: OK.
- HEAD `c923984`: OK.
- Working tree limpo antes do push: OK.
- `.clasp.json` do Handover oficial: OK.
- POP ausente no diff e no codigo: OK.
- `sheet.clear()` novo: ausente.
- `deleteRow` novo: ausente.
- Arquivos do commit `c923984`: apenas `Code.gs` e `Index.html`.
- `saveData` preservado: OK.
- Login/PIN preservado: OK.
- `Medicamentos`/`Compras_Medicamentos` preservados: OK.
- `Status_Compra` preservado: OK.
- `Auditoria_Handover` aditiva (nao substitui): OK.
- Botao Editar presente no diff: OK.

## Publicacao v58

- `clasp.cmd status`: OK - 3 arquivos rastreados.
- `clasp.cmd push`: OK - `appsscript.json`, `Code.gs`, `Index.html` enviados as 23:09:58.
- Versao criada: 58 - `Handover v58 edicao auditada UX cards`.
- Deployment oficial atualizado para v58: OK.
- Novo deployment nao foi criado: OK.

## Smoke v58

Nao executado.

Motivo: Extensao Claude in Chrome indisponivel. Nenhuma conexao com o browser foi estabelecida em duas tentativas consecutivas. Smoke real impossivel sem browser.

Itens nao testados:

- Login/PIN
- Criar Encomenda TESTE_V58_ENCOMENDA
- Gravacao em Medicamentos
- Espelho em Compras_Medicamentos
- Persistencia apos logout/login
- Popup fecha somente apos sucesso real
- Edicao de medicamento
- Auditoria_Handover (Acao = EDITAR)
- Criar Falta TESTE_V58_FALTA
- Cancelamento de Falta
- Status_Compra = Cancelado
- WhatsApp sem mojibake
- Atualizar agora
- Cards maiores
- Header sem "Nome - Perfil"
- Logo ou fallback

## Rollback

- De: v58
- Para: v57
- Deployment revertido via `clasp deploy --versionNumber 57`: OK.
- Codigo local (branch `hotfix/handover-p0-save-medicamentos`, commit `c923984`) nao foi alterado.
- Nota: apenas o apontamento do deployment foi revertido para v57. A v58 continua disponivel como versao no Apps Script e pode ser republicada sem novo `clasp push` apos smoke manual bem-sucedido.

## Limpeza

Registros criados: nenhum (smoke nao executado).

Registros removidos: nenhum.

Delete fisico: nao.

## Falhas

Criticas: nenhuma.

Medias:

- Smoke v58 nao executado. Extensao Claude in Chrome indisponivel. Rollback preventivo aplicado conforme regras.

Leves: nenhuma.

## Veredito

v58 publicada no GAS (clasp push + versao 58 + deployment atualizado). Smoke bloqueado por indisponibilidade do browser. Rollback preventivo para v57 aplicado conforme regras obrigatorias da release. Codigo c923984 preservado intacto na branch. v58 esta pronta para nova tentativa de smoke assim que o browser estiver disponivel - nao e necessario novo clasp push, apenas republicar o deployment para versao 58.
