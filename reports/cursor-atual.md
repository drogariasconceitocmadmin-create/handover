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

## Skills (criação/atualização nesta rodada)

- Criada: `aios/skills/handover-visual-only-guardrails/SKILL.md`
  - Motivo: evitar repetir o problema de **release visual-only contaminada** por lógica funcional (auto-refresh/polling/sync UI) herdada de commits mistos.

---

## UI — destaque de status Cancelado

- Ajustado `Index.html` para deixar **CANCELADO** muito mais evidente em cards/badges (sem mexer em backend/regras): chip com contraste maior e selo discreto no card quando `statusKey === "cancelado"`.

## Compras_Medicamentos — instruções pós-deploy (Codex / operação)

**Wrappers públicos (sem `_`)** em `Code.gs` para o Carlos e demais operadores encontrarem no seletor do Apps Script Editor: `instalarTriggerComprasMedicamentos`, `listarTriggersHandover`, `removerTriggerComprasMedicamentos`, **`handleComprasMedicamentosEdit`** (evento on edit; delega a `handleComprasMedicamentosEdit_`), e opcional `testarProcessarStatusCompraPorIdHandover`. Os de menu apenas delegam às funções internas `*_()`; a lógica permanece nas versões com underscore.

**OAuth (`appsscript.json`):** foi declarado o escopo `https://www.googleapis.com/auth/script.scriptapp` junto aos existentes para `ScriptApp.getProjectTriggers` / `newTrigger` / `deleteTrigger`. Se mesmo assim o editor continuar com *Specified permissions are not sufficient to call ScriptApp.getProjectTriggers*, **não dependa** dessas funções para o primeiro setup: use o gatilho manual na UI apontando para **`handleComprasMedicamentosEdit`** (abaixo). Após `clasp push`, pode ser necessário **reautorizar** o projeto.

### Layout da aba Compras_Medicamentos (Sheets)

- Melhorado `applyComprasMedicamentosLayout_()` para deixar a aba mais operacional: cabeçalho institucional + congelar linha 1 + filtro, larguras melhores, alinhamento, wrap em `Observacao_Compra` e `Mensagem_Cliente`, formatos de data e moeda, e **cores por linha inteira** via formatação condicional baseada em `Status_Compra`:
  - **Pendente de compra**: âmbar claro (precisa de ação)
  - **Comprado**: verde claro
  - **Não encontrado**: laranja claro
  - **Cancelado**: vermelho claro
- Wrapper público para reaplicar layout sem mexer em dados: **`aplicarLayoutComprasMedicamentos()`** (chama `aplicarLayoutComprasMedicamentos_()` → `applyComprasMedicamentosLayout_()`).
- Confirmado: **não altera** regras de compra, onEdit, triggers, sync ou status; é apenas formatação/validação.

### Instalação manual do gatilho Compras_Medicamentos (recomendado se `getProjectTriggers` falhar)

1. Abrir o **Apps Script Editor** do Handover.
2. Ir ao ícone **Triggers** (relógio) na barra lateral.
3. Clicar em **Add Trigger**.
4. Escolher função: **`handleComprasMedicamentosEdit`**.
5. **Event source:** From spreadsheet.
6. **Event type:** On edit.
7. Salvar e **autorizar** quando o Google pedir.
8. Na planilha, aba **Compras_Medicamentos**, testar edição de **Status_Compra**.

Depois que o Codex publicar a versão com aba **Compras_Medicamentos**:

1. Abrir o **Apps Script** do projeto Handover (mesmo script do Web App).
2. (Opcional) Após **clasp push**, tentar **`instalarTriggerComprasMedicamentos`** / **`listarTriggersHandover`** se as permissões permitirem; caso contrário usar os passos de instalação manual acima.
3. Abrir a planilha:  
   https://docs.google.com/spreadsheets/d/1tHDX3I5yVx2UioNki695UIoNxHjXxpxCuKZwv2l7Dv8/edit  
4. Na aba **Compras_Medicamentos**, editar **Status_Compra** e validar que **Medicamentos** atualiza conforme a regra (e que **Pendente de compra** na planilha não reverte comprado/entregue/cancelado no Handover).
5. No Web App, clicar **Atualizar agora** para ver o painel:  
   https://script.google.com/macros/s/AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw/exec  

**Nota:** Se houver **onEdit** simples do projeto **e** trigger instalável no mesmo handler, uma edição pode disparar duas vezes; a lógica foi mantida idempotente onde possível.
