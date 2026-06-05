/* Handover v2 — aba Comprador (F4): lista de compras. */
import { G } from './state.js';
import { db, rpcError } from './api.js';
import { el, ce, escHtml, fmt, fmtData, toast, markLastAction } from './utils.js';
import { filterChip, buildCard, buildTop, buildMeta, buildActions } from './cards.js';
import { carregarBundle } from './dashboard.js';

export async function renderComprador() {
  el('queue-section-heading').textContent = 'Lista de compras';
  el('queue-subtitle').textContent = 'Carregando…';
  var ql = el('queue-list'); ql.innerHTML = '';
  el('queue-empty').classList.add('hidden');

  // Buscar dados apenas se não há cache
  if (!G.compradorCache) {
    var res = await db.rpc('handover_compras_listar', { p_token: G.token });
    if (rpcError(res)) return;
    if (res.error) { el('queue-subtitle').textContent = 'Erro ao carregar.'; return; }
    var d = res.data || {};
    G.compradorCache = { meds: d.medicamentos || [], comp: d.comprasReposicao || [] };
  }

  var meds = G.compradorCache.meds;
  var comp = G.compradorCache.comp;
  var f    = G.compradorFilter;

  // Contagens para os chips
  var cTodos     = meds.length + comp.length;
  var cEncomenda = meds.filter(function(m) { return m.Tipo === 'Encomenda'; }).length;
  var cFalta     = meds.filter(function(m) { return m.Tipo === 'Falta'; }).length;
  var cReposicao = comp.length;

  el('tab-badge-comprador').textContent = cTodos;

  // Renderizar filtros
  el('queue-filters-host').innerHTML =
    '<div class="filter-group">' +
    filterChip('compf', 'todos',     'Todos',      cTodos,     f) +
    filterChip('compf', 'Encomenda', 'Encomendas', cEncomenda, f) +
    filterChip('compf', 'Falta',     'Faltas',      cFalta,    f) +
    filterChip('compf', 'reposicao', 'Reposição',  cReposicao, f) +
    '</div>';

  el('queue-filters-host').querySelectorAll('[data-compf]').forEach(function(b) {
    b.addEventListener('click', function() {
      G.compradorFilter = b.getAttribute('data-compf');
      renderCompradorLista();
    });
  });

  renderCompradorLista();
}

function renderCompradorLista() {
  var meds = (G.compradorCache && G.compradorCache.meds) || [];
  var comp = (G.compradorCache && G.compradorCache.comp) || [];
  var f    = G.compradorFilter;

  // Atualizar chip ativo
  el('queue-filters-host').querySelectorAll('[data-compf]').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-compf') === f);
  });

  // Aplicar filtro
  var medsView = f === 'reposicao' ? [] :
                 f === 'Encomenda' ? meds.filter(function(m) { return m.Tipo === 'Encomenda'; }) :
                 f === 'Falta'     ? meds.filter(function(m) { return m.Tipo === 'Falta'; }) :
                 meds;
  var compView = f === 'Encomenda' || f === 'Falta' ? [] : comp;

  var total = medsView.length + compView.length;
  el('queue-subtitle').textContent = 'Comprador · ' + total + ' item(s)';

  var ql = el('queue-list'); ql.innerHTML = '';
  if (!total) { el('queue-empty').classList.remove('hidden'); return; }
  el('queue-empty').classList.add('hidden');

  if (medsView.length) {
    var h1 = ce('div', 'qk-section-heading');
    h1.textContent = f === 'Falta' ? 'Faltas' : f === 'Encomenda' ? 'Encomendas' : 'Encomendas / Faltas';
    ql.appendChild(h1);
    var grupos = [], pedMap = {};
    medsView.forEach(function(m) {
      var pid = m.Pedido_ID;
      if (pid && m.Total_Itens > 1) {
        if (!pedMap[pid]) { pedMap[pid] = []; grupos.push({ tipo: 'pedido', itens: pedMap[pid] }); }
        pedMap[pid].push(m);
      } else {
        grupos.push({ tipo: 'single', item: m });
      }
    });
    grupos.forEach(function(g) {
      ql.appendChild(g.tipo === 'single' ? renderCardCompradorMed(g.item) : renderGrupoCompradorMed(g));
    });
  }
  if (compView.length) {
    var h2 = ce('div', 'qk-section-heading'); h2.textContent = 'Compras e reposição'; ql.appendChild(h2);
    compView.forEach(function(r) { ql.appendChild(renderCardCompradorReposicao(r)); });
  }
}

function renderCardCompradorMed(m) {
  var c = buildCard('qk-stripe-med');
  var badgesHtml = '<span class="qk-type-tag">COMPRADOR</span>' +
    ' <span class="badge">' + escHtml(m.Tipo || '') + '</span>' +
    ' <span class="badge status-pendente">A comprar</span>';
  if (m.Pre_Pago) badgesHtml += ' <span class="badge">Pré-pago</span>';
  var menuItems = [
    { label: 'Comprado',
      fn: (function(mid) { return function() { compradorMarcarMed(mid, 'Comprado'); }; })(m.ID) },
    { label: 'Não encontrado',
      fn: (function(mid) { return function() { compradorMarcarMed(mid, 'Não encontrado'); }; })(m.ID) },
  ];
  c.main.appendChild(buildTop(badgesHtml, fmt(m.Ultima_Acao_Em || m.Timestamp), menuItems));
  c.main.appendChild(ce('div', 'qk-title', escHtml(m.Medicamento || '(sem nome)')));
  c.main.appendChild(buildMeta([
    ['CLIENTE',   m.Cliente],
    ['TELEFONE',  m.Telefone],
    ['ATENDENTE', m.Atendente],
    ['PREVISÃO',  fmtData(m.Previsao_Entrega)],
    ['PREÇO',     m.Preco_Venda ? 'R$ ' + m.Preco_Venda : null],
  ]));
  c.main.appendChild(buildActions([
    { label: 'Comprado', cls: 'btn-queue-primary',
      fn: (function(mid) { return function() { compradorMarcarMed(mid, 'Comprado'); }; })(m.ID) },
    { label: 'Não encontrado', cls: 'btn-queue-light',
      fn: (function(mid) { return function() { compradorMarcarMed(mid, 'Não encontrado'); }; })(m.ID) },
  ]));
  return c.card;
}

function renderGrupoCompradorMed(g) {
  var primeiro = g.itens[0];
  var c = buildCard('qk-stripe-med');
  var badgesHtml = '<span class="qk-type-tag">COMPRADOR</span>' +
    ' <span class="badge-pedido-count">Pedido · ' + g.itens.length + ' itens</span>' +
    ' <span class="badge status-pendente">A comprar</span>';
  c.main.appendChild(buildTop(badgesHtml, fmt(primeiro.Ultima_Acao_Em), []));
  var tbl = ce('table', 'grp-items-table');
  tbl.innerHTML = '<thead><tr><th>Medicamento</th><th>Qtd</th><th>Obs.</th><th></th></tr></thead>';
  var tbody = ce('tbody');
  g.itens.forEach(function(m) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td class="grp-item-name">' + escHtml(m.Medicamento || '') + '</td>' +
      '<td class="grp-item-qty">' + escHtml(m.Quantidade_Item || '1') + '</td>' +
      '<td>' + escHtml(m.Observacao_Item || '') + '</td>' +
      '<td class="grp-item-actions"><button type="button" class="btn-queue-primary" style="font-size:10px;padding:3px 8px;">Comprado</button></td>';
    tr.querySelector('.btn-queue-primary').addEventListener('click',
      (function(mid) { return function() { compradorMarcarMed(mid, 'Comprado'); }; })(m.ID));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody); c.main.appendChild(tbl);
  c.main.appendChild(buildMeta([
    ['CLIENTE',   primeiro.Cliente],
    ['TELEFONE',  primeiro.Telefone],
    ['ATENDENTE', primeiro.Atendente],
    ['PREVISÃO',  fmtData(primeiro.Previsao_Entrega)],
  ]));
  return c.card;
}

function renderCardCompradorReposicao(r) {
  var c = buildCard('qk-stripe-geral');
  var badgesHtml = '<span class="qk-type-tag">REPOSIÇÃO</span>' +
    ' <span class="badge">' + escHtml(r.Categoria_Compra || 'Reposição') + '</span>' +
    ' <span class="badge status-pendente">A comprar</span>';
  if (r.Prioridade === 'Urgente') badgesHtml += ' <span class="badge badge-urgente">Urgente</span>';
  c.main.appendChild(buildTop(badgesHtml, fmtData(r.Data_Solicitacao), []));
  c.main.appendChild(ce('div', 'qk-title', escHtml(r.Item || '(sem item)')));
  if (r.Motivo) c.main.appendChild(ce('div', 'qk-desc', escHtml(r.Motivo)));
  c.main.appendChild(buildMeta([
    ['QUANTIDADE',  r.Quantidade],
    ['PRIORIDADE',  r.Prioridade],
    ['SOLICITANTE', r.Solicitante],
    ['PREVISÃO',    fmtData(r.Previsao_Desejada)],
  ]));
  c.main.appendChild(buildActions([
    { label: 'Comprado', cls: 'btn-queue-primary',
      fn: (function(rid) { return function() { compradorComprarReposicao(rid); }; })(r.ID) },
    { label: 'Cancelar', cls: 'btn-queue-secondary',
      fn: (function(rid) { return function() { compradorCancelarReposicao(rid); }; })(r.ID) },
  ]));
  return c.card;
}

async function compradorMarcarMed(id, status) {
  var obs = '';
  if (status === 'Não encontrado') {
    var inp = window.prompt('Observação (opcional):');
    if (inp === null) return;
    obs = inp;
  }
  var res = await db.rpc('handover_compra_marcar', {
    p_token: G.token, p_origem: 'Medicamentos', p_id: id, p_status: status, p_obs: obs
  });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro: ' + (res.error.message || status), 'erro'); return; }
  toast(status + '.', 'ok'); markLastAction(); carregarBundle();
}

async function compradorComprarReposicao(id) {
  var res = await db.rpc('handover_compra_reposicao_comprar', { p_token: G.token, p_id: id });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao marcar.', 'erro'); return; }
  toast('Comprado.', 'ok'); markLastAction(); carregarBundle();
}

async function compradorCancelarReposicao(id) {
  var motivo = window.prompt('Motivo do cancelamento:');
  if (motivo === null) return;
  var res = await db.rpc('handover_compra_reposicao_cancelar', {
    p_token: G.token, p_id: id, p_motivo: motivo
  });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao cancelar.', 'erro'); return; }
  toast('Cancelado.', 'ok'); markLastAction(); carregarBundle();
}
