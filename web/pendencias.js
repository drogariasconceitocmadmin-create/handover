/* Handover v2 — aba Pendências. */
import { G } from './state.js';
import { db, rpcError } from './api.js';
import { el, ce, escHtml, fmt, fmtData, toast, markLastAction, copiarInfo, isVencido, isHoje } from './utils.js';
import { filterChip, buildCard, buildTop, buildMeta, buildActions, renderQueueList } from './cards.js';
import { abrirDetalhes } from './detalhes.js';
import { abrirAuditDrawer } from './auditoria.js';
import { editarItem } from './forms.js';
import { carregarBundle } from './dashboard.js';

export function renderPendencias() {
  var list = (G.bundle && G.bundle.geral) || [];
  el('queue-section-heading').textContent = 'Fila de pendências';
  el('queue-section-lede').classList.add('hidden');

  // contar por filtro
  var cPend  = list.filter(function(p) { return !p.resolvido; }).length;
  var cTodos = list.length;
  var cUrg   = list.filter(function(p) { return !p.resolvido && p.urgencia === 'Urgente'; }).length;
  var cVenc  = list.filter(function(p) { return !p.resolvido && (isVencido(p.data_vencimento) || isHoje(p.data_vencimento)); }).length;
  var cRes   = list.filter(function(p) { return p.resolvido; }).length;

  el('queue-filters-host').innerHTML =
    '<div class="filter-group">' +
    filterChip('pf', 'pendentes',    'Pendentes',   cPend,  G.pendFilter) +
    filterChip('pf', 'todos',        'Todos',        cTodos, G.pendFilter) +
    filterChip('pf', 'urgentes',     'Urgentes',     cUrg,   G.pendFilter) +
    filterChip('pf', 'vencidos',     'Vencidos/Hoje',cVenc,  G.pendFilter) +
    filterChip('pf', 'resolvidos',   'Resolvidos',   cRes,   G.pendFilter) +
    '</div>';

  el('queue-filters-host').querySelectorAll('.filter-button').forEach(function(b) {
    b.addEventListener('click', function() {
      G.pendFilter = b.getAttribute('data-pf');
      renderPendencias();
    });
  });

  var search = (G.medSearch || '').trim().toLowerCase();
  var view = list.filter(function(p) {
    var ok;
    if (G.pendFilter === 'resolvidos')      ok = p.resolvido;
    else if (G.pendFilter === 'urgentes')   ok = !p.resolvido && p.urgencia === 'Urgente';
    else if (G.pendFilter === 'vencidos')   ok = !p.resolvido && (isVencido(p.data_vencimento) || isHoje(p.data_vencimento));
    else if (G.pendFilter === 'todos')      ok = true;
    else                                    ok = !p.resolvido;
    if (ok && search) {
      var txt = [p.titulo, p.descricao, p.autor, p.urgencia].join(' ').toLowerCase();
      ok = txt.indexOf(search) >= 0;
    }
    return ok;
  });

  el('queue-subtitle').textContent =
    'Pendências · Filtro: ' + G.pendFilter + (search ? ' · busca "' + search + '"' : '') +
    ' · ' + view.length + ' registro(s)';

  renderQueueList(view, renderCardPend);
}

export function renderCardPend(p) {
  var overdue = !p.resolvido && (isVencido(p.data_vencimento) || isHoje(p.data_vencimento));
  var c = buildCard(overdue ? 'qk-stripe-vencido' : p.resolvido ? 'qk-stripe-hist-resolvido' : 'qk-stripe-geral',
    overdue ? 'overdue' : '');

  // badges
  var badgesHtml = '<span class="qk-type-tag">SOLICITAÇÕES</span>' +
    ' <span class="badge">Solicitações</span>';
  if (!p.resolvido) badgesHtml += ' <span class="badge status-pendente">Pendente</span>';
  else              badgesHtml += ' <span class="badge status-entregue">Resolvido</span>';
  if (p.urgencia === 'Urgente') badgesHtml += ' <span class="badge badge-urgente">Urgente</span>';
  else if (p.urgencia === 'Alta') badgesHtml += ' <span class="badge">Alta</span>';
  if (overdue) badgesHtml += ' <span class="badge deadline-vencido">Vencido</span>';

  var menuItems = [];
  menuItems.push({ label: 'Ver detalhes', fn: (function(pp) { return function() {
    abrirDetalhes(pp.titulo || '(sem título)', [
      { title: 'SOLICITAÇÃO', fields: [
        ['Título',    pp.titulo],
        ['Urgência',  pp.urgencia],
        ['Autor',     pp.autor],
        ['Criado em', fmt(pp.criado_em)],
        ['Vencimento',pp.data_vencimento ? fmtData(pp.data_vencimento) + (pp.hora_vencimento ? ' ' + pp.hora_vencimento : '') : null],
        ['Descrição', pp.descricao],
      ]},
      { title: 'STATUS', fields: [
        ['Status',       pp.resolvido ? 'Resolvido' : 'Pendente'],
        ['Resolvido por',pp.resolvido_por],
      ]},
      { title: 'ÚLTIMA AÇÃO', fields: [
        ['Por', pp.ultima_acao_por],
        ['Em',  pp.ultima_acao_em ? fmt(pp.ultima_acao_em) : null],
      ]},
    ]);
  }; })(p) });
  menuItems.push({ label: 'Editar', fn: (function(pid) { return function() { editarItem(pid, 'Geral'); }; })(p.id) });
  menuItems.push({ label: 'Ver trilha de auditoria', fn: (function(pid, ptit) { return function() { abrirAuditDrawer(pid, ptit); }; })(p.id, p.titulo) });
  menuItems.push({ label: 'Copiar informações', fn: (function(pp) { return function() {
    copiarInfo([
      'Pendência: ' + (pp.titulo || ''),
      pp.descricao ? 'Descrição: ' + pp.descricao : null,
      'Urgência: ' + (pp.urgencia || 'Normal'),
      'Autor: ' + (pp.autor || ''),
      'Status: ' + (pp.resolvido ? 'Resolvido' : 'Pendente'),
      'Data: ' + fmt(pp.criado_em),
    ]);
  }; })(p) });
  if (!p.resolvido) {
    menuItems.push({ label: 'Marcar como resolvido', fn: function() { resolverPend(p.id, true); } });
  } else {
    menuItems.push({ label: 'Reabrir', fn: function() { resolverPend(p.id, false); } });
  }
  menuItems.push({ label: 'Excluir', fn: function() { excluirPend(p.id); } });

  c.main.appendChild(buildTop(badgesHtml, fmt(p.criado_em), menuItems));

  var titulo = ce('div', 'qk-title', escHtml(p.titulo || '(sem título)'));
  c.main.appendChild(titulo);

  if (p.descricao) {
    var desc = ce('div', 'qk-desc', escHtml(p.descricao));
    c.main.appendChild(desc);
    if (p.descricao.length > 180) {
      var expBtn = ce('button', 'qk-expand-btn');
      expBtn.type = 'button'; expBtn.textContent = 'Ver mais';
      expBtn.addEventListener('click', function() {
        var expanded = desc.classList.toggle('qk-desc--expanded');
        expBtn.textContent = expanded ? 'Ver menos' : 'Ver mais';
      });
      c.main.appendChild(expBtn);
    }
  }

  var uaPor = p.ultima_acao_por || p.Ultima_Acao_Por || p.autor || null;
  var uaEm  = p.ultima_acao_em  || p.Ultima_Acao_Em  || p.criado_em || null;
  c.main.appendChild(buildMeta([
    ['AUTOR',         p.autor],
    ['URGÊNCIA',      p.urgencia],
    ['ÚLTIMA AÇÃO',   uaPor ? (uaPor + (uaEm ? ' · ' + fmt(uaEm) : '')) : null],
    ['RESOLVIDO POR', p.resolvido_por || p.Resolvido_Por || null],
  ]));

  var actionBtns = [];
  if (!p.resolvido) {
    actionBtns.push({ label: 'Marcar como resolvido', cls: 'btn-queue-primary', fn: function() { resolverPend(p.id, true); } });
  } else {
    actionBtns.push({ label: 'Reabrir', cls: 'btn-queue-secondary', fn: function() { resolverPend(p.id, false); } });
  }
  c.main.appendChild(buildActions(actionBtns));
  return c.card;
}

export async function resolverPend(id, val) {
  var res = await db.rpc('handover_pendencia_resolver', { p_token: G.token, p_id: id, p_resolvido: val });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao atualizar.', 'erro'); return; }
  toast(val ? 'Marcada como resolvida.' : 'Reaberta.', 'ok');
  markLastAction(); carregarBundle();
}

export async function excluirPend(id) {
  var motivo = window.prompt('Motivo da exclusão:');
  if (motivo === null) return;
  var res = await db.rpc('handover_pendencia_excluir', { p_token: G.token, p_id: id, p_motivo: motivo });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao excluir.', 'erro'); return; }
  toast('Pendência excluída.', 'ok'); markLastAction(); carregarBundle();
}
