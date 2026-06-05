# Handover v2 — Memory

> Decisões técnicas, gotchas e estado corrente para retomada rápida em qualquer sessão.
> Última atualização: 2026-06-05

---

## Estado atual

| Item | Valor |
|---|---|
| URL produção | https://handover-conceito.pages.dev |
| Deploy | Cloudflare Pages — `npx wrangler pages deploy web/ --project-name handover-conceito` |
| Supabase projeto | `pxswpufbkisdniojwdtt` (sa-east-1) |
| Supabase URL | `https://pxswpufbkisdniojwdtt.supabase.co` |
| Migrations aplicadas | `0001`–`0011` todas no ar |
| Fases frontend | F1–F7 **concluídas** |
| Smoke test | ✅ 2026-06-05 — 17 RPCs, 100% OK |

---

## Dados de produção (pós-importação F7)

| Tabela | Contagem |
|---|---|
| `pendencias` ativas (resolvido=false, excluido=false) | 1 |
| `medicamentos` Pendente | 6 |
| `medicamentos` Comprado | 4 |
| `compras_reposicao` ativas | 38 |
| `checklist_turnos` (hoje, Manhã pendente) | 23 |
| `checklist_turnos` (hoje, Noite pendente) | 10 |
| `auditoria` | 259 |

---

## RPCs principais

| RPC | Parâmetros-chave | Retorno |
|---|---|---|
| `handover_login` | `p_usuario, p_pin` | `{ok, token, usuario, nome, perfil}` |
| `handover_logout` | `p_token` | void |
| `handover_dashboard_bundle` | `p_token, p_turno?` | `{geral[], medicamentos[], comprasReposicao[], checklistTurno, bundleTurno}` |
| `handover_pendencia_criar` | `p_token, p_titulo, p_descricao, p_urgencia, p_tem_vencimento, p_data_vencimento?, p_hora_vencimento?` | `{id, ...}` |
| `handover_pendencia_resolver` | `p_token, p_id, p_resolvido` | void |
| `handover_pendencia_excluir` | `p_token, p_id, p_motivo` | void |
| `handover_medicamento_criar` | `p_token, p_payload jsonb` | `{id, ...}` |
| `handover_medicamento_comprar` | `p_token, p_id` | void |
| `handover_medicamento_entregar` | `p_token, p_id` | void |
| `handover_medicamento_cancelar` | `p_token, p_id, p_motivo?` | void |
| `handover_medicamento_reverter` | `p_token, p_id, p_motivo` | void |
| `handover_medicamento_whatsapp` | `p_token, p_id` | void |
| `handover_compra_reposicao_criar` | `p_token, p_payload jsonb` | `{success, record}` |
| `handover_checklist_gerar` | `p_token, p_turno` | `{checklistTurno: {turno, data, summary, categorias[]}}` |
| `handover_checklist_status` | `p_token, p_id, p_status, p_observacao?` | void |
| `handover_historico` | `p_token, p_limit?` | array de itens resolvidos/arquivados |
| `handover_historico_reabrir` | `p_token, p_id, p_motivo` | void |
| `handover_compras_listar` | `p_token` | array (comprador/gerente/admin) |
| `handover_item_editar` | `p_token, p_id, p_origem, p_campo, p_valor` | void |
| `handover_audit_trail` | `p_token, p_id` | array auditoria do item |

---

## Frontend — contratos críticos

### PascalCase vs. lowercase
- `_pendencia_to_json` retorna **PascalCase**: `ID`, `Titulo`, `Urgencia`, `Resolvido`, `Timestamp`, `Autor`, etc.
- `_medicamento_to_json` retorna **PascalCase**: `ID`, `Medicamento`, `Status`, `Pre_Pago`, `Ultima_Acao_Em`, etc.
- **Normalização aplicada em `carregarBundle()`** (app.js linha ~157): converte `G.bundle.geral[]` de PascalCase → lowercase antes de renderizar. Medicamentos mantêm PascalCase (código usa `m.Status`, `m.ID`, etc. já corretos).

### KPIs
- **PENDÊNCIAS** = `geral.filter(r => !r.resolvido).length`
- **URGENTES** = `geral.filter(r => !r.resolvido && r.urgencia === 'Urgente').length`
- **ENCOMENDAS** = `meds.filter(m => m.Status === 'Pendente').length` (só Pendente, não Comprado)
- **COMPRADOS SEM AVISO** = `meds.filter(m => m.Status === 'Comprado' && m.Status_Aviso_WhatsApp !== 'Tentativa registrada').length`

### Turno automático
```js
var h = parseInt(new Date().toLocaleString('pt-BR', {hour:'numeric', hour12:false, timeZone:'America/Sao_Paulo'}), 10);
return (h >= 7 && h < 14) ? 'Manhã' : 'Noite';
```

---

## Import de dados (F7)

**Script:** `handover-v2/migracao/import.mjs`

**Uso:**
```powershell
$env:SUPABASE_URL="https://pxswpufbkisdniojwdtt.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"
node handover-v2/migracao/import.mjs          # import real
node handover-v2/migracao/import.mjs --dry-run # só valida
```

**Arquivos CSV** em `handover-v2/migracao/`:
- `Geral.csv` → `pendencias`
- `Arquivo_Resolvidos.csv` → `pendencias` (itens resolvidos)
- `Medicamentos.csv` → `medicamentos`
- `Compras_Reposicao.csv` → `compras_reposicao`
- `Checklist_Turnos.csv` → `checklist_turnos` (conflict: `data,turno,item`)
- `Auditoria_Handover.csv` → `auditoria`

**GOTCHA CRÍTICO — Arquivo_Resolvidos contaminação:**
`Arquivo_Resolvidos.csv` mistura `Origem=Geral` e `Origem=Medicamentos`. Linhas com `Origem=Medicamentos` e `Resolvido=FALSE` entram em `pendencias` como ativas. O `defaults: { resolvido: true }` é sobrescrito pelo mapeamento da coluna.
**Solução antes de re-importar:**
```sql
DELETE FROM pendencias WHERE titulo IS NULL AND resolvido = false;
```
(linhas de Medicamentos não têm Titulo; linhas reais de Geral sempre têm.)

**GOTCHA — Datas Google Sheets:**
Sheets exporta em formato US: `M/D/YYYY` (mês primeiro). `normDate` e `normTimestamp` no import.mjs já tratam corretamente com regex `(\d{1,2})\/(\d{1,2})\/(\d{4})` → `[, mo, d, y]`.

---

## Segurança

- RLS em todas as tabelas, sem policies para `anon` → acesso direto retorna 401.
- Todo acesso via RPCs `SECURITY DEFINER` que chamam `handover_check_session(p_token)`.
- `search_path = public, extensions` obrigatório nas funções que usam `gen_salt`/`crypt` (pgcrypto).
- `grant execute` concedido a `anon` só nas RPCs públicas; helpers com prefixo `_` não recebem grant.

---

## Usuários cadastrados

| Usuário | Perfil | PIN |
|---|---|---|
| marco | admin | 3579 |
| carlos | admin | (verificar) |
| jelcinei | gerente | (verificar) |
| ainale | funcionario | (verificar) |
| priscila | funcionario | (verificar) |
| marcelo | funcionario | (verificar) |
| isaque | funcionario | 1254 (teste) |

---

## Erros históricos nos logs (já corrigidos, ignorar)

| Erro | Causa | Status |
|---|---|---|
| `sessoes_usuarios does not exist` | Tabela referenciada em teste antigo | Ignorar |
| `datas 2026-13-05 / 2026-14-05` | Bug M/D/YYYY no import.mjs | ✅ Corrigido |
| `null value in column id` | Import sem filtro de PK nula | ✅ Corrigido |
| `ON CONFLICT row affect twice` | Import sem dedup por chave de conflito | ✅ Corrigido |
| `duplicate key checklist_turnos` | Import antes da constraint composta | ✅ Corrigido |
