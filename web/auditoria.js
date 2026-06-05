/* Handover v2 — drawer de trilha de auditoria. */
import { G } from './state.js';
import { el, escHtml, fmt, toast } from './utils.js';
import { db, rpcError } from './api.js';

var _auditAllData = [];
var _auditFilter  = 'todos';

export async function abrirAuditDrawer(id, titulo) {
  el('audit-drawer-title').textContent = 'Trilha de Auditoria';
  el('audit-drawer-inner').innerHTML = '<p class="ho-muted" style="padding:16px;">Carregando…</p>';
  el('audit-drawer-overlay').classList.remove('hidden');
  el('audit-drawer-overlay').setAttribute('aria-hidden', 'false');
  _auditFilter = 'todos';

  var res = await db.rpc('handover_audit_trail', { p_token: G.token, p_id: id });
  if (rpcError(res)) { closeAuditDrawer_(); return; }
  if (res.error) { el('audit-drawer-inner').innerHTML = '<p class="ho-muted" style="padding:16px;">Erro ao carregar.</p>'; return; }
  _auditAllData = (res.data && res.data.auditoria) || [];

  renderAuditDrawerContent(titulo);
}

function renderAuditDrawerContent(titulo) {
  var itens = _auditAllData;
  if (!itens.length) { el('audit-drawer-inner').innerHTML = '<p class="ho-muted" style="padding:16px;">Sem registros.</p>'; return; }

  // Calcular summary a partir dos eventos
  var primeiroEvt  = itens[itens.length - 1];
  var ultimoEvt    = itens[0];
  var criadoPor    = primeiroEvt.Nome || primeiroEvt.Usuario || '—';
  var ultimaAlter  = ultimoEvt.Nome || ultimoEvt.Usuario || '—';
  var ultimaAlterEm= fmt(ultimoEvt.Data_Hora);
  var totalEventos = itens.length;

  // Status atual = último evento com Acao contendo 'Status' ou campo Status, senão o campo status do resumo
  var statusEvt = itens.find(function(a) { return a.Campo === 'Status' || (a.Acao && a.Acao.toLowerCase().indexOf('status') >= 0); });
  var statusAtual = statusEvt ? (statusEvt.Valor_Novo || statusEvt.Resumo || '—') : '—';

  // Tipos únicos para filtros
  var tiposMap = { todos: itens.length };
  itens.forEach(function(a) {
    var tipo = auditTipo(a);
    tiposMap[tipo] = (tiposMap[tipo] || 0) + 1;
  });
  var filtros = ['todos', 'Criação', 'Edição', 'Status', 'Observações', 'WhatsApp', 'Erro'];

  // Filtrar
  var view = _auditFilter === 'todos' ? itens : itens.filter(function(a) { return auditTipo(a) === _auditFilter; });

  var html = '';

  // Header summary
  html += '<div class="audit-summary">';
  html +=   '<div class="audit-summary-title">' + escHtml(titulo || '—') + '</div>';
  html +=   '<div class="audit-summary-meta">Criado por: ' + escHtml(criadoPor) + '</div>';
  html +=   '<div class="audit-summary-meta">Última ação: ' + escHtml(ultimaAlter) + ' · ' + escHtml(ultimaAlterEm) + '</div>';
  html +=   '<dl class="audit-stats">';
  html +=     '<div><dt>CRIADO POR</dt><dd>' + escHtml(criadoPor) + '</dd></div>';
  html +=     '<div><dt>ÚLTIMA ALTERAÇÃO</dt><dd>' + escHtml(ultimaAlter) + ' · ' + escHtml(ultimaAlterEm) + '</dd></div>';
  html +=     '<div><dt>TOTAL DE EVENTOS</dt><dd>' + totalEventos + '</dd></div>';
  if (statusAtual !== '—') {
    html += '<div><dt>STATUS ATUAL</dt><dd>' + escHtml(statusAtual) + '</dd></div>';
  }
  html +=   '</dl>';
  html += '</div>';

  // Filtros tabs
  html += '<div class="audit-filter-tabs">';
  filtros.forEach(function(f) {
    var count = tiposMap[f] || 0;
    if (f !== 'todos' && !count) return;
    var active = f === _auditFilter ? ' active' : '';
    html += '<button type="button" class="audit-tab' + active + '" data-audit-f="' + escHtml(f) + '">' +
      escHtml(f === 'todos' ? 'Todos' : f) +
      (count ? '<span class="filter-count-badge">' + count + '</span>' : '') +
      '</button>';
  });
  html += '</div>';

  // Lista de eventos
  html += '<div class="audit-list">';
  if (!view.length) {
    html += '<p class="ho-muted" style="padding:16px 0;">Nenhum evento para este filtro.</p>';
  } else {
    view.forEach(function(a) {
      var tipo = auditTipo(a);
      html += '<div class="audit-entry">';
      html +=   '<div class="audit-entry-head">';
      html +=     '<span class="audit-entry-date">' + escHtml(fmt(a.Data_Hora)) + '</span>';
      html +=     '<span class="audit-tipo-tag audit-tipo-' + tipo.toLowerCase() + '">' + escHtml(tipo) + '</span>';
      html +=   '</div>';
      var acaoLabel = a.Nome ? (escHtml(a.Nome) + ' <span class="audit-acao-verb">' + escHtml(auditVerbo(a)) + '</span>') : escHtml(a.Acao || '');
      html += '<div class="audit-entry-title">' + acaoLabel + '</div>';
      if (a.Campo) {
        html += '<div class="audit-entry-change">' +
          '<span class="audit-campo">' + escHtml(a.Campo) + '</span>: ' +
          '<span class="audit-val-old">' + escHtml(a.Valor_Anterior || '—') + '</span>' +
          ' → <span class="audit-val-new">' + escHtml(a.Valor_Novo || '—') + '</span>' +
        '</div>';
      }
      if (a.Resumo) html += '<div class="audit-entry-resumo">' + escHtml(a.Resumo) + '</div>';
      html += '</div>';
    });
  }
  html += '</div>';

  el('audit-drawer-inner').innerHTML = html;
  el('audit-drawer-inner')._auditData = itens;

  // Ligar filtros
  el('audit-drawer-inner').querySelectorAll('[data-audit-f]').forEach(function(b) {
    b.addEventListener('click', function() {
      _auditFilter = b.getAttribute('data-audit-f');
      renderAuditDrawerContent(titulo);
    });
  });
}

function auditTipo(a) {
  var acao = (a.Acao || '').toLowerCase();
  if (acao.indexOf('cri') >= 0) return 'Criação';
  if (acao.indexOf('status') >= 0 || a.Campo === 'Status') return 'Status';
  if (acao.indexOf('whatsapp') >= 0 || acao.indexOf('whats') >= 0) return 'WhatsApp';
  if (acao.indexOf('obs') >= 0 || a.Campo === 'Observacao') return 'Observações';
  if (acao.indexOf('erro') >= 0) return 'Erro';
  if (a.Campo || acao.indexOf('edit') >= 0 || acao.indexOf('alter') >= 0) return 'Edição';
  return 'Edição';
}

function auditVerbo(a) {
  var acao = (a.Acao || '');
  if (a.Campo) return 'editou ' + a.Campo;
  return acao.replace(new RegExp('^' + (a.Nome || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '');
}

export function closeAuditDrawer_() {
  el('audit-drawer-overlay').classList.add('hidden');
  el('audit-drawer-overlay').setAttribute('aria-hidden', 'true');
}

export function onAuditDrawerOverlayClick_(e) { if (e.target === el('audit-drawer-overlay')) closeAuditDrawer_(); }

export function copyAuditTrailToClipboard_() {
  var d = el('audit-drawer-inner')._auditData;
  if (!d || !d.length) { toast('Nada para copiar.'); return; }
  var txt = d.map(function(a) { return [fmt(a.Data_Hora), a.Acao, a.Campo||'', a.Valor_Anterior||'', a.Valor_Novo||'', a.Nome||'', a.Resumo||''].join('\t'); }).join('\n');
  navigator.clipboard.writeText(txt).then(function() { toast('Copiado.', 'ok'); }).catch(function() { toast('Erro ao copiar.', 'erro'); });
}
