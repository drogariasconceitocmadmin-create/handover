// ============================================================================
// Migração 1:1 — Planilha A (canônica) -> Supabase, via RPC temporário _mig_bulk
// Lê os CSVs em _live/ (export das abas), normaliza, faz split do Arquivo por
// Origem, dedup, e envia em lotes para o RPC (anon key). Não usa service_role.
// ============================================================================
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIVE = path.join(__dirname, '_live');

const SUPABASE_URL = 'https://pxswpufbkisdniojwdtt.supabase.co';
const ANON = process.env.HO_ANON;            // anon key (de config.js)
const TOKEN = 'MIG20260608HANDOVER';
const DRY = process.argv.includes('--dry-run');
const BATCH = 400;

if (!ANON) { console.error('Defina HO_ANON (anon key).'); process.exit(1); }

// ---------- normalizadores ----------
const normText = (v) => { if (v==null) return null; const s=String(v).trim(); return s===''?null:s; };
const TRUE = ['true','1','sim','s','yes','y','x','verdadeiro','checked','feito'];
const normBool = (v) => { if (v==null) return false; const s=String(v).trim().toLowerCase(); return s===''?false:TRUE.includes(s); };
function normPrice(v){ if(v==null) return null; let s=String(v).trim(); if(!s) return null; s=s.replace(/[^\d.,-]/g,''); if(!s) return null; if(s.includes(',')&&s.includes('.')) s=s.replace(/\./g,'').replace(',','.'); else if(s.includes(',')) s=s.replace(',','.'); const n=Number(s); return Number.isFinite(n)?n:null; }
const normInt = (v) => { if(v==null||String(v).trim()==='') return null; const n=parseInt(String(v).trim(),10); return Number.isFinite(n)?n:null; };
function normTs(v){ if(v==null) return null; const s=String(v).trim(); if(!s) return null; const br=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/); if(br){const[,mo,d,y,h='0',mi='0',se='0']=br; const dt=new Date(Date.UTC(+y,+mo-1,+d,+h,+mi,+se)); return isNaN(dt)?null:dt.toISOString();} const dt=new Date(s); return isNaN(dt)?null:dt.toISOString(); }
function normDate(v){ if(v==null) return null; const s=String(v).trim(); if(!s) return null; const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(iso) return `${iso[1]}-${iso[2]}-${iso[3]}`; const br=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if(br){const[,mo,d,y]=br; return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;} const dt=new Date(s); return isNaN(dt)?null:dt.toISOString().slice(0,10); }
const RE_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const normUuid = (v) => { const s=normText(v); return s&&RE_UUID.test(s)?s.toLowerCase():null; };

// ---------- CSV parser (RFC 4180) ----------
function parseCsv(text){ if(text.charCodeAt(0)===0xfeff) text=text.slice(1); const rows=[]; let row=[],f='',q=false; for(let i=0;i<text.length;i++){const c=text[i]; if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false;} else f+=c;} else if(c==='"') q=true; else if(c===','){row.push(f);f='';} else if(c==='\r'){} else if(c==='\n'){row.push(f);f='';rows.push(row);row=[];} else f+=c;} if(f!==''||row.length){row.push(f);rows.push(row);} return rows; }
function csvObjs(text){ const rows=parseCsv(text).filter(r=>!(r.length===1&&r[0].trim()==='')); if(!rows.length) return []; const h=rows[0].map(x=>x.trim()); return rows.slice(1).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]!==undefined?r[i]:'');return o;}); }
async function load(name){ return csvObjs(await readFile(path.join(LIVE,name),'utf8')); }

// ---------- mapeamentos ----------
const pendFromGeral = (o) => ({
  id: normUuid(o.ID), criado_em: normTs(o.Timestamp), autor: normText(o.Autor),
  titulo: normText(o.Titulo), descricao: normText(o.Descricao), urgencia: normText(o.Urgencia),
  resolvido: normBool(o.Resolvido), resolvido_por: normText(o.Resolvido_Por), data_resolucao: normTs(o.Data_Resolucao),
  ultima_acao_por: normText(o.Ultima_Acao_Por), ultima_acao_em: normTs(o.Ultima_Acao_Em),
  tem_vencimento: normBool(o.Tem_Vencimento), data_vencimento: normDate(o.Data_Vencimento), hora_vencimento: normText(o.Hora_Vencimento),
  reaberto_de: normUuid(o.ID_Reaberto_De), excluido: normBool(o.Excluido), excluido_por: normText(o.Excluido_Por),
  excluido_por_perfil: normText(o.Excluido_Por_Perfil), data_exclusao: normTs(o.Data_Exclusao), motivo_exclusao: normText(o.Motivo_Exclusao),
});
const pendFromArquivo = (o) => ({
  id: normUuid(o.ID), criado_em: normTs(o.Timestamp), autor: normText(o.Autor),
  titulo: normText(o.Titulo), descricao: normText(o.Descricao), urgencia: normText(o.Urgencia),
  resolvido: true, resolvido_por: normText(o.Resolvido_Por), data_resolucao: normTs(o.Data_Resolucao),
  ultima_acao_por: normText(o.Ultima_Acao_Por), ultima_acao_em: normTs(o.Ultima_Acao_Em),
  tem_vencimento: normBool(o.Tem_Vencimento), data_vencimento: normDate(o.Data_Vencimento), hora_vencimento: normText(o.Hora_Vencimento),
  reaberto_de: null, excluido: false, excluido_por: null, excluido_por_perfil: null, data_exclusao: null, motivo_exclusao: null,
});
const medFrom = (o) => ({
  id: normUuid(o.ID), criado_em: normTs(o.Timestamp), tipo: normText(o.Tipo), medicamento: normText(o.Medicamento),
  pre_pago: normBool(o.Pre_Pago), cliente: normText(o.Cliente), atendente: normText(o.Atendente), previsao_entrega: normDate(o.Previsao_Entrega),
  comprado: normBool(o.Comprado), entregue: normBool(o.Entregue), telefone: normText(o.Telefone), status: normText(o.Status),
  status_aviso_whatsapp: normText(o.Status_Aviso_WhatsApp), data_aviso_whatsapp: normTs(o.Data_Aviso_WhatsApp), preco_venda: normPrice(o.Preco_Venda),
  ultima_acao_por: normText(o.Ultima_Acao_Por), ultima_acao_em: normTs(o.Ultima_Acao_Em), revertido_por: normText(o.Revertido_Por),
  data_reversao: normTs(o.Data_Reversao), status_anterior: normText(o.Status_Anterior), motivo_reversao: normText(o.Motivo_Reversao),
  cancelado_por: normText(o.Cancelado_Por), data_cancelamento: normTs(o.Data_Cancelamento), motivo_cancelamento: normText(o.Motivo_Cancelamento),
  fornecedor_compra: normText(o.Fornecedor_Compra), codigo_compra_fornecedor: normText(o.Codigo_Compra_Fornecedor),
  forma_recebimento: normText(o.Forma_Recebimento), observacao_solicitacao: normText(o.Observacao_Solicitacao),
  mensagem_cliente: normText(o.Mensagem_Cliente), observacao_compra: normText(o.Observacao_Compra),
  pedido_id: normUuid(o.Pedido_ID), item_indice: normInt(o.Item_Indice), total_itens: normInt(o.Total_Itens),
  quantidade_item: normText(o.Quantidade_Item), observacao_item: normText(o.Observacao_Item),
});
const compFrom = (o) => ({
  id: normUuid(o.ID), data_solicitacao: normTs(o.Data_Solicitacao), categoria_compra: normText(o.Categoria_Compra),
  item: normText(o.Item), quantidade: normText(o.Quantidade), unidade: normText(o.Unidade), prioridade: normText(o.Prioridade),
  motivo: normText(o.Motivo), solicitante: normText(o.Solicitante), observacao: normText(o.Observacao),
  fornecedor_sugerido: normText(o.Fornecedor_Sugerido), previsao_desejada: normDate(o.Previsao_Desejada),
  status_compra: normText(o.Status_Compra), status_handover: normText(o.Status_Handover), comprado: normBool(o.Comprado),
  comprado_por: normText(o.Comprado_Por), data_compra: normTs(o.Data_Compra), cancelado: normBool(o.Cancelado),
  cancelado_por: normText(o.Cancelado_Por), data_cancelamento: normTs(o.Data_Cancelamento), motivo_cancelamento: normText(o.Motivo_Cancelamento),
  ultima_acao_por: normText(o.Ultima_Acao_Por), ultima_acao_em: normTs(o.Ultima_Acao_Em), excluido: normBool(o.Excluido),
  excluido_por: normText(o.Excluido_Por), excluido_em: normTs(o.Excluido_Em), pedido_id: normUuid(o.Pedido_ID),
  item_indice: normInt(o.Item_Indice), total_itens: normInt(o.Total_Itens), quantidade_item: normText(o.Quantidade_Item), observacao_item: normText(o.Observacao_Item),
});
const checkFrom = (o) => ({
  id: normUuid(o.ID), data: normDate(o.Data), turno: normText(o.Turno), horario_referencia: normText(o.Horario_Referencia),
  categoria: normText(o.Categoria), item: normText(o.Item), descricao: normText(o.Descricao), status: normText(o.Status),
  responsavel: normText(o.Responsavel), data_hora_check: normTs(o.Data_Hora_Check), observacao: normText(o.Observacao),
});
const audFrom = (o) => ({
  id_auditoria: normUuid(o.ID_Auditoria), data_hora: normTs(o.Data_Hora), acao: normText(o.Acao), origem: normText(o.Origem),
  id_item: normUuid(o.ID_Item), usuario: normText(o.Usuario), nome: normText(o.Nome), perfil: normText(o.Perfil),
  campo: normText(o.Campo), valor_anterior: normText(o.Valor_Anterior), valor_novo: normText(o.Valor_Novo), resumo: normText(o.Resumo),
});

// ---------- envio em lotes ----------
async function send(table, rows){
  if (DRY) { console.log(`  [dry] ${table}: ${rows.length} linhas`); return rows.length; }
  let total=0;
  for (let i=0;i<rows.length;i+=BATCH){
    const batch=rows.slice(i,i+BATCH);
    const res=await fetch(`${SUPABASE_URL}/rest/v1/rpc/_mig_bulk`,{
      method:'POST', headers:{apikey:ANON,Authorization:`Bearer ${ANON}`,'Content-Type':'application/json'},
      body:JSON.stringify({p_token:TOKEN,p_table:table,p_rows:batch}),
    });
    const txt=await res.text();
    if(!res.ok){ console.error(`  ! ${table} lote ${i}: HTTP ${res.status} ${txt.slice(0,300)}`); process.exit(1); }
    total += Number(txt)||0;
  }
  console.log(`  ${table}: ${total} inseridas`);
  return total;
}

(async () => {
  const geral = await load('A_gid_442068205.csv');
  const meds  = await load('A_gid_1262170013.csv');
  const arq   = await load('A_gid_1944518407.csv');
  const comp  = await load('A_gid_1750485387.csv');
  const chk   = await load('A_gid_361718338.csv');
  const aud   = await load('A_gid_787732691.csv');

  // pendencias = Geral + Arquivo[Origem=Geral], dedup por id (Geral vence)
  const pend=[]; const seenP=new Set();
  for (const o of geral){ const r=pendFromGeral(o); if(!r.id||seenP.has(r.id))continue; seenP.add(r.id); pend.push(r); }
  let arqGeral=0;
  for (const o of arq){ if(normText(o.Origem)!=='Geral')continue; const r=pendFromArquivo(o); if(!r.id||seenP.has(r.id))continue; seenP.add(r.id); pend.push(r); arqGeral++; }

  // medicamentos = Medicamentos + Arquivo[Origem=Medicamentos], dedup por id (tab vence)
  const med=[]; const seenM=new Set();
  for (const o of meds){ const r=medFrom(o); if(!r.id||seenM.has(r.id))continue; seenM.add(r.id); med.push(r); }
  let arqMed=0;
  for (const o of arq){ if(normText(o.Origem)!=='Medicamentos')continue; const r=medFrom(o); if(!r.id||seenM.has(r.id))continue; seenM.add(r.id); med.push(r); arqMed++; }

  // compras_reposicao = Compras_Reposicao, dedup por id
  const cr=[]; const seenC=new Set();
  for (const o of comp){ const r=compFrom(o); if(!r.id||seenC.has(r.id))continue; seenC.add(r.id); cr.push(r); }

  // checklist = dedup por (data,turno,item) — respeita índice único; preferir linha com check
  const byKey=new Map();
  for (const o of chk){ const r=checkFrom(o); if(!r.id||!r.data||!r.turno)continue; const k=`${r.data}|${r.turno}|${r.item}`;
    const ex=byKey.get(k); if(!ex || (!ex.data_hora_check && r.data_hora_check)) byKey.set(k,r); }
  const ck=[...byKey.values()];

  // auditoria
  const au=[]; const seenA=new Set();
  for (const o of aud){ const r=audFrom(o); if(!r.id_auditoria||seenA.has(r.id_auditoria))continue; seenA.add(r.id_auditoria); au.push(r); }

  console.log(`Origem -> destino:`);
  console.log(`  Geral=${geral.length} | Arquivo[Geral]=${arqGeral} -> pendencias=${pend.length}`);
  console.log(`  Medicamentos=${meds.length} | Arquivo[Med]=${arqMed} -> medicamentos=${med.length}`);
  console.log(`  Compras_Reposicao=${comp.length} -> compras_reposicao=${cr.length}`);
  console.log(`  Checklist=${chk.length} -> checklist_turnos=${ck.length} (dedup únicos)`);
  console.log(`  Auditoria=${aud.length} -> auditoria=${au.length}`);
  console.log(DRY?'\n*** DRY-RUN ***':'\nEnviando...');

  await send('pendencias', pend);
  await send('medicamentos', med);
  await send('compras_reposicao', cr);
  await send('checklist_turnos', ck);
  await send('auditoria', au);
  console.log('\nConcluído.');
})();
