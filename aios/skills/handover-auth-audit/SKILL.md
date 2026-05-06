# Skill: Login operacional + auditoria (Handover)

## Quando usar

- Implementar ou revisar **login operacional** (usuário + PIN) no Handover.
- Implementar ou revisar **sessão local** (token) e validação em ações críticas.
- Alterações que envolvem **autoria/auditoria** (`Ultima_Acao_Por`, `Resolvido_Por`, `Responsavel`, reabertura, WhatsApp, etc.).
- Migração/adição de **aba de usuários** (`Usuarios_Handover`) no Google Sheets.

## Objetivo

Garantir autoria real de ações operacionais sem autenticação corporativa complexa:

- PIN **nunca** é armazenado em texto puro.
- Backend **não confia** em “operador” vindo do front; ele deriva o autor a partir de sessão válida.
- Sessão expira (ex.: 6–12h) e ações críticas falham com erro amigável quando expirada.

## Regras de segurança (obrigatórias)

- **Não deployar** / **não `clasp push`** sem autorização explícita.
- **Não tocar POP**: trabalhar somente em `Handover/` e não usar IDs/URLs do Portal de POPs.
- **Sem `git add .`**: adicionar arquivos explicitamente.
- **Sem `sheet.clear()`**; sem apagar dados; sem reordenar colunas existentes.
- **Schema defensivo**: se precisar adicionar cabeçalho/coluna, adicionar **no final**.
- **Sessão no backend**:
  - Token deve ser **aleatório** e armazenado no backend (`CacheService` ou `PropertiesService`) com expiração.
  - Ações críticas devem validar token e retornar erro de sessão inválida/expirada.

## Como evitar PIN em texto puro

- Armazenar apenas `Pin_Hash` na aba `Usuarios_Handover`.
- Hash recomendado:
  - Normalizar `usuario` (`trim` + `lowercase`).
  - `SHA-256(salt + '|' + usuario + '|' + pin)`.
  - Salt deve vir de `ScriptProperties` (gerado 1x se ausente).
- **Nunca**:
  - salvar PIN em células, logs persistentes de planilha, ou UI.
  - retornar PIN pela API do Web App.

## Checklist rápido de validação

- Confirmar base (commit/branch) da v33 aprovada antes de mexer.
- Confirmar que `Usuarios_Handover`:
  - existe (ou é criada),
  - tem cabeçalhos necessários (faltantes só no final),
  - não possui PIN em texto puro.
- Confirmar que todas as ações críticas validam sessão:
  - `saveData`
  - `markAsPurchased`
  - `markAsDelivered`
  - `markAsResolved`
  - `revertMedicationToPending`
  - `reopenHistoricoItem`
  - `updateChecklistItemStatus`
  - `updateChecklistItemObservation`
  - `registerWhatsAppAttempt`

