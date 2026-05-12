# Handover v67 — Aprovada

Projeto: Handover - Drogarias Conceito

Branch: `hotfix/handover-p0-save-medicamentos`

Deployment oficial: `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`

URL oficial: `https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec`

Commit publicado: `b70861f`

Data: 2026-05-12

## Resultado

Status geral: **APROVADA**

Versão ativa: **67** — Handover v67 modal otimista preco opcional checklist rapido

Rollback: **NÃO**

POP tocado: **NÃO**

## Smoke v67

| Item | Resultado | Detalhe |
|------|-----------|---------|
| Login/PIN | OK | — |
| Atualizar agora | OK | Sem TypeError |
| Encomenda sem preço | OK | Preço deixou de ser obrigatório |
| Data obrigatória | OK | Data prevista continua obrigatória |
| Preço BRL | OK | Formatação R$ funcionando no formulário |
| Modal Encomenda | OK | Fecha rapidamente após clique em Salvar |
| Modal Pendência | OK | Fecha rapidamente após clique em Salvar |
| Medicamentos | OK | Grava corretamente |
| Compras_Medicamentos | OK | Espelha corretamente na planilha atual |
| Checklist Manhã | OK | Carrega instantaneamente (cache) |
| Checklist Tarde/Noite | LEVE | Ainda ~25s no primeiro carregamento; aceitável operacionalmente |
| Falhas críticas | NENHUMA | — |
| Falhas médias | NENHUMA | — |

## Observações

- Preço de venda deixou de ser obrigatório em Encomenda.
- Data prevista continua obrigatória para Encomenda.
- Formatação BRL no campo Preço funcionando (blur/focus).
- Modal de Encomenda fecha imediatamente após clique em Salvar (card otimista visível enquanto backend processa).
- Modal de Pendência fecha imediatamente após clique em Salvar.
- Falha do backend reverte/remove card otimista e exibe toast de erro.
- Medicamentos grava corretamente na planilha atual.
- Compras_Medicamentos espelha corretamente — comportamento esperado.
- Atualizar agora sem TypeError (corrigido desde v63).
- Planilha separada de Compras **NÃO foi implementada**; Compras_Medicamentos continua na planilha principal do Handover, conforme planejado.
- Checklist Tarde/Noite ainda lento (~25s) no primeiro carregamento — melhoria visual entregue (placeholder instantâneo), mas RPC do backend ainda demora.

## Próximo Patch Recomendado

Otimizar carregamento do Checklist Tarde/Noite:
- Reduzir round-trip do `generateChecklistForTurno` no backend (~25s).
- Investigar cache server-side ou geração antecipada dos três turnos no bundle.

## Histórico de Versões

| Versão | Status |
|--------|--------|
| v57 | ROLLBACK TARGET (2026-05-11) — base estável |
| v58 | APROVADO COM RESSALVAS (2026-05-11) |
| v59 | REPROVADA (2026-05-11) — P0: constant variable / persistência |
| v60 | criada em ciclo anterior |
| v61 | demo checklist temporária (deployment separado, não oficial) |
| v62 | REPROVADA (2026-05-11) — TypeError persistiu |
| v63 | APROVADA (2026-05-11) — fix const→let em ensureTodayChecklistForTurno_ |
| v64 | APROVADA (2026-05-11) — UX checklist: cache, sync status, botão renomeado |
| v65 | APROVADA (2026-05-11) — modal fecha após sucesso real (v1) |
| v66 | APROVADA (2026-05-12) — popup BRL, separação guarda success/record |
| v67 | **ATIVA** (2026-05-12) — modal otimista, preço opcional, checklist rápido |

## Veredito

v67 **APROVADA** e mantida em produção.
Sem rollback. POP não tocado.
Falha leve documentada: Checklist Tarde/Noite ainda ~25s — aceitável operacionalmente.
