# Current — Estado Atual do Handover-v2

## Projeto: Handover-v2

**Descrição:** Migração do legacy Handover (Apps Script) para Supabase + SPA estática.

**Stack:**
- Frontend: HTML + JavaScript + Supabase JS (CDN, sem build)
- Backend: Supabase Postgres + RLS + SECURITY DEFINER functions (RPCs)
- Deployment: Cloudflare Pages (`https://handover-conceito.pages.dev`)
- Local: `node server.js` @ localhost:8777

---

## Estado Atual (2026-06-09)

### ✅ Fases Completas

**Fase 0–2:** MVP + Funcionalidades Core
- ✅ Login PIN (bcrypt via pgcrypto)
- ✅ Dashboard com 5 KPIs
- ✅ Pendências CRUD + WhatsApp integration
- ✅ Medicamentos CRUD + WhatsApp
- ✅ Checklist (Manhã/Noite, auto-detect)
- ✅ Histórico + reabertura

**Fase 3:** Painel Compartilhado (Tarefas Acompanhadas)
- ✅ 0020 migration: 4 tabelas + notificações
- ✅ 7 RPCs públicas de orquestração
- ✅ Smoke test 10/10 ✅
- ✅ Anon test 5/5 ✅

**Fase 4–5:** Fiscal (Outbox)
- 🟡 0014_fiscal.sql (schema) — planejada, não aplicada
- 🟡 0015_fiscal_outbox.sql (incremental) — planejada, não aplicada
- ⚠️ BUG em 0014: coluna `modelo` sem default coexiste com `modelo_fiscal` — requer 0016_fiscal_fix.sql antes de aplicar

### 🔄 Em Andamento

- web-redesign/ — 2 arquivos modificados (app-shell.css, handover-forms.jsx)
- Fase 3.2 em desenvolvimento (botão ＋ Painel)

### ⏭️ Próximo

1. Validar/corrigir Fase 3.2 (botão ＋ Painel)
2. Decidir se aplica migrações fiscais (0014–0016)
3. Testes de integração com Conceito Indica (se necessário)

---

## Dados & Banco

**Supabase Project:**
- ID: `pxswpufbkisdniojwdtt` (sa-east-1)
- Org: `dmrorrpkcfptbpkskxky`
- **NOT conceito-indica** — projeto separado

**RLS & Segurança:**
- ✅ RLS habilitado em 20 tabelas
- ✅ `FORCE ROW LEVEL SECURITY` ativo
- ✅ Anon key só acessa via RPCs públicas
- ✅ Helpers `_*` bloqueados para anon

**Dados Live:**
- Importados via `handover-v2/migracao/import.mjs`
- 1 pendência ativa, 6 encomendas pendentes, 4 compradas
- 38 compras ativas, 803 checklist entries, 259 auditoria
- ⚠️ Gotcha: Arquivo_Resolvidos.csv com `Resolvido=FALSE` pode contaminar — DELETE antes de re-import

---

## Restrições Operacionais

### ❌ NÃO FAZER

- ❌ Tocar código sem autorização (web/, backend/)
- ❌ Rodar deploy sem aprovação (Cloudflare Pages)
- ❌ Rodar migrations/seeds (exige autorização explícita)
- ❌ Alterar Apps Script legado (fallback ativo)
- ❌ Modificar `.env` ou secrets
- ❌ Usar `git add .`
- ❌ Misturar checkpoints do Handover com Conceito Indica Issue #14

### ✅ FAZER

- ✅ Ler código para diagnóstico
- ✅ Criar branches para PRs
- ✅ Documentação em `/ai`
- ✅ Checkpoints em Issue própria do Handover
- ✅ Reportar bloqueadores

---

## Isol

amento Multitenant

**Este é projeto SINGLE-TENANT:**
- Não mistura com Conceito Indica (multi-tenant)
- Não compartilha banco Supabase
- Não compartilha usuários/auth

Se precisar sincronizar com Conceito Indica → criar Issue de integração no Handover com flagging para Conceito.

---

**Última atualização:** 2026-06-09
**Criado:** 2026-06-09 (MVP /ai)
