/* Handover v2 — aba Compras e reposição. */
import { G } from './state.js';
import { db, rpcError } from './api.js';
import { el, ce, escHtml, fmt, fmtData, toast, markLastAction, copiarInfo } from './utils.js';
import { filterChip, buildCard, buildTop, buildMeta, buildActions, renderQueueList } from './cards.js';
import { abrirDetalhes } from './detalhes.js';
import { carregarBundle } from './dashboard.js';

export function renderCompras() {
  var list = (G.bundle && G.bundle.comprasReposicao) || [];
  el('queue-section-heading').textContent = 'Compras e reposição';

  var cPend  = list.filter(function(r) { return r.Status_Compra === 'Pendente de compra'; }).length;
  var cComp  = list.filter(function(r) { return r.Status_Compra === 'Comprado'; }).length;
  var cTodos = list.length;
  var cNaoE  = list.filter(function(r) { return r.Status_Compra === 'Não encontrado'; }).length;

  var f = G.comprasFilter || 'pendentes';

  el('queue-filters-host').innerHTML =
    '<div class="filter-group">' +
    filterChip('cf', 'pendentes',      'Pendentes',                   cPend, f) +
    filterChip('cf', 'comprados',      'Comprados · aguard. recebimento', cComp, f) +
    filterChip('cf', 'todos',          'Todos',                       cTodos, f) +
    filterChip('cf', 'nao_encontrado', 'Não encontrados',             cNaoE,  f) +
    '</div>';

  el('queue-filters-host').querySelectorAll('.filter-button').forEach(function(b) {
    b.addEventListener('click', function() {
      G.comprasFilter = b.getAttribute('data-cf');
      renderCompras();
    });
  });

  var search = (G.medSearch || '').trim().toLowerCase();
  var view = list.filter(function(r) {
    var ok;
    if (f === 'pendentes')           ok = r.Status_Compra === 'Pendente de compra';
    else if (f === 'comprados')      ok = r.Status_Compra === 'Comprado';
    else if (f === 'nao_encontrado') ok = r.Status_Compra === 'Não encontrado';
    else                             ok = true;
    if (ok && search) {
      var txt = [r.Item, r.Categoria_Compra, r.Solicitante, r.Observacao, r.Motivo, r.Fornecedor_Sugerido]
        .join(' ').toLowerCase();
      ok = txt.indexOf(search) >= 0;
    }
    return ok;
  });

  el('queue-subtitle').textContent =
    'Compras e reposição · Filtro: ' + f + (search ? ' · busca "' + search + '"' : '') +
    ' · ' + view.length + ' registro(s)';

  renderQueueList(view, renderCardCompra);
}

export function renderCardCompra(r) {
  var statusCls = r.Status_Compra === 'Não encontrado' ? 'status-cancelado' :
                  r.Status_Compra === 'Comprado'       ? 'status-comprado'  : 'status-pendente';
  var badgesHtml = '<span class="qk-type-tag">COMPRAS E REPOSIÇÃO</span>' +
    ' <span class="badge">' + escHtml(r.Categoria_Compra || 'Reposição') + '</span>' +
    ' <span class="badge ' + statusCls + '">' + escHtml(r.Status_Compra || 'Pendente de compra') + '</span>';
  if (r.Prioridade === 'Urgente') badgesHtml += ' <span class="badge badge-urgente">Urgente</span>';

  var menuItems = [];
  menuItems.push({ label: 'Ver detalhes', fn: (function(rr) { return function() {
    abrirDetalhes(rr.Item || '(sem item)', [
      { title: 'SOLICITAÇÃO', fields: [
        ['Item / Produto',    rr.Item],
        ['Categoria',         rr.Categoria_Compra],
        ['Quantidade',        rr.Quantidade],
        ['Prioridade',        rr.Prioridade],
        ['Solicitante',       rr.Solicitante],
        ['Data da solicitação', fmt(rr.Data_Solicitacao)],
      ]},
      { title: 'COMPRA', fields: [
        ['Status compra',   rr.Status_Compra],
        ['Status handover', rr.Status_Handover],
        ['Observação',      rr.Observacao || rr.Motivo],
        ['Fornecedor',      rr.Fornecedor_Sugerido],
        ['Previsão desejada', fmtData(rr.Previsao_Desejada)],
      ]},
      { title: 'ÚLTIMA AÇÃO', fields: [
        ['Por', rr.Ultima_Acao_Por],
        ['Em',  rr.Ultima_Acao_Em ? fmt(rr.Ultima_Acao_Em) : null],
      ]},
    ]);
  }; })(r) });
  menuItems.push({ label: 'Copiar informações', fn: (function(rr) { return function() {
    copiarInfo([
      'Item: ' + (rr.Item || ''),
      'Categoria: ' + (rr.Categoria_Compra || ''),
      'Quantidade: ' + (rr.Quantidade || ''),
      'Prioridade: ' + (rr.Prioridade || ''),
      'Solicitante: ' + (rr.Solicitante || ''),
      rr.Motivo ? 'Obs: ' + rr.Motivo : null,
    ]);
  }; })(r) });
  var _perfil = (G.sessao || {}).perfil || '';
  if (r.Status_Compra === 'Comprado') {
    menuItems.push({ label: 'Marcar recebido na loja', fn: (function(rid) { return function() { receberReposicao(rid); }; })(r.ID) });
  }
  if (['gerente','admin'].indexOf(_perfil) >= 0) {
    menuItems.push({ label: 'Cancelar', fn: (function(rid) { return function() { cancelarReposicao(rid); }; })(r.ID) });
  }

  // stripe diferente para Comprado (aguardando recebimento)
  var stripe = r.Status_Compra === 'Comprado' ? 'qk-stripe-hoje' : 'qk-stripe-geral';
  var c = buildCard(stripe);

  c.main.appendChild(buildTop(badgesHtml, fmt(r.Data_Solicitacao), menuItems));
  c.main.appendChild(ce('div', 'qk-title', escHtml(r.Item || '(sem item)')));
  if (r.Motivo) c.main.appendChild(ce('div', 'qk-desc', escHtml(r.Motivo)));
  c.main.appendChild(buildMeta([
    ['QUANTIDADE',   r.Quantidade],
    ['PRIORIDADE',   r.Prioridade],
    ['SOLICITANTE',  r.Solicitante],
    ['COMPRADO POR', r.Comprado_Por || null],
    ['PREVISÃO',     fmtData(r.Previsao_Desejada)],
    ['FORNECEDOR',   r.Fornecedor_Sugerido],
  ]));

  var actionBtns = [];
  if (r.Status_Compra === 'Comprado') {
    actionBtns.push({ label: 'Marcar recebido na loja', cls: 'btn-queue-primary',
      fn: (function(rid) { return function() { receberReposicao(rid); }; })(r.ID) });
  }
  if (['gerente','admin'].indexOf(_perfil) >= 0) {
    actionBtns.push({ label: 'Cancelar', cls: 'btn-queue-secondary',
      fn: (function(rid) { return function() { cancelarReposicao(rid); }; })(r.ID) });
  }
  if (actionBtns.length) c.main.appendChild(buildActions(actionBtns));
  return c.card;
}

export async function receberReposicao(id) {
  var res = await db.rpc('handover_compra_reposicao_receber', { p_token: G.token, p_id: id });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao registrar recebimento.', 'erro'); return; }
  toast('Recebido na loja.', 'ok'); markLastAction('Recebido'); carregarBundle();
}

export async function cancelarReposicao(id) {
  var motivo = window.prompt('Motivo do cancelamento:');
  if (motivo === null) return;
  var res = await db.rpc('handover_compra_reposicao_cancelar', {
    p_token: G.token, p_id: id, p_motivo: motivo
  });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao cancelar.', 'erro'); return; }
  toast('Cancelado.', 'ok'); markLastAction(); carregarBundle();
}
