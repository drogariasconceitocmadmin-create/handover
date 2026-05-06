# Task atual — Handover

## Título

**Fase 1.3 — Acabamento premium fino do layout desktop**

---

## Status da task

| Campo | Valor |
|--------|--------|
| **Estado** | **Em andamento** |
| **Versão base** | **30** (publicada e aprovada; release visual-only) |
| **Relatórios (referência)** | `reports/validacao-handover-atual.md`, `reports/validacao-handover-atual.json`, `reports/cursor-atual.md` |

---

## Escopo

- Refinamento visual do **header** (mais institucional).
- Refinamento visual dos **KPIs** (hierarquia e presença).
- Cards de **Pendências** mais premium (menos “tabela”).
- Cards de **Medicamentos** mais claros (identidade Falta vs Encomenda, sem mudar regra).
- **Checklist aberto** mais organizado (somente visual, preservando rascunho).
- **Sidebar** mais refinada (checklist/histórico).
- Menu **⋮** refinado e **sem “Imprimir”**.
- Desktop **1366px** sem rolagem horizontal grosseira.

---

## Fora de escopo (Fase 1.3)

- Auditoria / trilha de auditoria completa / histórico premium.
- Sync/polling/auto-refresh/locks.
- Backend / `Code.gs` / schema / migrações.
- Mudança de regra de negócio (Pendências/Medicamentos/Checklist/WhatsApp).
- Busca funcional nova.
- Deploy.

---

## Confirmações de isolamento

- **POP:** não alterar Portal de POPs nem usar clasp/recursos do POP nesta pasta Handover.
- **Deploy:** apenas quando autorizado explicitamente; esta task não inclui deploy nem `clasp push` pela governança atual.
