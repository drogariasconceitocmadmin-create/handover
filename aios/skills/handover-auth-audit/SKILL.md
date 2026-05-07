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
- Nesta fase, **não** introduzir regras de permissão novas no fluxo de compras.

### Compatibilidade v41 (não quebrar)
- Não remover/alterar fluxos:
  - `Compras_Medicamentos` (trigger/sync/status)
  - `cancelMedicationRequest`
  - `Status Cancelado` (Handover + Compras)
  - layout da aba Compras

### Publicação
- Não publicar autenticação sem um admin funcional e plano de rollback.

### Frontend (Parte 2+)
- Persistir sessão no cliente com `localStorage` (token + usuario + nome + perfil + displayName); **nunca** persistir PIN.
- Ao carregar: se existir token → `validateSessionHandover`; se inválido → limpar storage e exibir login; se válido → liberar dashboard (`logged_in`).
- `doGet` pode enviar payload inicial vazio para não expor dados antes da sessão; dashboard carrega via `refreshDashboardBundle` após login.
- Operador exibido nas ações deve refletir a sessão (nome/displayName), não entrada livre persistida em storage legado.
- Parte 3: validar `sessionToken` no servidor nas operações críticas (não confiar só no ocultar UI).

