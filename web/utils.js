/* Handover v2 — helpers puros de DOM/formatação. Módulo folha (sem imports). */

export function el(id) { return document.getElementById(id); }

export function ce(tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

export function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function fmt(ts) {
  if (!ts) return '';
  try { return new Date(ts).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }); } catch(e) { return ts; }
}

export function fmtHora(ts) {
  if (!ts) return '';
  try { return new Date(ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', timeZone:'America/Sao_Paulo' }); } catch(e) { return ''; }
}

export function fmtData(d) {
  if (!d) return '';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch(e) { return d; }
}

export function nowHHMM() {
  return new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', timeZone:'America/Sao_Paulo' });
}

export function turnoDefault() {
  // Manhã: 05:00–17:59  |  Noite: 18:00–04:59
  // Cobre turnos que começam cedo (abertura ~7h) até o fim do turno tarde (~17h)
  var h = parseInt(new Date().toLocaleString('pt-BR', { hour:'numeric', hour12:false, timeZone:'America/Sao_Paulo' }), 10);
  return (h >= 5 && h < 18) ? 'Manhã' : 'Noite';
}

export function isVencido(dateStr) {
  if (!dateStr) return false;
  var d = new Date(dateStr + 'T23:59:59');
  return d < new Date();
}

export function isHoje(dateStr) {
  if (!dateStr) return false;
  var hoje = new Date().toLocaleDateString('pt-BR');
  try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR') === hoje; } catch(e) { return false; }
}

/* ── toast ── */
export function toast(msg, tipo) {
  var r = el('toast-root');
  var t = ce('div', 'toast' + (tipo === 'erro' ? ' toast-erro' : tipo === 'ok' ? ' toast-ok' : ''));
  t.textContent = msg;
  r.appendChild(t);
  setTimeout(function() { t.remove(); }, 2800);
}

export function markLastSync() { el('last-sync-label').textContent = nowHHMM(); }
export function markLastAction(label) { el('last-action-label').textContent = label || nowHHMM(); }

export function copiarInfo(linhas) {
  var txt = linhas.filter(Boolean).join('\n');
  navigator.clipboard.writeText(txt)
    .then(function() { toast('Copiado.', 'ok'); })
    .catch(function() { toast('Erro ao copiar.', 'erro'); });
}
