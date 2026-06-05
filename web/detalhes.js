/* Handover v2 — overlay de detalhe de card. */
import { el, escHtml } from './utils.js';

export function closeCardDetailOverlay_() {
  el('card-detail-overlay').classList.add('hidden');
  el('card-detail-overlay').setAttribute('aria-hidden', 'true');
}

// sections: [{ title: 'SEÇÃO', fields: [['Label', valor], ...] }]
export function abrirDetalhes(titulo, sections) {
  el('card-detail-title').textContent = titulo;
  var html = '';
  sections.forEach(function(sec) {
    if (!sec) return;
    var visibleFields = (sec.fields || []).filter(function(f) { return f[1] || f[1] === false; });
    if (!visibleFields.length) return;
    html += '<div class="detail-section">';
    if (sec.title) html += '<div class="detail-section-title">' + escHtml(sec.title) + '</div>';
    html += '<dl class="detail-dl">';
    visibleFields.forEach(function(f) {
      html += '<div class="detail-row"><dt>' + escHtml(f[0]) + '</dt><dd>' + escHtml(String(f[1])) + '</dd></div>';
    });
    html += '</dl></div>';
  });
  el('card-detail-body').innerHTML = html || '<p class="ho-muted">Sem informações.</p>';
  el('card-detail-overlay').classList.remove('hidden');
  el('card-detail-overlay').setAttribute('aria-hidden', 'false');
}
