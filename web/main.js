/* Handover v2 — ENTRADA. Fiação de eventos + boot.
   Único módulo com efeitos colaterais no top-level. */
import { G } from './state.js';
import { el } from './utils.js';
import { setOnSessionExpired } from './api.js';
import { doLogin, doLogout } from './auth.js';
import { setupRegistroListeners } from './registro.js';
import { setMainTab, refreshDashboardNow_, abrirApp } from './dashboard.js';
import {
  openFormModal, closeFormModal_, onFormSubmit, onTipoChange_,
  addItemRow_, addReposicaoItemRow_, setPrevisaoOffsetDays, setReposicaoPrevisaoOffsetDays_,
  openNovoRegistroPendencia_, openNovoRegistroEncomenda_, openNovoRegistroCompraReposicao_
} from './forms.js';
import { renderPendencias } from './pendencias.js';
import { renderMedicamentos, closeCancelMedicationModal_, confirmCancelMedicationModal_ } from './medicamentos.js';
import { renderCompras } from './compras.js';
import { closeCardDetailOverlay_ } from './detalhes.js';
import { closeAuditDrawer_, copyAuditTrailToClipboard_ } from './auditoria.js';
import { cancelReopenHistoricoModal_, confirmReopenHistoricoModal_ } from './historico.js';
import {
  onChecklistTurnoChange_, toggleChecklistPanel, setChecklistFilter
} from './checklist.js';

// api.js desloga via callback injetado (evita ciclo api → domínio)
setOnSessionExpired(doLogout);

/* ── DROPDOWN ── */
function toggleDropdown() {
  var menu = el('novo-registro-menu');
  var open = !menu.classList.contains('hidden');
  menu.classList.toggle('hidden', open);
  el('novo-registro-trigger').setAttribute('aria-expanded', String(!open));
}
document.addEventListener('click', function(e) {
  var root = el('novo-registro-dropdown');
  if (root && !root.contains(e.target)) {
    el('novo-registro-menu').classList.add('hidden');
    el('novo-registro-trigger').setAttribute('aria-expanded', 'false');
  }
});

/* ── EVENTOS ── */
el('handover-login-submit').addEventListener('click', doLogin);
el('handover-login-pin').addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
el('handover-login-usuario').addEventListener('keydown', function(e) { if (e.key === 'Enter') el('handover-login-pin').focus(); });
el('handover-logout-btn').addEventListener('click', doLogout);
el('novo-registro-trigger').addEventListener('click', function(e) { e.stopPropagation(); toggleDropdown(); });
el('form-modal-close').addEventListener('click', closeFormModal_);
el('form-modal-cancel').addEventListener('click', closeFormModal_);
el('request-form').addEventListener('submit', onFormSubmit);
el('tipo').addEventListener('change', onTipoChange_);
el('fornecedorCompra').addEventListener('change', function() {
  var fn = this.value;
  el('med-codigo-compra-field').classList.toggle('hidden', fn !== 'Panpharma' && fn !== 'Santa Cruz');
});
el('geral-tem-vencimento').addEventListener('change', function() {
  el('geral-vencimento-fields').classList.toggle('hidden', !this.checked);
});
el('med-queue-search').addEventListener('input', function() {
  G.medSearch = this.value;
  if (G.currentTab === 'medicamentos')           renderMedicamentos();
  else if (G.currentTab === 'pendencias')        renderPendencias();
  else if (G.currentTab === 'compras_reposicao') renderCompras();
});
el('form-modal-overlay').addEventListener('click', function(e) { if (e.target === el('form-modal-overlay')) closeFormModal_(); });
el('card-detail-overlay').addEventListener('click', function(e) { if (e.target === el('card-detail-overlay')) closeCardDetailOverlay_(); });

document.querySelectorAll('.main-tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var tab = btn.getAttribute('data-main-tab');
    if (tab === 'historico') G.historico = null;
    if (tab === 'comprador') G.compradorCache = null;
    G.medSearch = '';
    setMainTab(tab);
  });
});

// Rail items (new left-nav layout)
document.querySelectorAll('.ho-rail-item').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var tab = btn.getAttribute('data-main-tab');
    if (!tab) return;
    if (tab === 'historico') G.historico = null;
    if (tab === 'comprador') G.compradorCache = null;
    G.medSearch = '';
    setMainTab(tab);
  });
});

// ── Handlers inline do HTML → addEventListener (CSP bloqueia onclick/onchange inline)
function on(id, evt, fn) { var e = el(id); if (e) e.addEventListener(evt, fn); }

on('refresh-dashboard-btn',   'click',  refreshDashboardNow_);
on('checklist-turno-select',  'change', function() { onChecklistTurnoChange_(this.value); });
on('checklist-toggle-btn',    'click',  toggleChecklistPanel);

// Filtros do checklist
document.querySelectorAll('[data-check-filter]').forEach(function(b) {
  b.addEventListener('click', function() { setChecklistFilter(b.getAttribute('data-check-filter')); });
});

// Dropdown "Novo registro"
(function() {
  var items = el('novo-registro-menu') && el('novo-registro-menu').querySelectorAll('.ho-dd-item, .dropdown-dd-item');
  if (!items || !items.length) return;
  var fns = [openNovoRegistroPendencia_, openNovoRegistroEncomenda_, openNovoRegistroCompraReposicao_];
  items.forEach(function(b, i) { if (fns[i]) b.addEventListener('click', fns[i]); });
})();

// Atalhos de data — event delegation no form-grid
el('request-form').addEventListener('click', function(e) {
  var t = e.target;
  if (!t.classList.contains('light')) return;
  var days = t.getAttribute('data-days');
  if (days === null) return;
  var n = Number(days);
  var field = t.closest('#med-encomenda-only') ? 'previsaoEntrega' :
              t.closest('#reposicao-fields')   ? 'reposicao-previsao' : null;
  if (field === 'previsaoEntrega') setPrevisaoOffsetDays(n);
  else if (field === 'reposicao-previsao') setReposicaoPrevisaoOffsetDays_(n);
});

// + Adicionar item (medicamentos)
var addMedBtn = el('request-form') && el('request-form').querySelector('.itens-add-btn[data-tipo="med"]');
if (!addMedBtn) {
  var allAddBtns = el('request-form') && el('request-form').querySelectorAll('.itens-add-btn');
  if (allAddBtns && allAddBtns[0]) allAddBtns[0].addEventListener('click', addItemRow_);
  if (allAddBtns && allAddBtns[1]) allAddBtns[1].addEventListener('click', addReposicaoItemRow_);
}

// Audit drawer
on('audit-drawer-overlay', 'click', function(e) { if (e.target === el('audit-drawer-overlay')) closeAuditDrawer_(); });
(function() {
  var d = el('audit-drawer'); if (!d) return;
  var back = d.querySelector('.audit-drawer-back');       if (back) back.addEventListener('click', closeAuditDrawer_);
  var xBtn = d.querySelector('header .modal-icon-btn');   if (xBtn) xBtn.addEventListener('click', closeAuditDrawer_);
  var copy = d.querySelector('.btn-queue-secondary');     if (copy) copy.addEventListener('click', copyAuditTrailToClipboard_);
  var close= d.querySelector('.audit-drawer-foot .btn-queue-primary'); if (close) close.addEventListener('click', closeAuditDrawer_);
})();

// Modal cancelar medicamento
(function() {
  var ov = el('med-cancel-overlay'); if (!ov) return;
  var btns = ov.querySelectorAll('button');
  if (btns[0]) btns[0].addEventListener('click', closeCancelMedicationModal_);
  if (btns[1]) btns[1].addEventListener('click', confirmCancelMedicationModal_);
})();

// Modal reabrir histórico
(function() {
  var ov = el('reopen-confirm-overlay'); if (!ov) return;
  var btns = ov.querySelectorAll('button');
  if (btns[0]) btns[0].addEventListener('click', cancelReopenHistoricoModal_);
  if (btns[1]) btns[1].addEventListener('click', confirmReopenHistoricoModal_);
})();

// Card detail overlay fechar
(function() {
  var ov = el('card-detail-overlay'); if (!ov) return;
  var btns = ov.querySelectorAll('button');
  btns.forEach(function(b) { b.addEventListener('click', closeCardDetailOverlay_); });
})();

// Primeiro acesso (registro via convite)
setupRegistroListeners();

/* ── THEME TOGGLE ── */
(function() {
  var savedTheme = localStorage.getItem('ho-theme') || '';
  if (savedTheme === 'night') {
    document.documentElement.classList.add('night');
    document.body.classList.add('night');
    var shell = el('app-shell'); if (shell) shell.classList.add('night');
  }
  on('ho-theme-toggle', 'click', function() {
    var isNight = document.body.classList.toggle('night');
    document.documentElement.classList.toggle('night', isNight);
    var s = el('app-shell'); if (s) s.classList.toggle('night', isNight);
    var login = el('handover-login-overlay'); if (login) login.classList.toggle('night', isNight);
    localStorage.setItem('ho-theme', isNight ? 'night' : '');
  });
})();

/* ── DOT MATRIX CANVAS ── */
(function() {
  var canvas = el('ho-dot-matrix');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var raf;
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var isDark = document.body.classList.contains('night');
    var dotColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.035)';
    var spacing = 22;
    ctx.fillStyle = dotColor;
    for (var x = spacing; x < canvas.width; x += spacing) {
      for (var y = spacing; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  resize();
  draw();
  window.addEventListener('resize', function() { resize(); draw(); });
  // Redraw when theme changes
  var themeBtn = el('ho-theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', function() { setTimeout(draw, 20); });
})();

/* ── BOOT ── */
if (G.token && G.sessao) { abrirApp(); }
