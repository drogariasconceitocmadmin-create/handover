# Cursor - Handover (retomada)

## Onde esta

- Projeto: **Handover - Drogarias Conceito**, Apps Script isolado em `Handover/`.
- Pasta atual: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`.
- Branch atual: `release/handover-v29-visual-clean`.
- Worktree: estava limpo antes desta recuperacao.
- HEAD atual: `7a79169 - fix(handover): remove logica de auto-refresh da v29 visual limpa`.
- Remoto da branch: alinhado com `origin/release/handover-v29-visual-clean`.

## Estado publicado / validado

- Relatorio principal: `reports/validacao-handover-atual.md`.
- Validacao registrada: **v29 visual limpa**, status geral **OK**.
- Commit publicado no relatorio: `6fa9e8b - style(handover): reaplica polimento visual desktop sobre v28 publicada`.
- Commit de relatorio: `6142e32 - reports: validacao Handover v29 visual clean`.
- Commit posterior ja na branch: `7a79169`, alterando somente `Index.html`, para remover a logica de auto-refresh da v29 visual limpa.

## Ponto funcional

- Interface v29 visual limpa aprovada no smoke: header compacto, KPIs, abas Pendencias/Medicamentos/Checklist/Historico, sidebar Checklist/Historico, dropdown Novo Registro e cards compactos.
- Separacao preservada: Pendencias = Geral; Medicamentos = Falta/Encomenda.
- Fluxos preservados no smoke: Novo Registro, Falta/Encomenda, Checklist, Historico, menu tres pontos, Atualizar agora e WhatsApp.
- Mobile minimo validado: viewport 390px sem overflow critico.
- Registros criados no smoke: nenhum.

## Cuidados obrigatorios

- Trabalhar somente dentro de `Handover/`.
- Usar somente `Handover/.clasp.json`.
- Nao editar POP.
- Nao misturar arquivos de Handover e POP no mesmo commit.
- Deploy do Handover somente dentro de `Handover/` e apenas quando solicitado explicitamente.
- Antes de qualquer deploy, conferir o deploymentId correto: o `AGENTS.md` atual informa `AKfycbxD_MjbqUgr3XLZno6DX_M8k3o6vlrhkYtOcBN2Mwfi5hEjhbglOEytFlKSpoRGsOPL`, enquanto o relatorio de validacao v29 registra outro deployment oficial.

## Ultima conversa recuperada

- A ultima versao historica de `reports/cursor-atual.md` veio do commit `7468d4e`, mas descrevia a Fase 1 sobre v25 e estava defasada.
- O estado real atual foi reconstruido a partir de `tasks/current.md`, `reports/validacao-handover-atual.md`, `git log`, `git reflog` e da branch atual.
- Este cursor deixa a conversa posicionada na v29 visual limpa, em `7a79169`.

## Fase atual (em andamento)

**Fase 1.3 — Acabamento premium fino do layout desktop**

- Escopo: **somente visual** (HTML/CSS/markup/ícones) para aproximar dos mockups aprovados.
- Proibido: backend/`Code.gs`, schema, sync/polling/auto-refresh/locks, mudanças funcionais, deploy/clasp.

## Pendência futura (funcional) — NÃO IMPLEMENTAR NESTA RELEASE

“Busca da aba Medicamentos deve pesquisar em todos os dados visíveis/relevantes do card:
- medicamento
- tipo Falta/Encomenda
- cliente
- telefone
- atendente
- previsão
- preço
- pré-pago
- observação
- status
- última ação
- datas
- valores como 50, 50,00 e R$ 50,00.

Regra: se o dado aparece no card de Medicamentos, ele deve ser encontrável pela caixa de busca.”
