/* Handover v2 — construtores de card da fila e helpers de filtro/lista. */
import { el, ce, escHtml } from './utils.js';

/* ── FILTER CHIPS HELPER ── */
export function filterChip(nsAttr, val, label, count, current) {
  var active = val === current ? ' active' : '';
  var badge  = count !== undefined
    ? '<span class="filter-count-badge">' + count + '</span>'
    : '';
  return '<button type="button" class="ho-filter' + active + '" data-' + nsAttr + '="' + val + '">' +
    escHtml(label) + badge + '</button>';
}

/* ── CARD BUILDER (qk-card-shell structure) ── */
export function buildCard(stripeClass, extraCardClass) {
  var card  = ce('div', 'queue-card' + (extraCardClass ? ' ' + extraCardClass : ''));
  var shell = ce('div', 'qk-card-shell');
  var stripe = ce('div', 'qk-stripe ' + stripeClass);
  var main  = ce('div', 'qk-card-main');
  shell.appendChild(stripe);
  shell.appendChild(main);
  card.appendChild(shell);
  return { card: card, main: main };
}

export function buildTop(badges, timeStr, moreItems) {
  var top = ce('div', 'qk-top');
  var badgesEl = ce('div', 'qk-badges', badges);
  var right = ce('div', 'qk-top-right');
  right.appendChild(ce('span', 'qk-time', escHtml(timeStr || '')));
  if (moreItems && moreItems.length) {
    var more = buildMoreMenu(moreItems);
    right.appendChild(more);
  }
  top.appendChild(badgesEl);
  top.appendChild(right);
  return top;
}

export function buildMoreMenu(items) {
  var wrap = ce('div', 'card-more');
  var btn  = ce('button', 'card-more-btn btn-queue-light');
  btn.type = 'button'; btn.textContent = '···';
  var menu = ce('div', 'card-more-menu hidden');
  items.forEach(function(item) {
    var b = ce('button');
    b.type = 'button';
    if (item.disabled) b.disabled = true;
    b.innerHTML = '<span class="card-menu-ico">' + (item.ico || '') + '</span>' + escHtml(item.label);
    b.addEventListener('click', function() { menu.classList.add('hidden'); item.fn(); });
    menu.appendChild(b);
  });
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });
  document.addEventListener('click', function() { menu.classList.add('hidden'); }, { once: true });
  wrap.appendChild(btn); wrap.appendChild(menu);
  return wrap;
}

export function buildMeta(fields) {
  var dl = ce('dl', 'qk-meta');
  fields.forEach(function(f) {
    if (!f[1] && f[1] !== false) return;
    var row = ce('div', 'qk-meta-row');
    row.innerHTML = '<dt>' + escHtml(f[0]) + '</dt><dd>' + escHtml(String(f[1])) + '</dd>';
    dl.appendChild(row);
  });
  return dl;
}

export function buildActions(btns) {
  var div = ce('div', 'qk-actions');
  btns.forEach(function(b) {
    var btn = ce('button', b.cls || 'btn-queue-secondary');
    btn.type = 'button'; btn.textContent = b.label;
    if (b.fn) btn.addEventListener('click', b.fn);
    div.appendChild(btn);
  });
  return div;
}

/* ── HELPERS DE LISTA ── */
export function renderQueueList(items, cardFn) {
  var ql = el('queue-list'); ql.innerHTML = '';
  var qe = el('queue-empty');
  if (!items || !items.length) { qe.classList.remove('hidden'); return; }
  qe.classList.add('hidden');
  items.forEach(function(item) { ql.appendChild(cardFn(item)); });
}
