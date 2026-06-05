// ============================================================================
// Handover v2 — Migração de dados (CSV legado -> Supabase/Postgres)
// ============================================================================
//
// O QUE FAZ
//   Lê os CSVs exportados das abas do sistema legado (Google Sheets) que
//   estiverem na MESMA pasta deste script (handover-v2/migracao/) e insere os
//   dados nas tabelas Postgres correspondentes, de forma IDEMPOTENTE (upsert
//   por coluna `id`). Rodar o script várias vezes não duplica registros.
//
//   Mapeamento aba (CSV) -> tabela:
//     Geral.csv                -> public.pendencias
//     Medicamentos.csv         -> public.medicamentos
//     Compras_Reposicao.csv    -> public.compras_reposicao
//     Checklist_Turnos.csv     -> public.checklist_turnos
//     Arquivo_Resolvidos.csv   -> public.pendencias   (itens já resolvidos)
//     Auditoria_Handover.csv   -> public.auditoria
//
//   Os cabeçalhos dos CSV são os HEADERS PascalCase do legado (ex.: "Pre_Pago",
//   "Ultima_Acao_Em", "Preco_Venda"). Cada coluna é mapeada para a coluna
//   snake_case da tabela e normalizada como o `normalizeItemForClient_` do
//   Code.gs: datas -> ISO/`date`, booleanos -> boolean real, preço -> numeric.
//
//   CSV ausente é simplesmente PULADO (não é erro). Ao final, loga a contagem
//   de linhas processadas por tabela.
//
// PRÉ-REQUISITOS
//   - Node >= 18 (ESM, fetch nativo).
//   - Dependência: @supabase/supabase-js  (npm i @supabase/supabase-js)
//   - As tabelas/colunas já criadas pelas migrations 0001..000N.
//
// VARIÁVEIS DE AMBIENTE (obrigatórias)
//   SUPABASE_URL                URL do projeto (https://<ref>.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY   service_role key (NUNCA commitar / expor)
//   O service_role ignora RLS — necessário porque as tabelas têm RLS ligado
//   sem policies para anon (ver SPEC §1).
//
// USO
//   # PowerShell (Windows):
//   $env:SUPABASE_URL="https://pxswpufbkisdniojwdtt.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"
//   node handover-v2/migracao/import.mjs
//
//   # bash:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node handover-v2/migracao/import.mjs
//
//   Flags opcionais:
//     --dir <caminho>   pasta dos CSVs (default: pasta deste script)
//     --dry-run         apenas lê/normaliza e loga contagens, sem escrever
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { readFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const dirIdx = args.indexOf('--dir');
const CSV_DIR = dirIdx !== -1 && args[dirIdx + 1] ? path.resolve(args[dirIdx + 1]) : __dirname;
const BATCH_SIZE = 500;

// ---------------------------------------------------------------------------
// Normalizadores (espelham normalizeItemForClient_ do Code.gs legado)
// ---------------------------------------------------------------------------

/** Texto: trim; vazio -> null. */
function normText(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

/** Booleano: aceita true/1/sim/yes/x/verdadeiro (case-insensitive). Default false. */
function normBool(v) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  if (s === '') return false;
  return ['true', '1', 'sim', 's', 'yes', 'y', 'x', 'verdadeiro', 'checked', 'feito'].includes(s);
}

/** Booleano que pode ser nulo (não força default). */
function normBoolNullable(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  return normBool(v);
}

/** Preço -> numeric. Aceita "12,50" / "R$ 12.50" / "1.234,56". null se vazio. */
function normPrice(v) {
  if (v === undefined || v === null) return null;
  let s = String(v).trim();
  if (s === '') return null;
  s = s.replace(/[^\d.,-]/g, ''); // remove "R$", espaços, etc.
  if (s === '') return null;
  // Se tem vírgula e ponto, assume ponto = milhar, vírgula = decimal (pt-BR).
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Inteiro. null se vazio/inválido. */
function normInt(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Timestamp -> ISO 8601 (string) para timestamptz.
 * Aceita ISO, "YYYY-MM-DD HH:MM:SS", "DD/MM/YYYY HH:MM:SS", Date serial do Sheets.
 * null se vazio/inválido.
 */
function normTimestamp(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '') return null;

  // Sheets US format: M/D/YYYY [H:MM[:SS]]  (first group = month, second = day)
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (br) {
    const [, mo, d, y, h = '0', mi = '0', se = '0'] = br;
    const dt = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se));
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

/**
 * Date pura -> "YYYY-MM-DD" (coluna `date`). Sem componente de hora/timezone.
 * null se vazio/inválido.
 */
function normDate(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '') return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // Sheets US format: M/D/YYYY (first group = month, second = day)
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) {
    const [, mo, d, y] = br;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

/** UUID: passa direto se válido, senão null (deixa o default gen_random_uuid). */
function normUuid(v) {
  const s = normText(v);
  if (!s) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ? s.toLowerCase() : null;
}

// ---------------------------------------------------------------------------
// Parser CSV mínimo (RFC 4180): aspas, vírgulas e quebras de linha em campos.
// ---------------------------------------------------------------------------
function parseCsv(text) {
  // Remove BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\r') {
      // ignora; \n trata fim de linha
    } else if (c === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  // último campo/linha (se não terminou com \n)
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Converte CSV em array de objetos {Header: value}. */
function csvToObjects(text) {
  const rows = parseCsv(text).filter((r) => !(r.length === 1 && r[0].trim() === ''));
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, idx) => { o[h] = r[idx] !== undefined ? r[idx] : ''; });
    return o;
  });
}

// ---------------------------------------------------------------------------
// Mapeamentos CSV (header PascalCase) -> coluna (snake_case) + normalizador.
// Cada entry: [csvHeader, dbColumn, normalizerFn].
// Cada tabela aponta para a coluna PK (`id` / `id_auditoria`) usada no upsert.
// ---------------------------------------------------------------------------

const TABLES = [
  {
    csv: 'Geral.csv',
    table: 'pendencias',
    conflict: 'id',
    map: [
      ['ID', 'id', normUuid],
      ['Timestamp', 'criado_em', normTimestamp],
      ['Autor', 'autor', normText],
      ['Titulo', 'titulo', normText],
      ['Descricao', 'descricao', normText],
      ['Urgencia', 'urgencia', normText],
      ['Resolvido', 'resolvido', normBool],
      ['Resolvido_Por', 'resolvido_por', normText],
      ['Data_Resolucao', 'data_resolucao', normTimestamp],
      ['Ultima_Acao_Por', 'ultima_acao_por', normText],
      ['Ultima_Acao_Em', 'ultima_acao_em', normTimestamp],
      ['Tem_Vencimento', 'tem_vencimento', normBool],
      ['Data_Vencimento', 'data_vencimento', normDate],
      ['Hora_Vencimento', 'hora_vencimento', normText],
      ['Reaberto_De', 'reaberto_de', normUuid],
      ['Excluido', 'excluido', normBool],
      ['Excluido_Por', 'excluido_por', normText],
      ['Excluido_Por_Perfil', 'excluido_por_perfil', normText],
      ['Data_Exclusao', 'data_exclusao', normTimestamp],
      ['Motivo_Exclusao', 'motivo_exclusao', normText],
    ],
  },
  {
    // Itens já resolvidos da aba histórico — vão para a mesma tabela pendencias.
    csv: 'Arquivo_Resolvidos.csv',
    table: 'pendencias',
    conflict: 'id',
    // força resolvido=true caso o CSV não traga a flag explicitamente.
    defaults: { resolvido: true },
    map: [
      ['ID', 'id', normUuid],
      ['Timestamp', 'criado_em', normTimestamp],
      ['Autor', 'autor', normText],
      ['Titulo', 'titulo', normText],
      ['Descricao', 'descricao', normText],
      ['Urgencia', 'urgencia', normText],
      ['Resolvido', 'resolvido', normBool],
      ['Resolvido_Por', 'resolvido_por', normText],
      ['Data_Resolucao', 'data_resolucao', normTimestamp],
      ['Ultima_Acao_Por', 'ultima_acao_por', normText],
      ['Ultima_Acao_Em', 'ultima_acao_em', normTimestamp],
      ['Tem_Vencimento', 'tem_vencimento', normBool],
      ['Data_Vencimento', 'data_vencimento', normDate],
      ['Hora_Vencimento', 'hora_vencimento', normText],
      ['Reaberto_De', 'reaberto_de', normUuid],
      ['Excluido', 'excluido', normBool],
      ['Excluido_Por', 'excluido_por', normText],
      ['Excluido_Por_Perfil', 'excluido_por_perfil', normText],
      ['Data_Exclusao', 'data_exclusao', normTimestamp],
      ['Motivo_Exclusao', 'motivo_exclusao', normText],
    ],
  },
  {
    csv: 'Medicamentos.csv',
    table: 'medicamentos',
    conflict: 'id',
    map: [
      ['ID', 'id', normUuid],
      ['Timestamp', 'criado_em', normTimestamp],
      ['Tipo', 'tipo', normText],
      ['Medicamento', 'medicamento', normText],
      ['Pre_Pago', 'pre_pago', normBool],
      ['Cliente', 'cliente', normText],
      ['Atendente', 'atendente', normText],
      ['Previsao_Entrega', 'previsao_entrega', normDate],
      ['Comprado', 'comprado', normBool],
      ['Entregue', 'entregue', normBool],
      ['Telefone', 'telefone', normText],
      ['Status', 'status', normText],
      ['Status_Aviso_WhatsApp', 'status_aviso_whatsapp', normText],
      ['Data_Aviso_WhatsApp', 'data_aviso_whatsapp', normTimestamp],
      ['Preco_Venda', 'preco_venda', normPrice],
      ['Ultima_Acao_Por', 'ultima_acao_por', normText],
      ['Ultima_Acao_Em', 'ultima_acao_em', normTimestamp],
      ['Revertido_Por', 'revertido_por', normText],
      ['Data_Reversao', 'data_reversao', normTimestamp],
      ['Status_Anterior', 'status_anterior', normText],
      ['Motivo_Reversao', 'motivo_reversao', normText],
      ['Cancelado_Por', 'cancelado_por', normText],
      ['Data_Cancelamento', 'data_cancelamento', normTimestamp],
      ['Motivo_Cancelamento', 'motivo_cancelamento', normText],
      ['Fornecedor_Compra', 'fornecedor_compra', normText],
      ['Codigo_Compra_Fornecedor', 'codigo_compra_fornecedor', normText],
      ['Forma_Recebimento', 'forma_recebimento', normText],
      ['Observacao_Solicitacao', 'observacao_solicitacao', normText],
      ['Mensagem_Cliente', 'mensagem_cliente', normText],
      ['Observacao_Compra', 'observacao_compra', normText],
      ['Pedido_ID', 'pedido_id', normUuid],
      ['Item_Indice', 'item_indice', normInt],
      ['Total_Itens', 'total_itens', normInt],
      ['Quantidade_Item', 'quantidade_item', normText],
      ['Observacao_Item', 'observacao_item', normText],
    ],
  },
  {
    csv: 'Compras_Reposicao.csv',
    table: 'compras_reposicao',
    conflict: 'id',
    map: [
      ['ID', 'id', normUuid],
      ['Data_Solicitacao', 'data_solicitacao', normTimestamp],
      ['Categoria_Compra', 'categoria_compra', normText],
      ['Item', 'item', normText],
      ['Quantidade', 'quantidade', normText],
      ['Unidade', 'unidade', normText],
      ['Prioridade', 'prioridade', normText],
      ['Motivo', 'motivo', normText],
      ['Solicitante', 'solicitante', normText],
      ['Observacao', 'observacao', normText],
      ['Fornecedor_Sugerido', 'fornecedor_sugerido', normText],
      ['Previsao_Desejada', 'previsao_desejada', normDate],
      ['Status_Compra', 'status_compra', normText],
      ['Status_Handover', 'status_handover', normText],
      ['Comprado', 'comprado', normBool],
      ['Comprado_Por', 'comprado_por', normText],
      ['Data_Compra', 'data_compra', normTimestamp],
      ['Cancelado', 'cancelado', normBool],
      ['Cancelado_Por', 'cancelado_por', normText],
      ['Data_Cancelamento', 'data_cancelamento', normTimestamp],
      ['Motivo_Cancelamento', 'motivo_cancelamento', normText],
      ['Ultima_Acao_Por', 'ultima_acao_por', normText],
      ['Ultima_Acao_Em', 'ultima_acao_em', normTimestamp],
      ['Excluido', 'excluido', normBool],
      ['Excluido_Por', 'excluido_por', normText],
      ['Excluido_Em', 'excluido_em', normTimestamp],
      ['Pedido_ID', 'pedido_id', normUuid],
      ['Item_Indice', 'item_indice', normInt],
      ['Total_Itens', 'total_itens', normInt],
      ['Quantidade_Item', 'quantidade_item', normText],
      ['Observacao_Item', 'observacao_item', normText],
    ],
  },
  {
    csv: 'Checklist_Turnos.csv',
    table: 'checklist_turnos',
    conflict: 'data,turno,item',
    map: [
      ['ID', 'id', normUuid],
      ['Data', 'data', normDate],
      ['Turno', 'turno', normText],
      ['Horario_Referencia', 'horario_referencia', normText],
      ['Categoria', 'categoria', normText],
      ['Item', 'item', normText],
      ['Descricao', 'descricao', normText],
      ['Status', 'status', normText],
      ['Responsavel', 'responsavel', normText],
      ['Data_Hora_Check', 'data_hora_check', normTimestamp],
      ['Observacao', 'observacao', normText],
    ],
  },
  {
    csv: 'Auditoria_Handover.csv',
    table: 'auditoria',
    conflict: 'id_auditoria',
    map: [
      ['ID_Auditoria', 'id_auditoria', normUuid],
      ['Data_Hora', 'data_hora', normTimestamp],
      ['Acao', 'acao', normText],
      ['Origem', 'origem', normText],
      ['ID_Item', 'id_item', normUuid],
      ['Usuario', 'usuario', normText],
      ['Nome', 'nome', normText],
      ['Perfil', 'perfil', normText],
      ['Campo', 'campo', normText],
      ['Valor_Anterior', 'valor_anterior', normText],
      ['Valor_Novo', 'valor_novo', normText],
      ['Resumo', 'resumo', normText],
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function fileExists(p) {
  try { await access(p, FS.R_OK); return true; } catch { return false; }
}

/** Aplica o mapeamento a uma linha; remove a PK quando null (deixa o default). */
function mapRow(obj, spec) {
  const out = { ...(spec.defaults || {}) };
  for (const [header, col, fn] of spec.map) {
    out[col] = fn(obj[header]);
  }
  // Se a PK ficou null, remove para o upsert gerar/preservar via default.
  // (sem PK não dá upsert idempotente, então a linha é incluída como insert puro)
  const pkCol = spec.conflict.split(',')[0].trim();
  if (out[pkCol] === null || out[pkCol] === undefined) delete out[pkCol];
  return out;
}

function chunk(arr, n) {
  const r = [];
  for (let i = 0; i < arr.length; i += n) r.push(arr.slice(i, i + n));
  return r;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('ERRO: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Pasta de CSVs: ${CSV_DIR}`);
  if (DRY_RUN) console.log('*** DRY-RUN: nada será gravado ***');

  const totals = {};
  let hadError = false;

  for (const spec of TABLES) {
    const csvPath = path.join(CSV_DIR, spec.csv);
    if (!(await fileExists(csvPath))) {
      console.log(`- ${spec.csv}: ausente, pulando.`);
      continue;
    }

    const text = await readFile(csvPath, 'utf8');
    const objects = csvToObjects(text);
    if (objects.length === 0) {
      console.log(`- ${spec.csv}: 0 linhas, pulando.`);
      continue;
    }

    let rows = objects.map((o) => mapRow(o, spec));

    // Filtrar linhas sem PK (ID nulo/inválido) — não há como fazer upsert sem PK.
    const pkCol = spec.conflict.split(',')[0].trim();
    const skipped = rows.filter((r) => r[pkCol] === undefined || r[pkCol] === null).length;
    rows = rows.filter((r) => r[pkCol] !== undefined && r[pkCol] !== null);
    if (skipped > 0) console.log(`  (${skipped} linha(s) sem PK ignoradas)`);

    // Desduplicar por chave de conflito dentro do lote (evita "ON CONFLICT...affect row a second time").
    const conflictCols = spec.conflict.split(',').map((c) => c.trim());
    const seen = new Set();
    rows = rows.filter((r) => {
      const key = conflictCols.map((c) => r[c]).join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (DRY_RUN) {
      totals[spec.table] = (totals[spec.table] || 0) + rows.length;
      console.log(`- ${spec.csv} -> ${spec.table}: ${rows.length} linhas (dry-run).`);
      continue;
    }

    let inserted = 0;
    for (const batch of chunk(rows, BATCH_SIZE)) {
      // Idempotente por PK. Linhas com PK presente fazem upsert por `conflict`;
      // linhas sem PK (raro) também são aceitas — o default gera a PK.
      const { data, error } = await supabase
        .from(spec.table)
        .upsert(batch, { onConflict: spec.conflict, ignoreDuplicates: false })
        .select(spec.conflict);

      if (error) {
        hadError = true;
        console.error(`! ${spec.csv} -> ${spec.table}: ERRO no lote: ${error.message}`);
        break;
      }
      inserted += data ? data.length : batch.length;
    }

    totals[spec.table] = (totals[spec.table] || 0) + inserted;
    console.log(`- ${spec.csv} -> ${spec.table}: ${inserted}/${rows.length} upsert(s).`);
  }

  console.log('\n=== Contagens por tabela ===');
  const tables = [...new Set(TABLES.map((t) => t.table))];
  for (const t of tables) {
    console.log(`  ${t}: ${totals[t] || 0}`);
  }

  if (hadError) {
    console.error('\nConcluído COM ERROS. Verifique as mensagens acima.');
    process.exit(1);
  }
  console.log('\nMigração concluída.');
}

main().catch((err) => {
  console.error('Falha inesperada:', err);
  process.exit(1);
});
