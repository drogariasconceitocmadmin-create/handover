/* Handover v2 — painel de Checklist do turno. */
import { G } from './state.js';
import { db, rpcError } from './api.js';
import { el, ce, escHtml, fmtHora, toast, turnoDefault } from './utils.js';
import { icoCheck_ } from './icons.js';
import { carregarBundle, renderSummary } from './dashboard.js';

export function renderChecklistPanel() {
  var cl = G.bundle && G.bundle.checklistTurno;
  if (!cl) {
    el('checklist-generate-hint').textContent = 'Clique em "Sincronizar checklist" para gerar.';
    el('checklist-content').classList.add('hidden');
    el('checklist-summary').innerHTML = '';
    return;
  }
  renderChecklistSummary(cl);
  el('checklist-toggle-btn').textContent = G.checklistOpen ? 'Fechar checklist' : 'Abrir checklist';
  el('checklist-content').classList.toggle('hidden', !G.checklistOpen);
  if (G.checklistOpen) renderChecklistCats(cl);
}

function renderChecklistSummary(cl) {
  var s = cl.summary || {};
  var chips = [
    'Turno: ' + (cl.turno || ''),
    'Data: ' + (cl.data || ''),
    'Itens: ' + (s.totalItens || 0),
    'Feitos: ' + (s.itensFeitos || 0),
    'Pendentes: ' + (s.itensPendentes || 0),
    'Concluído: ' + (s.percentualConcluido || 0) + '%',
  ];
  if (cl.isAfterDeadline) chips.push('⚠ Após horário limite');

  el('checklist-summary').innerHTML = chips.map(function(c) {
    var isAlert = c.indexOf('⚠') >= 0;
    return '<span class="checklist-chip' + (isAlert ? ' alert' : '') + '">' + escHtml(c) + '</span>';
  }).join('');

  var hint = '';
  if (s.itensPendentes === 0 && s.totalItens > 0) hint = 'Checklist de hoje já concluído.';
  else if (s.totalItens > 0) hint = s.itensPendentes + ' item(s) pendente(s).';
  el('checklist-generate-hint').textContent = hint;
}

function renderChecklistCats(cl) {
  var items = cl.items || [];
  var f = G.checklistFilter;
  var view = items.filter(function(it) {
    if (f === 'pendentes')   return it.Status === 'Pendente';
    if (f === 'feitos')      return it.Status === 'Feito';
    if (f === 'na')          return it.Status === 'Não aplicável';
    if (f === 'feitos_hoje') return it.Status === 'Feito';
    return true;
  });

  // Agrupar por Categoria
  var cats = [], catMap = {};
  view.forEach(function(it) {
    var c = it.Categoria || 'Geral';
    if (!catMap[c]) { catMap[c] = []; cats.push(c); }
    catMap[c].push(it);
  });

  var container = el('checklist-categories'); container.innerHTML = '';
  if (!cats.length) { container.innerHTML = '<div class="empty-box">Nenhum item para este filtro.</div>'; return; }

  cats.forEach(function(cat) {
    var catItems = catMap[cat];
    var feitos = catItems.filter(function(it) { return it.Status === 'Feito' || it.Status === 'Não aplicável'; }).length;
    var catId  = 'cl-cat-' + cat.replace(/\s+/g, '-');
    var isOpen = G.catOpen[catId] !== false; // default aberto

    var catDiv = ce('div', 'checklist-category');
    var head   = ce('button', 'checklist-category-head');
    head.type  = 'button';

    var nameSpan = ce('span', '', escHtml(cat));
    var metaSpan = ce('span', 'checklist-category-meta',
      feitos + '/' + catItems.length + ' feitos ' + (isOpen ? '▲' : '▶'));
    head.appendChild(nameSpan); head.appendChild(metaSpan);

    var itemsDiv = ce('div', 'checklist-items');
    if (!isOpen) itemsDiv.style.display = 'none';

    head.addEventListener('click', function() {
      G.catOpen[catId] = itemsDiv.style.display === 'none';
      itemsDiv.style.display = G.catOpen[catId] ? '' : 'none';
      metaSpan.textContent = feitos + '/' + catItems.length + ' feitos ' + (G.catOpen[catId] ? '▲' : '▶');
    });

    catItems.forEach(function(it) { itemsDiv.appendChild(buildCheckItem(it)); });
    catDiv.appendChild(head); catDiv.appendChild(itemsDiv);
    container.appendChild(catDiv);
  });
}

function buildCheckItem(it) {
  var div = ce('div', 'check-item' + (it.Status === 'Feito' ? ' feito' : ''));

  var title = ce('div', 'check-item-title');
  title.textContent = it.Item || '';
  if (it.Horario_Referencia) {
    var hr = ce('span', 'badge', escHtml(it.Horario_Referencia));
    title.appendChild(hr);
  }
  div.appendChild(title);

  if (it.Descricao) div.appendChild(ce('div', 'check-item-desc', escHtml(it.Descricao)));

  if (it.Responsavel) {
    div.appendChild(ce('div', 'check-item-meta',
      '✓ ' + escHtml(it.Responsavel) + (it.Data_Hora_Check ? ' · ' + fmtHora(it.Data_Hora_Check) : '')));
  }

  var actions = ce('div', 'check-actions');

  var btnFeito = ce('button', it.Status === 'Feito' ? 'active' : '');
  btnFeito.type = 'button';
  btnFeito.innerHTML = '<span class="chk-ico">' + icoCheck_() + '</span> Feito';
  btnFeito.addEventListener('click', function() { mudarStatusChecklist(it.ID, it.Status === 'Feito' ? 'Pendente' : 'Feito'); });

  var btnNA = ce('button', 'secondary' + (it.Status === 'Não aplicável' ? ' active' : ''));
  btnNA.type = 'button'; btnNA.textContent = 'N/A';
  btnNA.addEventListener('click', function() { mudarStatusChecklist(it.ID, it.Status === 'Não aplicável' ? 'Pendente' : 'Não aplicável'); });

  var btnObs = ce('button', 'light');
  btnObs.type = 'button'; btnObs.textContent = it.Observacao ? '📝 Obs' : 'Obs';
  btnObs.addEventListener('click', function() {
    var obs = window.prompt('Observação:', it.Observacao || '');
    if (obs === null) return;
    salvarObsChecklist(it.ID, obs);
  });

  actions.appendChild(btnFeito); actions.appendChild(btnNA); actions.appendChild(btnObs);
  div.appendChild(actions);

  if (it.Observacao) div.appendChild(ce('div', 'obs-readonly', escHtml(it.Observacao)));
  return div;
}

async function mudarStatusChecklist(id, status) {
  var res = await db.rpc('handover_checklist_status', { p_token: G.token, p_id: id, p_status: status });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro.', 'erro'); return; }
  var d = res.data || {};
  if (G.bundle && G.bundle.checklistTurno) {
    if (d.checklistSummary) G.bundle.checklistTurno.summary = d.checklistSummary;
    if (d.checklistItem) {
      G.bundle.checklistTurno.items = G.bundle.checklistTurno.items.map(function(it) {
        return it.ID === id ? d.checklistItem : it;
      });
    }
  }
  renderSummary(); renderChecklistPanel();
}

async function salvarObsChecklist(id, obs) {
  var res = await db.rpc('handover_checklist_observacao', { p_token: G.token, p_id: id, p_observacao: obs });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro.', 'erro'); return; }
  var d = res.data || {};
  if (G.bundle && G.bundle.checklistTurno && d.checklistItem) {
    G.bundle.checklistTurno.items = G.bundle.checklistTurno.items.map(function(it) {
      return it.ID === id ? d.checklistItem : it;
    });
  }
  toast('Obs. salva.', 'ok'); renderChecklistPanel();
}

/* funções globais do HTML */
export function onChecklistTurnoChange_(turno) { G.bundle = null; carregarBundle(); }
export function toggleChecklistPanel() {
  G.checklistOpen = !G.checklistOpen;
  el('checklist-toggle-btn').textContent = G.checklistOpen ? 'Fechar checklist' : 'Abrir checklist';
  el('checklist-content').classList.toggle('hidden', !G.checklistOpen);
  if (G.checklistOpen && G.bundle && G.bundle.checklistTurno) renderChecklistCats(G.bundle.checklistTurno);
}
export function setChecklistFilter(f) {
  G.checklistFilter = f;
  G.catOpen = {};   // reabrir todas as categorias ao trocar filtro
  document.querySelectorAll('[data-check-filter]').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-check-filter') === f);
  });
  if (G.bundle && G.bundle.checklistTurno) renderChecklistCats(G.bundle.checklistTurno);
}
export async function refreshChecklistToday() {
  el('checklist-sync-label').textContent = 'Sincronizando…';
  var turno = el('checklist-turno-select').value || turnoDefault();
  var res = await db.rpc('handover_checklist_gerar', { p_token: G.token, p_turno: turno });
  if (rpcError(res)) return;
  if (res.error) { toast('Erro ao sincronizar.', 'erro'); return; }
  var d = res.data || {};
  if (G.bundle && d.checklistTurno) G.bundle.checklistTurno = d.checklistTurno;
  renderSummary(); renderChecklistPanel();
  toast('Sincronizado.', 'ok');
}
