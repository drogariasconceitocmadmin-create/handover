/* Handover v2 — aba Medicamentos (encomendas/faltas). */
import { G } from './state.js';
import { db, rpcError } from './api.js';
import { el, ce, escHtml, fmt, fmtData, toast, markLastAction, copiarInfo, isVencido } from './utils.js';
import { filterChip, buildCard, buildTop, buildMeta, buildActions } from './cards.js';
import { abrirDetalhes } from './detalhes.js';
import { abrirAuditDrawer } from './auditoria.js';
import { editarItem } from './forms.js';
import { carregarBundle } from './dashboard.js';

export function renderMedicamentos() {
  var list = (G.bundle && G.bundle.medicamentos) || [];
  el('queue-section-heading').textContent = 'Medicamentos solicitados';

  // Contagens por filtro
  var hoje = new Date().toLocaleDateString('pt-BR');
  function dtLocal(d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch(e) { return ''; } }

  var cPend  = list.filter(function(m) { return m.Status === 'Pendente'; }).length;
  var cTodos = list.length;
  var cFalt  = list.filter(function(m) { return m.Tipo === 'Falta'; }).length;
  var cEnc   = list.filter(function(m) { return m.Tipo === 'Encomenda'; }).length;
  var cComp  = list.filter(function(m) { return m.Status === 'Comprado'; }).length;
  var cSemAv = list.filter(function(m) { return m.Status === 'Comprado' && m.Status_Aviso_WhatsApp !== 'Tentativa registrada'; }).length;
  var cEnt   = list.filter(function(m) { return m.Status === 'Entregue'; }).length;
  var cCanc  = list.filter(function(m) { return m.Status === 'Cancelado'; }).length;
  var cNaoE  = list.filter(function(m) { return m.Status === 'Não encontrado'; }).length;
  var cVenc  = list.filter(function(m) {
    if (!m.Previsao_Entrega) return false;
    var d = dtLocal(m.Previsao_Entrega);
    return d && d <= hoje;
  }).length;
  var cResPar= list.filter(function(m) { return m.Status === 'Comprado' && m.Pre_Pago; }).length;

  var f = G.medFilter;
  el('queue-filters-host').innerHTML =
    filterChip('mf', 'pendentes',         'Pendentes',           cPend,  f) +
    filterChip('mf', 'todos',             'Todos',               cTodos, f) +
    filterChip('mf', 'Falta',             'Faltas',              cFalt,  f) +
    filterChip('mf', 'Encomenda',         'Encomendas',          cEnc,   f) +
    filterChip('mf', 'Comprado',          'Comprados',           cComp,  f) +
    filterChip('mf', 'comprados_sem_av',  'Comprados sem aviso', cSemAv, f) +
    filterChip('mf', 'Entregue',          'Entregues',           cEnt,   f) +
    filterChip('mf', 'Cancelado',         'Cancelados',          cCanc,  f) +
    filterChip('mf', 'Não encontrado',    'Não encontrados',     cNaoE,  f) +
    filterChip('mf', 'vencidos',          'Vencidos/Hoje',       cVenc,  f) +
    filterChip('mf', 'res_parcial',       'Resolvidos parcialmente', cResPar, f);

  el('queue-filters-host').querySelectorAll('.ho-filter, .filter-button').forEach(function(b) {
    b.addEventListener('click', function() {
      G.medFilter = b.getAttribute('data-mf');
      renderMedicamentos();
    });
  });

  var search = (G.medSearch || '').toLowerCase();
  var view = list.filter(function(m) {
    var ok = true;
    switch (G.medFilter) {
      case 'pendentes':        ok = m.Status === 'Pendente'; break;
      case 'Falta':            ok = m.Tipo === 'Falta'; break;
      case 'Encomenda':        ok = m.Tipo === 'Encomenda'; break;
      case 'Comprado':         ok = m.Status === 'Comprado'; break;
      case 'comprados_sem_av': ok = m.Status === 'Comprado' && m.Status_Aviso_WhatsApp !== 'Tentativa registrada'; break;
      case 'Entregue':         ok = m.Status === 'Entregue'; break;
      case 'Cancelado':        ok = m.Status === 'Cancelado'; break;
      case 'Não encontrado':   ok = m.Status === 'Não encontrado'; break;
      case 'vencidos':
        ok = !!m.Previsao_Entrega && dtLocal(m.Previsao_Entrega) <= hoje; break;
      case 'res_parcial':      ok = m.Status === 'Comprado' && m.Pre_Pago; break;
      default: ok = true;
    }
    if (ok && search) {
      var txt = [m.Medicamento, m.Cliente, m.Telefone, m.Atendente, m.Status, String(m.Preco_Venda || '')]
        .join(' ').toLowerCase();
      ok = txt.indexOf(search) >= 0;
    }
    return ok;
  });

  el('queue-subtitle').textContent = 'Medicamentos · Filtro: ' + G.medFilter + ' · ' + view.length + ' registro(s)';

  // Agrupar por Pedido_ID
  var grupos = [], pedMap = {};
  view.forEach(function(m) {
    var pid = m.Pedido_ID;
    if (pid && m.Total_Itens > 1) {
      if (!pedMap[pid]) { pedMap[pid] = []; grupos.push({ tipo: 'pedido', pid: pid, itens: pedMap[pid] }); }
      pedMap[pid].push(m);
    } else {
      grupos.push({ tipo: 'single', item: m });
    }
  });

  var ql = el('queue-list'); ql.innerHTML = '';
  var qe = el('queue-empty');
  if (!grupos.length) { qe.classList.remove('hidden'); return; }
  qe.classList.add('hidden');
  grupos.forEach(function(g) {
    if (g.tipo === 'single') {
      ql.appendChild(renderCardMed(g.item, false));
    } else {
      ql.appendChild(renderGrupoMed(g));
    }
  });
}

function stripeForMed(m) {
  var s = m.Status || '';
  if (s === 'Cancelado') return 'qk-stripe-vencido';
  if (m.Previsao_Entrega && isVencido(m.Previsao_Entrega)) return 'qk-stripe-hoje';
  if (s === 'Entregue')  return 'qk-stripe-hist-resolvido';
  if (s === 'Comprado')  return 'qk-stripe-hoje';
  return 'qk-stripe-med';
}

function statusBadgeCls(s) {
  var map = { 'Pendente':'status-pendente', 'Comprado':'status-comprado',
              'Entregue':'status-entregue', 'Cancelado':'status-cancelado',
              'Não encontrado':'status-nao_encontrado' };
  return map[s] || '';
}

export function renderCardMed(m, subItem) {
  var vencido = m.Previsao_Entrega && isVencido(m.Previsao_Entrega);
  var c = buildCard(stripeForMed(m), subItem ? 'qc-subitem' : '');

  var badgesHtml = '<span class="qk-type-tag">MEDICAMENTOS</span>' +
    ' <span class="badge">' + escHtml(m.Tipo || '') + '</span>' +
    ' <span class="badge ' + statusBadgeCls(m.Status) + '">' + escHtml(m.Status || '') + '</span>';
  if (vencido) badgesHtml += ' <span class="badge deadline-vencido">Vencido</span>';
  if (m.Pre_Pago) badgesHtml += ' <span class="badge">Pré-pago</span>';

  var menuItems = acoesMed(m);
  c.main.appendChild(buildTop(badgesHtml, fmt(m.Ultima_Acao_Em || m.Timestamp), menuItems));

  c.main.appendChild(ce('div', 'qk-title', escHtml(m.Medicamento || '(sem nome)')));

  var descParts = [];
  if (m.Tipo) descParts.push('Tipo: ' + m.Tipo);
  if (m.Pre_Pago !== undefined && m.Pre_Pago !== null) descParts.push('Pré-pago: ' + (m.Pre_Pago ? 'Sim' : 'Não'));
  if (m.Observacao_Solicitacao) descParts.push('Obs: ' + m.Observacao_Solicitacao);
  if (descParts.length) c.main.appendChild(ce('div', 'qk-desc', escHtml(descParts.join(' · '))));

  c.main.appendChild(buildMeta([
    ['CLIENTE',          m.Cliente],
    ['TELEFONE',         m.Telefone],
    ['RECEBIMENTO',      m.Forma_Recebimento],
    ['ATENDENTE',        m.Atendente],
    ['PREVISÃO',         fmtData(m.Previsao_Entrega)],
    ['FORNECEDOR',       m.Fornecedor_Compra && m.Fornecedor_Compra !== 'Não informado' ? m.Fornecedor_Compra : null],
    ['CÓDIGO COMPRA',    m.Codigo_Compra_Fornecedor],
    ['PREÇO',            m.Preco_Venda ? 'R$ ' + m.Preco_Venda : null],
    ['WHATSAPP',         m.Status_Aviso_WhatsApp || 'Não registrado'],
    ['ÚLTIMA AÇÃO',      m.Ultima_Acao_Por ? m.Ultima_Acao_Por + (m.Ultima_Acao_Em ? ' · ' + fmt(m.Ultima_Acao_Em) : '') : null],
  ]));

  c.main.appendChild(buildActions(botoesAcoesCard(m)));
  return c.card;
}

function acoesMed(m) {
  var s = m.Status;
  var items = [];
  items.push({ label: 'Ver detalhes', fn: (function(mm) { return function() {
    abrirDetalhes(mm.Medicamento || '(sem nome)', [
      { title: 'SOLICITAÇÃO', fields: [
        ['Tipo',        mm.Tipo],
        ['Status',      mm.Status],
        ['Atendente',   mm.Atendente],
        ['Previsão',    fmtData(mm.Previsao_Entrega)],
        ['Recebimento', mm.Forma_Recebimento],
        ['Observação',  mm.Observacao_Solicitacao],
      ]},
      { title: 'CLIENTE', fields: [
        ['Nome',     mm.Cliente],
        ['Telefone', mm.Telefone],
        ['Pré-pago', mm.Pre_Pago ? 'Sim' : null],
      ]},
      { title: 'COMPRA', fields: [
        ['Fornecedor',    mm.Fornecedor_Compra && mm.Fornecedor_Compra !== 'Não informado' ? mm.Fornecedor_Compra : null],
        ['Código compra', mm.Codigo_Compra_Fornecedor],
        ['Preço',         mm.Preco_Venda ? 'R$ ' + mm.Preco_Venda : null],
        ['WhatsApp',      mm.Status_Aviso_WhatsApp || 'Não registrado'],
      ]},
      { title: 'ÚLTIMA AÇÃO', fields: [
        ['Por', mm.Ultima_Acao_Por],
        ['Em',  mm.Ultima_Acao_Em ? fmt(mm.Ultima_Acao_Em) : null],
      ]},
    ]);
  }; })(m) });
  if (s === 'Pendente') {
    items.push({ label: 'Marcar como comprado', fn: function() { acaoMed('comprar', m.ID); } });
    items.push({ label: 'Cancelar solicitação', fn: function() { abrirCancelarMed(m.ID, m.Medicamento, m.Cliente); } });
  }
  if (s === 'Comprado') {
    items.push({ label: 'Marcar como entregue', fn: function() { acaoMed('entregar', m.ID); } });
    items.push({ label: 'Reverter para Pendente', fn: function() { acaoMed('reverter', m.ID); } });
    if (m.Telefone) items.push({ label: 'Enviar WhatsApp', fn: function() { acaoWhatsApp(m.ID); } });
  }
  items.push({ label: 'Editar', fn: (function(mid) { return function() { editarItem(mid, 'Medicamentos'); }; })(m.ID) });
  items.push({ label: 'Ver trilha de auditoria', fn: function() { abrirAuditDrawer(m.ID, m.Medicamento); } });
  items.push({ label: 'Copiar informações', fn: (function(mm) { return function() {
    copiarInfo([
      'Medicamento: ' + (mm.Medicamento || ''),
      'Tipo: ' + (mm.Tipo || ''),
      'Status: ' + (mm.Status || ''),
      mm.Cliente    ? 'Cliente: '   + mm.Cliente    : null,
      mm.Telefone   ? 'Telefone: '  + mm.Telefone   : null,
      mm.Atendente  ? 'Atendente: ' + mm.Atendente  : null,
      mm.Previsao_Entrega ? 'Previsão: ' + fmtData(mm.Previsao_Entrega) : null,
      mm.Preco_Venda ? 'Preço: R$ ' + mm.Preco_Venda : null,
    ]);
  }; })(m) });
  return items;
}

function botoesAcoesCard(m) {
  var s = m.Status; var btns = [];
  if (s === 'Pendente') {
    btns.push({ label: 'Marcar comprado', cls: 'btn-queue-primary', fn: function() { acaoMed('comprar', m.ID); } });
    btns.push({ label: 'Cancelar', cls: 'btn-queue-light', fn: function() { abrirCancelarMed(m.ID, m.Medicamento, m.Cliente); } });
  }
  if (s === 'Comprado') {
    btns.push({ label: 'Marcar entregue', cls: 'btn-queue-primary', fn: function() { acaoMed('entregar', m.ID); } });
    if (m.Telefone) btns.push({ label: 'WhatsApp', cls: 'whatsapp', fn: function() { acaoWhatsApp(m.ID); } });
    btns.push({ label: 'Reverter', cls: 'btn-queue-light', fn: function() { acaoMed('reverter', m.ID); } });
  }
  btns.push({ label: 'Auditoria', cls: 'btn-queue-secondary', fn: function() { abrirAuditDrawer(m.ID, m.Medicamento); } });
  return btns;
}

function renderGrupoMed(g) {
  // Pedido multi-item: primeiro card do grupo tem tabela dos itens
  var primeiro = g.itens[0];
  var c = buildCard(stripeForMed(primeiro));

  var badgesHtml = '<span class="qk-type-tag">MEDICAMENTOS</span>' +
    ' <span class="badge-pedido-count">Pedido · ' + g.itens.length + ' itens</span>' +
    ' <span class="badge ' + statusBadgeCls(primeiro.Status) + '">' + escHtml(primeiro.Status || '') + '</span>';

  c.main.appendChild(buildTop(badgesHtml, fmt(primeiro.Ultima_Acao_Em), []));

  var tbl = ce('table', 'grp-items-table');
  tbl.innerHTML = '<thead><tr>' +
    '<th>Medicamento</th><th>Qtd</th><th>Obs.</th><th></th>' +
    '</tr></thead>';
  var tbody = ce('tbody');
  g.itens.forEach(function(m) {
    var tr = document.createElement('tr');
    var actionsBtns = [];
    if (m.Status === 'Pendente') actionsBtns.push('<button type="button" class="btn-queue-primary" style="font-size:10px;padding:3px 8px;">Comprado</button>');
    if (m.Status === 'Comprado') actionsBtns.push('<button type="button" class="btn-queue-primary" style="font-size:10px;padding:3px 8px;">Entregue</button>');
    tr.innerHTML = '<td class="grp-item-name">' + escHtml(m.Medicamento || '') + '</td>' +
      '<td class="grp-item-qty">' + escHtml(m.Quantidade_Item || '1') + '</td>' +
      '<td>' + escHtml(m.Observacao_Item || '') + '</td>' +
      '<td class="grp-item-actions">' + actionsBtns.join('') + '</td>';

    var compBtn = tr.querySelector('.btn-queue-primary');
    if (compBtn) compBtn.addEventListener('click', (function(id, st) {
      return function() { acaoMed(st === 'Pendente' ? 'comprar' : 'entregar', id); };
    })(m.ID, m.Status));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  c.main.appendChild(tbl);

  c.main.appendChild(buildMeta([
    ['CLIENTE',    primeiro.Cliente],
    ['TELEFONE',   primeiro.Telefone],
    ['ATENDENTE',  primeiro.Atendente],
    ['PREVISÃO',   fmtData(primeiro.Previsao_Entrega)],
  ]));
  return c.card;
}

export async function acaoMed(acao, id) {
  var rpcMap = { comprar:'handover_medicamento_comprar', entregar:'handover_medicamento_entregar',
                 reverter:'handover_medicamento_reverter', cancelar:'handover_medicamento_cancelar' };
  var motivo;
  if (acao === 'reverter') {
    motivo = window.prompt('Motivo da reversão:');
    if (motivo === null) return;
  }
  var params = { p_token: G.token, p_id: id };
  if (motivo !== undefined) params.p_motivo = motivo;
  var res = await db.rpc(rpcMap[acao], params);
  if (rpcError(res)) return;
  if (res.error) { toast('Erro: ' + (res.error.message || acao), 'erro'); return; }
  var msgs = { comprar:'Comprado.', entregar:'Entregue.', reverter:'Revertido.', cancelar:'Cancelado.' };
  toast(msgs[acao] || 'Atualizado.', 'ok'); markLastAction(msgs[acao]); carregarBundle();
}

export async function acaoWhatsApp(id) {
  var meds = (G.bundle && G.bundle.medicamentos) || [];
  for (var _i = 0; _i < meds.length; _i++) {
    if (meds[_i].ID === id && meds[_i].Telefone) {
      var digits = String(meds[_i].Telefone).replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        toast('Telefone inválido para WhatsApp (' + digits.length + ' dígitos). Verifique o cadastro.', 'erro');
        return;
      }
      break;
    }
  }
  var res = await db.rpc('handover_medicamento_whatsapp', { p_token: G.token, p_id: id });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro WhatsApp.', 'erro'); return; }
  var d = res.data || {};
  if (d.whatsAppUrl) window.open(d.whatsAppUrl, '_blank', 'noopener');
  toast('Link WhatsApp gerado.', 'ok'); markLastAction('WhatsApp'); carregarBundle();
}

/* ── MODAL CANCELAR MEDICAMENTO ── */
function abrirCancelarMed(id, nomeMed, nomeCliente) {
  G.medCancelId = id;
  el('med-cancel-summary-med').textContent = nomeMed || '';
  var cliWrap = el('med-cancel-summary-cli-wrap');
  if (nomeCliente) { el('med-cancel-summary-cli').textContent = 'Cliente: ' + nomeCliente; cliWrap.classList.remove('hidden'); }
  else cliWrap.classList.add('hidden');
  el('med-cancel-motivo').value = '';
  el('med-cancel-overlay').classList.remove('hidden');
  el('med-cancel-overlay').setAttribute('aria-hidden', 'false');
}
export function closeCancelMedicationModal_() {
  G.medCancelId = null;
  el('med-cancel-overlay').classList.add('hidden');
  el('med-cancel-overlay').setAttribute('aria-hidden', 'true');
}
export async function confirmCancelMedicationModal_() {
  if (!G.medCancelId) return;
  var motivo = el('med-cancel-motivo').value.trim();
  if (!motivo) { el('med-cancel-motivo').focus(); return; }
  var res = await db.rpc('handover_medicamento_cancelar', { p_token: G.token, p_id: G.medCancelId, p_motivo: motivo });
  closeCancelMedicationModal_();
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao cancelar.', 'erro'); return; }
  toast('Cancelado.', 'ok'); markLastAction('Cancelado'); carregarBundle();
}
