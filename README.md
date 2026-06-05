# Handover v2 — Drogarias Conceito

Reconstrução do sistema **"Handover e Checklist"** (legado: Google Apps Script + Sheets) em **Supabase (Postgres) + site estático**. Zero custo, latência reduzida, mesma UX.

**Produção:** https://handover-conceito.pages.dev

---

## Arquitetura

| Camada | Tecnologia |
|---|---|
| Frontend | HTML + Vanilla JS + `supabase-js` via CDN (sem build) |
| Backend | Supabase Postgres (projeto `pxswpufbkisdniojwdtt`, sa-east-1) |
| Auth | PIN bcrypt via pgcrypto + token de sessão UUID |
| Segurança | RLS em todas as tabelas + RPCs `SECURITY DEFINER` |
| Deploy | Cloudflare Pages (`npx wrangler pages deploy web/`) |

---

## Status

| Fase | Descrição | Status |
|---|---|---|
| F1 | Schema + auth + frontend 1:1 com legado | ✅ |
| F2 | Edição inline (`handover_item_editar`) | ✅ |
| F4 | Aba Comprador | ✅ |
| F5 | Polimento: normalização PascalCase, KPIs corretos | ✅ |
| F6 | Deploy Cloudflare Pages | ✅ |
| F7 | Importação dados reais do Sheets | ✅ |
| **Convites** | Sistema de primeiro acesso (novo user se registra via código) | ✅ |

**Smoke test:** 2026-06-05 — 7 testes, 6 pass / 1 skip (inclui convites, medicamentos, pendências, histórico).

---

## Estrutura

```
handover-v2/
├── web/                    # SPA estática (ES modules nativos, sem build)
│   ├── index.html          # entry: <script type="module" src="main.js">
│   ├── main.js             # fiação de eventos + boot (único com efeito no top-level)
│   ├── state.js api.js utils.js norm.js icons.js   # base: estado, db, helpers
│   ├── cards.js detalhes.js auditoria.js forms.js  # UI compartilhada + formulários
│   ├── pendencias.js medicamentos.js compras.js comprador.js historico.js checklist.js  # domínios
│   ├── dashboard.js auth.js # bundle/KPIs/tabs/sidebar + login/logout
│   ├── styles.css
│   └── config.js           # URL + anon key (público)
├── tests/                  # smoke tests dos RPCs (node --test) — npm test
├── migracao/               # Import de dados + specs
│   ├── import.mjs          # Script de importação CSV → Supabase
│   ├── SPEC.md             # Contrato RPCs + schema
│   ├── CHECKLIST_TEMPLATES.md
│   └── *.csv               # CSVs exportados do Sheets legado
├── supabase/migrations/    # Migrations 0001–0014 (aplicadas via Supabase MCP)
├── server.js               # Servidor estático local (porta 8777)
└── MEMORY.md               # Decisões técnicas, gotchas, estado atual
```

---

## Como usar

### Login tradicional
1. Abra https://handover-conceito.pages.dev
2. Digite `usuario` (ex: `isaque`) e `PIN` (ex: `1254`)
3. Clique "Entrar" → dashboard abre

### Primeiro acesso (novo usuário)
1. Na tela de login, clique **"Primeiro acesso?"**
2. Preencha:
   - **Seu nome completo** (ex: João Silva)
   - **PIN** (4-8 dígitos, escolha uma senha)
   - **Confirmar PIN** (repita)
   - **Código de convite** (8-12 caracteres, fornecido por admin)
3. Clique "Registrar"
4. Se válido, **auto-loga** no dashboard (novo usuário, perfil=operador)

**Nota:** Admin (marco) gera códigos de convite via RPC `handover_convite_gerar(token)`. Código válido por 30 dias, uma única vez.

---

## Comandos

```powershell
# Rodar localmente
node server.js                    # → http://localhost:8777

# Deploy produção
npx wrangler pages deploy web/ --project-name handover-conceito

# Smoke tests dos RPCs (login isaque/1254, dados __TESTE__ com teardown)
npm test
# O ciclo de medicamento só roda com service key (p/ hard-delete de teardown):
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"; npm test

# Importar dados do Sheets (precisar setar env vars primeiro)
$env:SUPABASE_URL="https://pxswpufbkisdniojwdtt.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"
node migracao/import.mjs          # import real
node migracao/import.mjs --dry-run # validação sem gravar
```

---

## Sistema legado (NÃO modificar)

- Apps Script: `1U-1UOlud99m4NHPdaSUoL9yz4GNV193NW9mhw2t8aB-ypx9AcvfsbNSd`
- Deploy legado: `/exec` `AKfycbzJ5fxFTSfkDsU5l0s79MNrklpkwI1xVMgG_DIvXnJWlRFLRCGMZYtKZSymyc6fmXuw`
- Planilha: `1tHDX3I5yVx2UioNki695UIoNxHjXxpxCuKZwv2l7Dv8`

Cutover apenas após aprovação explícita do usuário.
