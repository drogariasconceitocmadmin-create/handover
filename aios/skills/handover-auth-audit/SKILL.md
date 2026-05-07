## Skill — Handover Auth/PIN (auditoria e guardrails)

### Objetivo
- Implementar autenticação por **usuário + PIN** no Handover sem quebrar a base **v41** (inclui `Compras_Medicamentos`).

### Regras de segurança
- **Nunca** salvar PIN em texto puro.
- `Pin_Hash` deve ser **SHA-256** de `(salt|usuario|pin)` e armazenado como Base64 WebSafe.
- `salt` deve ficar em **ScriptProperties** (chave `HANDOVER_PIN_SALT_V1`).
- **Não recriar salt** se já existir qualquer `Pin_Hash` na aba `Usuarios_Handover` (para não invalidar hashes).
- Funções manuais podem logar **PIN temporário somente no Logger** (nunca UI/planilha).
- Não expor hash completo; no máximo prefixo curto no Logger.

### Sessão
- Sessão deve ser criada com token aleatório e armazenada com TTL (CacheService ~6h).
- `validateSessionHandover` deve retornar apenas dados mínimos: usuario/nome/perfil.
- `logoutHandover` deve invalidar o token.

### Perfis
- Perfis aceitos: `admin`, `gerente`, `operador`.
- Backend expõe `isAdminOrGerenteHandover_(sess)` para futuras regras (ex.: exclusão lógica); **não** usar nome/perfil enviados pelo cliente como autoridade.
- Fluxo **Compras_Medicamentos** na planilha permanece sem checagem de perfil do Web App.

### Compatibilidade v41 (não quebrar)
- Não remover/alterar fluxos:
  - `Compras_Medicamentos` (trigger/sync/status)
  - `cancelMedicationRequest`
  - `Status Cancelado` (Handover + Compras)
  - layout da aba Compras

### Publicação
- Não publicar autenticação sem um admin funcional e plano de rollback.

### Backend — operações críticas (Parte 3)
- Usar `requireSessionHandover_(sessionToken)` no início de cada função exposta ao Web App que altera ou lê dados operacionais.
- Derivar **autoria** com `getSessionDisplayName_(sess)` (nunca usar `operador` ou `autor` vindos do `google.script.run` para gravar auditoria).
- Funções que **devem** receber `sessionToken` (além de `loginHandover` / `validateSessionHandover` / `logoutHandover`):  
  `saveData`, `refreshDashboardBundle`, `generateChecklistForTurno`, `fetchHistoricoResolvidos`, `markAsPurchased`, `markAsDelivered`, `revertMedicationToPending`, `cancelMedicationRequest`, `markAsResolved`, `reopenHistoricoItem`, `updateChecklistItemStatus`, `updateChecklistItemObservation`, `registerWhatsAppAttempt`.
- **Não** exigir sessão em: `handleComprasMedicamentosEdit` / `processarStatusCompraPorIdHandover_` / `onEdit` na aba Compras (fluxo planilha e e-mail do usuário da sessão Google da edição).
- `populateTestData` deve usar `appendHandoverRecord_` (interno), não `saveData` público sem token.

### Frontend (Parte 2+)
- Persistir sessão no cliente com `localStorage` (token + usuario + nome + perfil + displayName); **nunca** persistir PIN.
- Ao carregar: se existir token → `validateSessionHandover`; se inválido → limpar storage e exibir login; se válido → liberar dashboard (`logged_in`).
- `doGet` pode enviar payload inicial vazio para não expor dados antes da sessão; dashboard carrega via `refreshDashboardBundle` após login.
- Operador exibido nas ações deve refletir a sessão (nome/displayName), não entrada livre persistida em storage legado.
- Operações críticas devem receber `getCurrentSessionToken_()` / `ensureSessionTokenForAction_()` e falhar com toast “Sessão expirada” se não houver token válido.
- Parte 4 (opcional): exclusão lógica + UI por perfil; validação dupla no servidor para operações restritas.
