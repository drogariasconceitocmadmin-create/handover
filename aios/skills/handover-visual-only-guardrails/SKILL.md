---
name: handover-visual-only-guardrails
description: >-
  Checklist prático para manter releases "visual-only" do Handover limpas (Index.html
  sem auto-refresh/polling/sync/locks/JS funcional novo). Use antes de publicar
  versões visuais para evitar contaminar o deploy com comportamento não aprovado.
disable-model-invocation: true
---

# Skill: Handover — Guardrails de release visual-only

## Quando usar

Use **sempre** que a tarefa for **somente visual** (HTML/CSS/markup/ícones) no `Index.html`, especialmente quando:

- houver risco de cherry-pick / checkout de `Index.html` vindo de commits mistos (UI + funcional);
- houver histórico de auto-refresh / polling / sync “melhorado” aparecendo sem intenção;
- o objetivo for “publicar visual” sem levar backend e sem mudança de comportamento.

## Objetivo

Garantir que a branch/release contenha **apenas polimento visual**, mantendo:

- layout, tipografia, espaçamento, sombras, bordas, radius;
- ícones SVG / classes / markup;
- microcopy visual que **não muda regra**.

E removendo/evitando qualquer **mudança funcional**.

## Não permitido em release visual-only (red flags)

Se aparecer qualquer item abaixo, **bloquear** e remover/reverter antes do commit:

- Auto-refresh / polling / timers:
  - `setInterval(`, `setTimeout(` (exceto UX local já existente: focos, animações, debounce curto)
  - `HANDOVER_AUTO_REFRESH*`, `auto refresh`, `poll`, `polling`
- “Atualização automática” no header / pills de status:
  - `Atualização automática`, `Atualizando...`, `Atualizado há`
- Listeners de sync automático:
  - `visibilitychange`, `beforeunload`, `focusin`, `focusout` (quando usados para refresh)
- Locks / sync/concorrência no front:
  - `lock`, `LockService`, `getScriptLock`
- Novas chamadas a backend:
  - novos usos de `google.script.run` / `getScriptRunner_()` fora dos fluxos já existentes
- Mudança em regras operacionais:
  - resolver/reabrir/checklist/WhatsApp/medicamentos/pêndencias (qualquer alteração de payload/validação)

## Verificações obrigatórias (git)

Rodar na pasta `Handover/`:

- `git status --short`
- `git diff --name-only`
- Confirmar **`Code.gs` não mudou** (em release visual-only).
- Se reaplicou `Index.html` de outro commit: comparar com a base publicada:
  - `git diff <base>..HEAD -- Index.html`

## Verificações obrigatórias (texto)

No `Index.html`, procurar por termos (em busca textual):

- `Atualização automática`
- `Atualizando...`
- `HANDOVER_AUTO_REFRESH`
- `setInterval(`
- `visibilitychange`
- `poll`
- `LockService`

Se qualquer um existir e não fizer parte do baseline aprovado, **remover** e documentar em `reports/cursor-atual.md`.

## Resultado esperado

- `Index.html` alterado **somente** em CSS/HTML/markup/ícones.
- **Sem** mudança em `Code.gs`/schema/backend.
- Commit com mensagem `style(handover): ...` (ou `fix(...)` se for remoção de comportamento indevido).

