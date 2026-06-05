/* Handover v2 — HUB do ciclo: bundle, KPIs, abas, dispatch de fila, sidebar. */
import { G } from './state.js';
import { db, rpcError } from './api.js';
import { el, escHtml, toast, markLastSync, turnoDefault } from './utils.js';
import { icoClip_, icoAlert_, icoPill_, icoWA_, icoCheck_ } from './icons.js';
import { renderPendencias } from './pendencias.js';
import { renderMedicamentos } from './medicamentos.js';
import { renderCompras } from './compras.js';
import { renderComprador } from './comprador.js';
import { renderHistorico } from './historico.js';
import { renderChecklistPanel } from './checklist.js';

/* ── ABRIR APP ── */
export function abrirApp() {
  el('handover-login-overlay').classList.add('hidden');
  var shell = el('app-shell');
  shell.classList.remove('hidden'); shell.setAttribute('aria-hidden', 'false');
  var nome = G.sessao.nome || G.sessao.usuario;
  var initials = (nome || '?').charAt(0).toUpperCase();
  el('operador-atual').value = nome;
  el('operador-avatar-char').textContent = initials;
  if (el('operador-atual-rail')) el('operador-atual-rail').textContent = nome;
  el('autor').value = nome;
  el('checklist-turno-select').value = turnoDefault();
  var perfil = G.sessao.perfil || '';
  var tabComp = el('tab-comprador');
  if (tabComp) tabComp.classList.toggle('hidden', ['comprador','gerente','admin'].indexOf(perfil) < 0);
  if (G._autoRefreshTimer) clearInterval(G._autoRefreshTimer);
  G._autoRefreshTimer = setInterval(function() {
    if (G.token) carregarBundle();
  }, 300000);
  setMainTab('pendencias');
  carregarBundle();
}

/* ── BUNDLE ── */
export async function carregarBundle() {
  var turno = el('checklist-turno-select').value || turnoDefault();
  var res = await db.rpc('handover_dashboard_bundle', { p_token: G.token, p_turno: turno });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao carregar dados.', 'erro'); return; }
  G.bundle = res.data || {};
  // Normalizar pendências: _pendencia_to_json retorna PascalCase (ID, Urgencia, Resolvido…)
  // mas o código usa lowercase. Converter aqui uma vez para não mudar todo o render.
  if (Array.isArray(G.bundle.geral)) {
    G.bundle.geral = G.bundle.geral.map(function(p) {
      return {
        id:                  p.ID,
        resolvido:           p.Resolvido,
        urgencia:            p.Urgencia,
        titulo:              p.Titulo,
        descricao:           p.Descricao,
        autor:               p.Autor,
        criado_em:           p.Timestamp,
        data_vencimento:     p.Data_Vencimento,
        hora_vencimento:     p.Hora_Vencimento,
        tem_vencimento:      p.Tem_Vencimento,
        ultima_acao_por:     p.Ultima_Acao_Por,
        ultima_acao_em:      p.Ultima_Acao_Em,
        resolvido_por:       p.Resolvido_Por,
        data_resolucao:      p.Data_Resolucao,
        excluido:            p.Excluido,
        excluido_por:        p.Excluido_Por,
        excluido_por_perfil: p.Excluido_Por_Perfil,
        data_exclusao:       p.Data_Exclusao,
        motivo_exclusao:     p.Motivo_Exclusao,
        reaberto_de:         p.Reaberto_De,
      };
    });
  }
  G.compradorCache = null;  // invalidar cache do comprador ao atualizar bundle
  markLastSync();
  renderSummary();
  renderQueue();
  renderSidebar();
}
export function refreshDashboardNow_() { carregarBundle(); }

/* ── SUMMARY STRIP — KPIs ── */
export function renderSummary() {
  var b    = G.bundle || {};
  var ger  = b.geral || [];
  var meds = b.medicamentos || [];
  var comp = b.comprasReposicao || [];
  var cl   = b.checklistTurno;

  var pend  = ger.filter(function(r) { return !r.resolvido; }).length;
  var urg   = ger.filter(function(r) { return !r.resolvido && r.urgencia === 'Urgente'; }).length;
  // KPI Encomendas = só itens Pendente (aguardando compra), igual v1.
  var medAt = meds.filter(function(m) { return m.Status === 'Pendente'; }).length;
  var semAv = meds.filter(function(m) { return m.Status === 'Comprado' && m.Status_Aviso_WhatsApp !== 'Tentativa registrada'; }).length;
  var kVenc = meds.filter(function(m) { return m.Status === 'Pendente' && m.Data_Vencimento; }).length;
  var clPend = cl && cl.summary ? cl.summary.itensPendentes : 0;

  el('tab-badge-pendencias').textContent        = pend;
  el('tab-badge-medicamentos').textContent      = medAt;
  el('tab-badge-compras-reposicao').textContent = comp.length;
  el('tab-badge-checklist').textContent         = clPend;

  el('operation-summary').innerHTML = [
    hoKpiCell('kpi-pend',  false, pend,  'PENDÊNCIAS',         'Solicitações gerais',  'pendencias',   'pendentes',      false),
    hoKpiCell('kpi-urg',   true,  urg,   'URGENTES',           'Prioridade na loja',   'pendencias',   'urgentes',       urg > 0),
    hoKpiCell('kpi-enc',   false, medAt, 'ENCOMENDAS',         'Faltas e encomendas',  'medicamentos', 'pendentes',      false),
    hoKpiCell('kpi-wav',   false, semAv, 'COMPRADOS S/ AVISO', 'Avisar o cliente',     'medicamentos', 'comprados_sem_av', false),
    hoKpiCell('kpi-venc',  false, kVenc, 'VENCIDOS / HOJE',    'Cobrar ainda hoje',    'medicamentos', 'vencidos',       kVenc > 0),
    hoKpiCardChecklist(cl),
  ].join('');

  // Ligar click nos cells de navegação
  el('operation-summary').querySelectorAll('[data-kpi-tab]').forEach(function(cell) {
    cell.addEventListener('click', function() {
      var tab    = cell.getAttribute('data-kpi-tab');
      var filter = cell.getAttribute('data-kpi-filter');
      setMainTab(tab);
      if (filter) {
        if (tab === 'pendencias')   { G.pendFilter = filter; renderPendencias(); }
        if (tab === 'medicamentos') { G.medFilter  = filter; renderMedicamentos(); }
      }
    });
    cell.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cell.click(); }
    });
  });
}

function hoKpiCell(id, _unused, value, label, sub, tab, filter, alert) {
  var alertCls = alert ? ' alert' : '';
  var navAttrs = tab
    ? ' data-kpi-tab="' + tab + '"' + (filter ? ' data-kpi-filter="' + filter + '"' : '') + ' role="button" tabindex="0"'
    : '';
  return '<div class="ho-kcell' + alertCls + '"' + navAttrs + ' id="' + id + '">' +
    '<div class="ho-kpi">' +
      '<div class="ho-kpi-l">' + escHtml(label) + '</div>' +
      '<div class="ho-kpi-v">' + escHtml(String(value)) + '</div>' +
      '<div class="ho-kpi-s">' + escHtml(sub) + '</div>' +
    '</div>' +
  '</div>';
}

function hoKpiCardChecklist(cl) {
  var s = cl && cl.summary ? cl.summary : null;
  var turno  = (cl && cl.turno)             || '—';
  var total  = s ? s.totalItens             : 0;
  var pend   = s ? s.itensPendentes         : 0;
  var feitos = s ? s.itensFeitos            : 0;
  var na     = s ? s.itensNaoAplicaveis     : 0;
  var progr  = s ? s.percentualConcluido    : 0;
  return '<div class="ho-kcell" data-kpi-tab="checklist" role="button" tabindex="0">' +
    '<div class="ho-kpi">' +
      '<div class="ho-kpi-l">CHECKLIST · ' + escHtml(turno) + '</div>' +
      '<div class="ho-kpi-v">' + progr + '%</div>' +
      '<div class="ho-kpi-s" style="display:grid;grid-template-columns:1fr 1fr;gap:2px 8px;margin-top:6px;">' +
        '<span>' + total + ' itens</span>' +
        '<span>' + pend + ' pend.</span>' +
        '<span>' + feitos + ' feitos</span>' +
        '<span>' + na + ' N/A</span>' +
      '</div>' +
      '<div style="height:4px;border-radius:99px;background:var(--line-2);overflow:hidden;margin-top:8px;">' +
        '<div style="height:100%;width:' + progr + '%;background:var(--brand);border-radius:99px;transition:width .5s var(--ease-out);"></div>' +
      '</div>' +
    '</div>' +
  '</div>';
}
/* Keep old kpiCardChecklist name as alias for any callers */
var kpiCardChecklist = hoKpiCardChecklist;

/* ── TAB TITLES ── */
var _TAB_TITLES = {
  pendencias:        'Pendências',
  medicamentos:      'Encomendas',
  compras_reposicao: 'Compras e reposição',
  checklist:         'Checklist',
  historico:         'Histórico',
  comprador:         'Comprador',
};

/* ── ABAS ── */
export function setMainTab(tab) {
  G.currentTab = tab;
  // Update rail items (new layout uses .ho-rail-item)
  document.querySelectorAll('.ho-rail-item').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-main-tab') === tab);
  });
  // Also update legacy .main-tab if present
  document.querySelectorAll('.main-tab').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-main-tab') === tab);
  });
  // Update topbar title
  var titleEl = el('ho-topbar-title');
  if (titleEl) titleEl.textContent = _TAB_TITLES[tab] || tab;
  var isCL = (tab === 'checklist');
  el('panel-queue-wrap').classList.toggle('hidden', isCL);
  el('panel-checklist').classList.toggle('hidden', !isCL);
  if (isCL) renderChecklistPanel();
  else renderQueue();
}

/* ── QUEUE DISPATCH ── */
// Abas com busca por texto e o placeholder de cada uma
var _SEARCH_TABS = {
  medicamentos:      'Buscar por medicamento, cliente, telefone, atendente...',
  pendencias:        'Buscar por título, descrição, autor...',
  compras_reposicao: 'Buscar por item, categoria, solicitante, observação...'
};

export function renderQueue() {
  var ph = _SEARCH_TABS[G.currentTab];
  el('med-search-wrap').classList.toggle('hidden', !ph);
  if (ph) {
    var inp = el('med-queue-search');
    inp.setAttribute('placeholder', ph);
    inp.value = G.medSearch || '';
  }
  el('historico-filters-panel').classList.add('hidden');
  if (G.currentTab === 'pendencias')        renderPendencias();
  else if (G.currentTab === 'medicamentos') renderMedicamentos();
  else if (G.currentTab === 'compras_reposicao') renderCompras();
  else if (G.currentTab === 'historico')    renderHistorico();
  else if (G.currentTab === 'comprador')    renderComprador();
}

/* ── SIDEBAR ── */
export function renderSidebar() {
  // Sidebar removed in new design — no-op guard
  var cl = G.bundle && G.bundle.checklistTurno;
  var body = el('sidebar-checklist-body');
  if (!body) return; // sidebar element removed in new layout
  if (!cl || !cl.summary) { body.innerHTML = '<p class="ho-muted" style="font-size:12px;">Nenhum dado.</p>'; }
  else {
    var s = cl.summary;
    body.innerHTML =
      '<div class="sidebar-stat-grid">' +
      '<div><span class="header-pill-label">Turno</span><strong>' + escHtml(cl.turno || '') + '</strong></div>' +
      '<div><span class="header-pill-label">Total</span><strong>' + s.totalItens + '</strong></div>' +
      '<div><span class="header-pill-label">Pendentes</span><strong>' + s.itensPendentes + '</strong></div>' +
      '<div><span class="header-pill-label">Feitos</span><strong>' + s.itensFeitos + '</strong></div>' +
      '<div><span class="header-pill-label">N/A</span><strong>' + s.itensNaoAplicaveis + '</strong></div>' +
      '<div><span class="header-pill-label">Progresso</span><strong>' + s.percentualConcluido + '%</strong></div>' +
      '</div>' +
      '<div class="sidebar-progress"><span style="width:' + s.percentualConcluido + '%"></span></div>';
  }

  // Histórico
  var hbody = el('sidebar-historico-body');
  if (!hbody) return;
  if (!G.historico) {
    hbody.innerHTML = '<p class="ho-muted" style="font-size:12px;">Carrega sob demanda ao abrir a aba Histórico.</p>';
  } else {
    var list = G.historico.slice(0, 5);
    hbody.innerHTML = list.length
      ? '<div class="sidebar-hist-list">' + list.map(function(h) {
          return '<div class="sidebar-hist-item"><span class="sidebar-hist-label">' +
            escHtml(h.Titulo || h.Medicamento || h.Item || '—') + '</span>' +
            '<span class="sidebar-hist-sub">' + escHtml(h.Origem || '') + '</span></div>';
        }).join('') + '</div>'
      : '<p class="ho-muted" style="font-size:12px;">Sem registros.</p>';
  }
}
