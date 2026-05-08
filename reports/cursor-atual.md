## Hotfix v46 — smoke (cancel, atualizar, planilha, nome cliente) (maio/2026)

- **Branch:** `feat/handover-auth-pin-v41-recebimento`
- **Cancelamento (UI):** `window.confirm` com texto explicando impacto no Handover e em **Compras_Medicamentos** e possibilidade de reverter via planilha (**Pendente de compra** / **Comprado**).
- **Atualizar agora:** botão passa a **Atualizando...**, desabilita durante `refreshDashboardBundle` e restaura label/estado no sucesso ou erro (sem auto-refresh).
- **Planilha → Medicamentos:** removido bloqueio `ja_cancelado` em `processarStatusCompraPorIdHandover_`; **Pendente de compra** na planilha agora zera **Comprado/Entregue**, define **Status** Pendente e sincroniza; `syncMedicationStatus_` só preserva **Cancelado** quando comprado/entregue continuam falsos (permite sair de Cancelado quando a planilha marca **Comprado**).
- **Mensagens ao cliente:** `formatNomeClienteMensagem_` (pt-BR, partículas *de/da/do/das/dos* no meio em minúsculas) em **WhatsApp** (`buildWhatsAppMessage_`, legado) e saudação em **Não encontrado** (`buildMensagemClienteNaoEncontrado_`); removida duplicata antiga de `buildWhatsAppMessage_` com mojibake.

---

## Hotfix P0 — `chunks is not defined` (maio/2026)

- **Branch:** `feat/handover-auth-pin-v41-recebimento`
- **Causa:** em `renderQueue()`, havia `chunks.push(...)` (e `row` inexistente nesse escopo) antes de qualquer `var chunks`; isso quebrava a lista de Medicamentos no Web App.
- **Correção:** remover o bloco errado de `renderQueue()`; exibir **Recebimento** (`metaFormaRecebimento`) apenas em `buildQueueMetaRowsHtml_()`, após `var chunks = []`, no ramo encomenda.
- **Git:** commit `2ec5fe1` na branch `feat/handover-auth-pin-v41-recebimento`.
- **Apps Script:** versão **46** publicada no deployment `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw` (URL `/exec` oficial). Smoke operacional (login, nova encomenda, planilha, WhatsApp visual, menu ⋯) deve ser revalidado na loja.

---

## Parte 4 — Login rápido + PIN sem travar + gestão Usuarios_Handover (maio/2026)

- **Branch:** `feat/handover-auth-pin-v41`
- **Objetivo:** overlay de login aparece logo (sem `setupSpreadsheet` no `doGet` nem setup pesado antes da sessão); após login válido o dashboard carrega via `refreshDashboardBundle(sessionToken)`. Botão **Entrar** não fica preso em **Entrando…** (timeout ~13s, RPC monótono por sequência, loading limpo em sucesso/falha/erro/timeout).
- **Contrato `loginHandover`:** sucesso `{ success: true, token, usuario, nome, perfil, displayName }`; falha comum `{ success: false, message }` (sem throw por credencial inválida).

### Manual curto — criar / alterar usuário pela planilha

**Campos que você pode editar à mão na aba `Usuarios_Handover`:** `Nome`, `Usuario`, `Perfil`, `Ativo`.

**Coluna temporária (staging — não deixe valor lá após aplicar):** `PIN_Novo_Temporario` — use apenas para informar um PIN personalizado **antes** de rodar **`aplicarPinsTemporariosHandover()`** no editor; após sucesso o script **limpa** a célula e persiste só **`Pin_Hash`**.

**Não edite à mão (deixe o script gerenciar):** `Pin_Hash`, `Criado_Em`, `Criado_Por`, `Ultimo_Login_Em`.

**Para criar usuário**

1. Abrir a aba **`Usuarios_Handover`**.
2. Adicionar uma linha com **Nome**, **Usuario**, **Perfil** (`admin`, `gerente` ou `operador`), **Ativo** = `TRUE` / `Sim` / `1`.
3. No editor Apps Script do Handover, executar **`resetPinUsuarioHandover('usuario')`** (ou wrapper tipo **`resetPinCarlosHandover()`** / **`resetPinMarcoHandover()`**).
4. Copiar o **PIN temporário** apenas do **Logger** (Registros). **Nunca** digitar PIN na planilha.
5. O usuário entra no Handover; depois pode-se gerar novo PIN com o mesmo reset se necessário.

**Para alterar perfil**

- Editar a coluna **Perfil** na planilha (`admin`, `gerente`, `operador`).

**Para desativar**

- Coluna **Ativo** = `FALSE` / `Não` / `0`.

**Para resetar PIN**

- Executar **`resetPinUsuarioHandover(usuario)`** ou um wrapper específico (`resetPinCarlosHandover`, `resetPinMarcoHandover`, `resetPinJelcineiHandover`). O PIN novo aparece só no Logger; a planilha guarda apenas **Pin_Hash** (hash), nunca PIN em texto puro permanente.

**Para definir PIN personalizado (4 a 8 dígitos numéricos)**

1. Abrir **`Usuarios_Handover`**.
2. Na linha do usuário **ativo**, preencher **`PIN_Novo_Temporario`** com o PIN desejado (somente números; sem manter na planilha depois do script).
3. No editor Apps Script do Handover, executar **`aplicarPinsTemporariosHandover()`**.
4. Conferir na planilha que **`PIN_Novo_Temporario`** ficou **vazio** e que houve log **`pin aplicado usuario=...`** no Logger.
5. O usuário passa a entrar com esse PIN. **`Ultimo_Login_Em`** não é alterado por esta função (não é login).

Se o valor for inválido ou o usuário estiver **inativo**, **`Pin_Hash`** não é alterado e **`PIN_Novo_Temporario`** permanece para correção (exceto em sucesso, quando a célula é limpa).

**Alternativa emergencial:** **`resetPinUsuarioHandover`** / wrappers continuam gerando PIN aleatório (somente no Logger).

**Cuidados**

- **Nunca** apagar **Pin_Hash** manualmente sem saber o impacto (usuário fica sem login até novo reset).
- Diagnóstico seguro (sem PIN): **`debugLoginCarlosHandover()`**. Smoke interno: **`selfTestAuthHandover()`**, **`debugAuthUsuariosHandover()`**.

---

## Parte 3 — Backend endurecido + token nas APIs críticas (maio/2026)

- **Branch:** `feat/handover-auth-pin-v41`
- **Helpers:** `requireSessionHandover_(sessionToken)`, `getSessionDisplayName_(sess)`, `getSessionPerfil_(sess)`, `isAdminOrGerenteHandover_(sess)` — autoria/nome/perfil **sempre** da sessão validada no servidor; não confiar em strings vindas do cliente para auditoria.
- **APIs que exigem `sessionToken`:** `saveData`, `refreshDashboardBundle`, `generateChecklistForTurno`, `fetchHistoricoResolvidos`, `markAsPurchased`, `markAsDelivered`, `revertMedicationToPending`, `cancelMedicationRequest`, `markAsResolved`, `reopenHistoricoItem`, `updateChecklistItemStatus`, `updateChecklistItemObservation`, `registerWhatsAppAttempt`.
- **Autoria:** `saveData` grava **Autor** e **Ultima_Acao_Por** com nome da sessão; medicamentos mantêm **Atendente** do formulário; checklist usa sessão em **Responsavel**; reabertura de histórico: novo **Autor** na pendência = sessão; **Comprado_Por** em **Compras_Medicamentos** preenchido quando o Handover marca comprado e ainda não havia comprador na linha (espelho).
- **Interno sem sessão:** `appendHandoverRecord_(tab, data, authorLabel)` para `populateTestData` manual; `generateChecklistForTurno_` para `generateTodayMorningChecklist` manual — não são expostos ao Web App como substitutos de login.
- **Compras_Medicamentos:** `handleComprasMedicamentosEdit` / `processarStatusCompraPorIdHandover_` / `onEdit` continuam **sem** token (fluxo planilha/gatilho); `cancelMedicationRequest` via Web App exige sessão.
- **Wrappers públicos (editor):** `resetPinCarlosHandover()`, `debugAuthUsuariosHandover()`, `selfTestAuthHandover()` (delegam às versões `_*`).
- **Front:** `getCurrentSessionToken_()`, `ensureSessionTokenForAction_()`; logos oficiais: `HANDOVER_LOGO_HEADER_URL` (horizontal) e `HANDOVER_LOGO_LOGIN_URL` (símbolo + tarja azul no cartão de login).
- **Parte 4 (adiado):** exclusão lógica com colunas `Excluido_*`, menu restrito admin/gerente e filtros em fetch — não implementado nesta entrega para reduzir risco na v41.

---

## Parte 2 — Front login/PIN + sessão (maio/2026)

- **Branch:** `feat/handover-auth-pin-v41`
- **Escopo:** overlay de login (usuário + PIN), estados `checking` / `logged_out` / `logged_in`, `localStorage` (`handover_auth_session_v41`), validação via `validateSessionHandover`, logout via `logoutHandover`, header **Nome · perfil**, operador derivado da sessão (readonly), botão **Sair**. ESC não fecha o overlay sem sessão válida.
- **Backend mínimo:** `doGet` passa `initialDataB64` vazio (`geral`/`medicamentos` vazios, `checklistTurno` null) para não entregar dados na carga HTML antes do login; dados vêm de `refreshDashboardBundle` após `logged_in`.
- **Logos (atualizado na Parte 3):** URLs Drive fixas em `Index.html` (`HANDOVER_LOGO_HEADER_URL`, `HANDOVER_LOGO_LOGIN_URL`); fallback textual se `onerror` na imagem.

---

# Cursor - Handover (retomada)

## Onde esta

- Projeto: **Handover - Drogarias Conceito**, Apps Script isolado em `Handover/`.
- Pasta atual: `C:\Users\Marco\Desktop\Sis Drogaria\Handover`.
- Branch atual: `feat/handover-auth-pin-v41` (Parte 3 — sessão nas APIs críticas).
- Worktree / HEAD: ver `git log -1` na máquina local após o commit da Parte 3.

### Teste manual sugerido (Parte 3)

1. Login com usuário válido; confirmar que **Atualizar agora**, checklist, histórico e ações na fila funcionam.
2. Em outra aba, **Sair** ou invalidar token no servidor; nova ação deve falhar com mensagem de sessão ou pedir login.
3. Na planilha, editar **Compras_Medicamentos** / `Status_Compra` e confirmar que o gatilho ainda atualiza **Medicamentos** sem Web App.
4. Cancelar pedido pelo Handover (menu) — deve gravar **Cancelado_Por** com nome da sessão.

### PIN Carlos (reset manual)

- No editor Apps Script do Handover, executar **`resetPinCarlosHandover()`** (wrapper público). O PIN temporário aparece só no **Logger** (Visualização → Registros).

---

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
- Criada: `aios/skills/handover-auth-audit/SKILL.md`
  - Motivo: registrar guardrails de **login/PIN/sessão/perfis** e preservar a base v41 com `Compras_Medicamentos`.

---

## Auth/PIN — nova branch v41 (Parte 1)

- **Branch base:** `feat/handover-compras-medicamentos` (v41 preservada como base, commit base `dffb167`)
- **Nova branch:** `feat/handover-auth-pin-v41`
- **Objetivo desta Parte 1:** portar **somente backend** de usuários/PIN/sessão (sem alterar `Index.html` ainda) e **sem quebrar** Compras_Medicamentos.
- **Referência:** branch antiga `feat/handover-auth-pin` usada apenas para copiar trechos com revisão (sem sobrescrever arquivos inteiros).

## UI — destaque de status Cancelado

- Ajustado `Index.html` para deixar **CANCELADO** muito mais evidente em cards/badges (sem mexer em backend/regras): chip com contraste maior e selo discreto no card quando `statusKey === "cancelado"`.

## Cancelamento de Medicamentos pelo Handover (→ Compras_Medicamentos)

- Qualquer operador pode cancelar um item na aba **Medicamentos** pelo menu **⋯ → Cancelar pedido**.
- Backend: `cancelMedicationRequest(id, operador, motivo)` atualiza a linha em **Medicamentos** por **ID**, registra `Cancelado_Por`, `Data_Cancelamento`, `Motivo_Cancelamento`, zera `Comprado/Entregue` e espelha para **Compras_Medicamentos** por **ID_Handover** preservando `Observacao_Compra` e `Mensagem_Cliente`.
- Front: quando status é **Cancelado**, o card exibe **Cancelado: NOME · data/hora · motivo (se houver)** e mantém o destaque visual (badge/stripe/selo).

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
