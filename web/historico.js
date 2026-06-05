/* Handover v2 — aba Histórico / Resolvidos + modal reabrir. */
import { G } from './state.js';
import { db, rpcError } from './api.js';
import { el, ce, escHtml, fmt, toast, markLastAction, copiarInfo } from './utils.js';
import { buildCard, buildTop, buildActions, renderQueueList } from './cards.js';
import { abrirDetalhes } from './detalhes.js';
import { abrirAuditDrawer } from './auditoria.js';
import { carregarBundle } from './dashboard.js';

export async function renderHistorico() {
  el('queue-section-heading').textContent = 'Histórico / Resolvidos';
  el('queue-filters-host').innerHTML = '';
  el('queue-subtitle').textContent = 'Carregando…';
  if (!G.historico) {
    var res = await db.rpc('handover_historico', { p_token: G.token, p_limit: 100 });
    if (rpcError(res)) return;
    if (res.error) { el('queue-subtitle').textContent = 'Erro ao carregar.'; return; }
    G.historico = (res.data && res.data.historico) || [];
  }
  var list = G.historico;
  el('tab-badge-historico').textContent = list.length;
  el('queue-subtitle').textContent = 'Histórico · ' + list.length + ' registro(s)';
  renderQueueList(list, renderCardHistorico);
}

function renderCardHistorico(h) {
  var c = buildCard('qk-stripe-hist', 'queue-card--historico');
  var titulo = h.Titulo || h.Medicamento || h.Item || '(registro)';
  var estado = h.Estado_Arquivo || h.Status || 'Arquivado';
  var estadoCls = estado === 'Cancelado' ? 'status-cancelado'
                : estado === 'Entregue'  ? 'status-entregue'
                : 'status-historico_resolvido';
  var badgesHtml = '<span class="qk-type-tag">' + escHtml(h.Origem || 'HISTÓRICO') + '</span>' +
    ' <span class="badge ' + estadoCls + '">' + escHtml(estado) + '</span>';

  /* ── Menu ·· ── */
  var menuItems = [];
  menuItems.push({ label: 'Ver detalhes', fn: (function(hh, tit) { return function() {
    var sections = [];
    if (hh.Origem === 'Geral') {
      sections = [
        { title: 'PENDÊNCIA', fields: [
          ['Título',        hh.Titulo],
          ['Descrição',     hh.Descricao],
          ['Urgência',      hh.Urgencia],
          ['Autor',         hh.Autor],
          ['Criado em',     fmt(hh.Timestamp)],
        ]},
        { title: 'RESOLUÇÃO', fields: [
          ['Estado',        hh.Estado_Arquivo],
          ['Resolvido por', hh.Resolvido_Por],
          ['Data resolução',fmt(hh.Data_Resolucao)],
        ]},
        { title: 'ÚLTIMA AÇÃO', fields: [
          ['Por', hh.Ultima_Acao_Por],
          ['Em',  fmt(hh.Ultima_Acao_Em)],
        ]},
      ];
    } else if (hh.Origem === 'Medicamentos') {
      sections = [
        { title: 'SOLICITAÇÃO', fields: [
          ['Medicamento',  hh.Medicamento],
          ['Tipo',         hh.Tipo],
          ['Cliente',      hh.Cliente],
          ['Atendente',    hh.Atendente],
          ['Pré-pago',     hh.Pre_Pago ? 'Sim' : null],
          ['Telefone',     hh.Telefone],
          ['Previsão',     hh.Previsao_Entrega],
          ['Criado em',    fmt(hh.Timestamp)],
          ['Observação',   hh.Observacao_Solicitacao],
        ]},
        { title: 'DESFECHO', fields: [
          ['Estado',           hh.Estado_Arquivo],
          ['Cancelado por',    hh.Cancelado_Por],
          ['Motivo canc.',     hh.Motivo_Cancelamento],
          ['Data cancelamento',fmt(hh.Data_Cancelamento)],
        ]},
        { title: 'ÚLTIMA AÇÃO', fields: [
          ['Por', hh.Ultima_Acao_Por],
          ['Em',  fmt(hh.Ultima_Acao_Em)],
        ]},
      ];
    } else {
      sections = [
        { title: 'SOLICITAÇÃO', fields: [
          ['Item',         hh.Item],
          ['Categoria',    hh.Categoria_Compra],
          ['Quantidade',   hh.Quantidade],
          ['Prioridade',   hh.Prioridade],
          ['Solicitante',  hh.Solicitante],
          ['Motivo',       hh.Motivo],
          ['Observação',   hh.Observacao],
          ['Data solic.',  fmt(hh.Data_Solicitacao)],
        ]},
        { title: 'DESFECHO', fields: [
          ['Estado',           hh.Estado_Arquivo],
          ['Comprado por',     hh.Comprado_Por],
          ['Data compra',      fmt(hh.Data_Compra)],
          ['Cancelado por',    hh.Cancelado_Por],
          ['Motivo canc.',     hh.Motivo_Cancelamento],
          ['Data cancelamento',fmt(hh.Data_Cancelamento)],
        ]},
        { title: 'ÚLTIMA AÇÃO', fields: [
          ['Por', hh.Ultima_Acao_Por],
          ['Em',  fmt(hh.Ultima_Acao_Em)],
        ]},
      ];
    }
    abrirDetalhes(tit, sections);
  }; })(h, titulo) });
  menuItems.push({ label: 'Ver trilha de auditoria', fn: (function(hid, tit) { return function() { abrirAuditDrawer(hid, tit); }; })(h.ID, titulo) });
  menuItems.push({ label: 'Copiar informações', fn: (function(hh, tit) { return function() {
    var lines = [];
    lines.push('[Histórico] ' + tit);
    lines.push('Origem: ' + (hh.Origem || ''));
    lines.push('Estado: ' + (hh.Estado_Arquivo || ''));
    if (hh.Origem === 'Geral') {
      if (hh.Urgencia)     lines.push('Urgência: ' + hh.Urgencia);
      if (hh.Autor)        lines.push('Autor: ' + hh.Autor);
      if (hh.Descricao)    lines.push('Descrição: ' + hh.Descricao);
      if (hh.Resolvido_Por)lines.push('Resolvido por: ' + hh.Resolvido_Por);
    } else if (hh.Origem === 'Medicamentos') {
      if (hh.Tipo)         lines.push('Tipo: ' + hh.Tipo);
      if (hh.Cliente)      lines.push('Cliente: ' + hh.Cliente);
      if (hh.Atendente)    lines.push('Atendente: ' + hh.Atendente);
      if (hh.Telefone)     lines.push('Telefone: ' + hh.Telefone);
    } else {
      if (hh.Categoria_Compra) lines.push('Categoria: ' + hh.Categoria_Compra);
      if (hh.Quantidade)   lines.push('Quantidade: ' + hh.Quantidade);
      if (hh.Solicitante)  lines.push('Solicitante: ' + hh.Solicitante);
      if (hh.Comprado_Por) lines.push('Comprado por: ' + hh.Comprado_Por);
    }
    lines.push('Última ação: ' + (hh.Ultima_Acao_Por || '—') + ' em ' + fmt(hh.Ultima_Acao_Em));
    copiarInfo(lines);
  }; })(h, titulo) });

  c.main.appendChild(buildTop(badgesHtml, fmt(h.Ultima_Acao_Em), menuItems));
  c.main.appendChild(ce('div', 'qk-title', escHtml(titulo)));

  /* Subtítulo contextual */
  var sub = '';
  if (h.Origem === 'Geral') {
    sub = (h.Urgencia ? h.Urgencia + ' · ' : '') + 'Por ' + (h.Autor || '—');
    if (h.Resolvido_Por) sub += ' · Resolvido por ' + h.Resolvido_Por;
  } else if (h.Origem === 'Medicamentos') {
    sub = (h.Tipo || '') + (h.Cliente ? ' · Cliente: ' + h.Cliente : '') + (h.Atendente ? ' · ' + h.Atendente : '');
  } else {
    sub = (h.Categoria_Compra || '') + (h.Quantidade ? ' · ' + h.Quantidade : '') + (h.Solicitante ? ' · Por ' + h.Solicitante : '');
    if (h.Comprado_Por) sub += ' · Comprado por ' + h.Comprado_Por;
  }
  if (sub) c.main.appendChild(ce('div', 'qk-sub', escHtml(sub.replace(/^\s*·\s*/, ''))));

  c.main.appendChild(buildActions([
    { label: 'Reabrir', cls: 'btn-queue-secondary', fn: function() { abrirModalReopen(h.ID, h.Origem); } }
  ]));
  return c.card;
}

/* ── MODAL REABRIR ── */
function abrirModalReopen(id, origem) {
  G.reopenId = id; G.reopenOrigem = origem;
  el('reopen-motivo-input').value = '';
  el('reopen-confirm-overlay').classList.remove('hidden');
  el('reopen-confirm-overlay').setAttribute('aria-hidden', 'false');
}
export function cancelReopenHistoricoModal_() {
  G.reopenId = null; G.reopenOrigem = null;
  el('reopen-confirm-overlay').classList.add('hidden');
  el('reopen-confirm-overlay').setAttribute('aria-hidden', 'true');
}
export async function confirmReopenHistoricoModal_() {
  if (!G.reopenId) return;
  var motivo = el('reopen-motivo-input').value.trim();
  var res = await db.rpc('handover_historico_reabrir', { p_token: G.token, p_id: G.reopenId, p_motivo: motivo });
  cancelReopenHistoricoModal_();
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao reabrir.', 'erro'); return; }
  G.historico = null;
  toast('Reaberto.', 'ok'); markLastAction('Reaberto'); carregarBundle();
}
