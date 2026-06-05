/* Handover v2 — modal de formulário: criar, editar, itens dinâmicos. */
import { G } from './state.js';
import { db, rpcError } from './api.js';
import { el, toast, markLastAction } from './utils.js';
import { normNome, normMed, normTexto, normFone } from './norm.js';
import { carregarBundle } from './dashboard.js';

export function openFormModal(cat, titulo) {
  el('form-modal-title').textContent = titulo || 'Novo registro';
  el('form-status').textContent = '';
  el('request-form').reset();
  el('category').value = cat;   // APÓS reset() para não ser revertido ao padrão "Geral"
  el('autor').value = G.sessao ? (G.sessao.nome || G.sessao.usuario) : '';
  el('general-fields').classList.toggle('hidden', cat !== 'Geral');
  el('medicine-fields').classList.toggle('hidden', cat !== 'Medicamentos');
  el('reposicao-fields').classList.toggle('hidden', cat !== 'Compras_Reposicao');
  if (cat === 'Medicamentos') onTipoChange_();
  if (cat === 'Compras_Reposicao') initRepItens_();
  el('novo-registro-menu').classList.add('hidden');
  el('novo-registro-trigger').setAttribute('aria-expanded', 'false');
  el('form-modal-overlay').classList.remove('hidden');
  el('form-modal-overlay').setAttribute('aria-hidden', 'false');
}
export function openNovoRegistroPendencia_()       { openFormModal('Geral', 'Nova pendência da loja'); }
export function openNovoRegistroEncomenda_()        { openFormModal('Medicamentos', 'Encomenda de medicamentos'); el('tipo').value = 'Encomenda'; onTipoChange_(); }
export function openNovoRegistroCompraReposicao_()  { openFormModal('Compras_Reposicao', 'Compra e reposição'); }
export function closeFormModal_() {
  G.editId = null; G.editOrigem = null;
  el('form-modal-overlay').classList.add('hidden'); el('form-modal-overlay').setAttribute('aria-hidden', 'true');
}

export function onTipoChange_() {
  var tipo = el('tipo').value;
  var isFalta = tipo === 'Falta';
  el('med-medicamento-field').classList.toggle('hidden', !isFalta);
  el('med-itens-table-wrapper').classList.toggle('hidden', isFalta);
  el('med-encomenda-only').classList.toggle('hidden', isFalta);
  if (!isFalta && el('itens-tbody').rows.length === 0) addItemRow_();
}

var _iIdx = 0;
export function addItemRow_() {
  var tbody = el('itens-tbody');
  var i = _iIdx++;
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><input name="mi_' + i + '_m" type="text" placeholder="Medicamento / produto"></td>' +
    '<td class="col-qty"><input name="mi_' + i + '_q" type="text" value="1" style="width:56px;"></td>' +
    '<td><input name="mi_' + i + '_o" type="text" placeholder="Obs."></td>' +
    '<td class="col-rm"><button type="button" class="btn-remove-item">✕</button></td>';
  tr.querySelector('.btn-remove-item').addEventListener('click', function() {
    if (el('itens-tbody').rows.length > 1) tr.remove();
  });
  tbody.appendChild(tr);
}

var _rIdx = 0;
export function initRepItens_() { el('rep-itens-tbody').innerHTML = ''; _rIdx = 0; addReposicaoItemRow_(); }
export function addReposicaoItemRow_() {
  var tbody = el('rep-itens-tbody');
  var i = _rIdx++;
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><input name="ri_' + i + '_i" type="text" placeholder="Item / produto"></td>' +
    '<td class="col-qty"><input name="ri_' + i + '_q" type="text" value="1" style="width:70px;"></td>' +
    '<td><input name="ri_' + i + '_o" type="text" placeholder="Obs."></td>' +
    '<td class="col-rm"><button type="button" class="btn-remove-item">✕</button></td>';
  tr.querySelector('.btn-remove-item').addEventListener('click', function() {
    if (el('rep-itens-tbody').rows.length > 1) tr.remove();
  });
  tbody.appendChild(tr);
}

export function setPrevisaoOffsetDays(n) { var d = new Date(); d.setDate(d.getDate()+n); el('previsaoEntrega').value = d.toISOString().slice(0,10); }
export function setReposicaoPrevisaoOffsetDays_(n) { var d = new Date(); d.setDate(d.getDate()+n); el('reposicao-previsao').value = d.toISOString().slice(0,10); }

export async function onFormSubmit(e) {
  e.preventDefault();
  var cat = el('category').value;
  el('form-status').textContent = 'Salvando…';
  var btn = el('save-button'); btn.disabled = true;
  try {
    if (G.editId) await salvarEdicao(cat);
    else if (cat === 'Geral') await salvarGeral();
    else if (cat === 'Medicamentos') await salvarMedicamento();
    else if (cat === 'Compras_Reposicao') await salvarReposicao();
  } finally { btn.disabled = false; }
}

export async function salvarGeral() {
  var titulo = normTexto(el('tituloGeral').value.trim());
  var desc   = normTexto(el('descricao').value.trim());
  var urg    = el('urgenciaGeral').value;
  if (!titulo && !desc) { el('form-status').textContent = 'Informe título ou descrição.'; return; }
  var res = await db.rpc('handover_pendencia_criar', { p_token: G.token, p_titulo: titulo, p_descricao: desc, p_urgencia: urg });
  if (rpcError(res)) return;
  if (res.error) { el('form-status').textContent = res.error.message || 'Erro.'; return; }
  toast('Pendência adicionada.', 'ok'); closeFormModal_(); markLastAction(); carregarBundle();
}

export async function salvarMedicamento() {
  var tipo  = el('tipo').value;
  var aten  = el('atendente').value.trim();
  var fn    = el('fornecedorCompra').value;
  var cod   = el('codigoCompraFornecedor').value.trim();
  var preco = el('precoVenda').value.trim().replace(',', '.');
  var obs   = normTexto(el('observacaoSolicitacao').value.trim());
  var payload = { tipo:tipo, atendente:normNome(aten), fornecedorCompra:fn, codigoCompraFornecedor:cod,
                  precoVenda:preco||null, observacaoSolicitacao:obs };
  if (tipo === 'Falta') {
    var med = normMed(el('medicamento').value.trim());
    if (!med) { el('form-status').textContent = 'Informe o medicamento.'; return; }
    if (!aten) { el('form-status').textContent = 'Informe o atendente.'; return; }
    payload.medicamento = med;
    payload.itens = [{ medicamento:med, quantidade:'1', observacaoItem:'' }];
  } else {
    var rows = el('itens-tbody').querySelectorAll('tr');
    var itens = [];
    rows.forEach(function(tr) {
      var m = tr.querySelector('[name$="_m"]'); var q = tr.querySelector('[name$="_q"]'); var o = tr.querySelector('[name$="_o"]');
      if (m && m.value.trim()) itens.push({ medicamento:normMed(m.value.trim()), quantidade:q&&q.value||'1', observacaoItem:normTexto(o&&o.value.trim()||'') });
    });
    if (!itens.length) { el('form-status').textContent = 'Adicione ao menos um medicamento.'; return; }
    var prev = el('previsaoEntrega').value;
    if (!prev) { el('form-status').textContent = 'Informe a previsão de entrega.'; return; }
    payload.itens = itens;
    payload.cliente = normNome(el('cliente').value.trim());
    payload.telefone = normFone(el('telefone').value);
    payload.prePago  = el('prePago').checked;
    payload.formaRecebimento = el('formaRecebimento').value;
    payload.previsaoEntrega  = prev;
  }
  var res = await db.rpc('handover_medicamento_criar', { p_token: G.token, p_payload: payload });
  if (rpcError(res)) return;
  if (res.error) { el('form-status').textContent = res.error.message || 'Erro.'; return; }
  toast((tipo === 'Encomenda' ? 'Encomenda' : 'Falta') + ' registrada.', 'ok');
  closeFormModal_(); markLastAction(); carregarBundle();
}

export async function salvarReposicao() {
  var rows = el('rep-itens-tbody').querySelectorAll('tr');
  var itens = [];
  rows.forEach(function(tr) {
    var i = tr.querySelector('[name$="_i"]'); var q = tr.querySelector('[name$="_q"]'); var o = tr.querySelector('[name$="_o"]');
    if (i && i.value.trim()) itens.push({ item:normMed(i.value.trim()), quantidade:q&&q.value||'', observacaoItem:normTexto(o&&o.value.trim()||'') });
  });
  if (!itens.length) { el('form-status').textContent = 'Adicione ao menos um item.'; return; }
  var payload = { itens:itens, prioridade:el('reposicao-prioridade').value,
                  observacao:normTexto(el('reposicao-observacao').value.trim()),
                  fornecedorSugerido:el('reposicao-fornecedor').value.trim(),
                  previsaoDesejada:el('reposicao-previsao').value||null };
  var res = await db.rpc('handover_compra_reposicao_criar', { p_token: G.token, p_payload: payload });
  if (rpcError(res)) return;
  if (res.error) { el('form-status').textContent = res.error.message || 'Erro.'; return; }
  toast('Compra registrada.', 'ok'); closeFormModal_(); markLastAction(); carregarBundle();
}

/* ── EDIÇÃO INLINE (F2) ── */
export function editarItem(id, origem) {
  var item, list;
  if (origem === 'Geral') {
    list = (G.bundle && G.bundle.geral) || [];
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { item = list[i]; break; } }
  } else {
    list = (G.bundle && G.bundle.medicamentos) || [];
    for (var j = 0; j < list.length; j++) { if (list[j].ID === id) { item = list[j]; break; } }
  }
  if (!item) { toast('Item não encontrado no bundle.', 'erro'); return; }
  G.editId = id;
  G.editOrigem = origem;
  openFormModal(origem === 'Geral' ? 'Geral' : 'Medicamentos', 'Editar registro');
  if (origem === 'Geral') {
    el('tituloGeral').value   = item.titulo    || item.Titulo    || '';
    el('descricao').value     = item.descricao || item.Descricao || '';
    el('urgenciaGeral').value = item.urgencia  || item.Urgencia  || 'Normal';
    var dv = item.data_vencimento || item.Data_Vencimento || '';
    if (dv) {
      el('geral-tem-vencimento').checked = true;
      el('geral-vencimento-fields').classList.remove('hidden');
      el('geral-data-vencimento').value = dv;
      el('geral-hora-vencimento').value = item.hora_vencimento || item.Hora_Vencimento || '';
    }
  } else {
    el('tipo').value = item.Tipo || 'Falta';
    onTipoChange_();
    el('medicamento').value  = item.Medicamento || '';
    el('atendente').value    = item.Atendente   || '';
    el('cliente').value      = item.Cliente     || '';
    el('telefone').value     = item.Telefone    || '';
    el('precoVenda').value   = item.Preco_Venda != null ? String(item.Preco_Venda) : '';
    el('observacaoSolicitacao').value = item.Observacao_Solicitacao || '';
    if (item.Previsao_Entrega) el('previsaoEntrega').value = item.Previsao_Entrega;
    el('prePago').checked = !!item.Pre_Pago;
    el('formaRecebimento').value = item.Forma_Recebimento || 'A combinar';
  }
}

export async function salvarEdicao(cat) {
  var payload = {};
  if (cat === 'Geral') {
    payload.titulo    = normTexto(el('tituloGeral').value.trim());
    payload.descricao = normTexto(el('descricao').value.trim());
    payload.urgencia  = el('urgenciaGeral').value;
    if (el('geral-tem-vencimento').checked) {
      payload.dataVencimento = el('geral-data-vencimento').value || null;
      payload.horaVencimento = el('geral-hora-vencimento').value || null;
    } else {
      payload.dataVencimento = null;
    }
    if (!payload.titulo && !payload.descricao) {
      el('form-status').textContent = 'Informe título ou descrição.'; return;
    }
  } else {
    payload.medicamento           = normMed(el('medicamento').value.trim())            || null;
    payload.cliente               = normNome(el('cliente').value.trim())               || null;
    payload.telefone              = normFone(el('telefone').value)                     || null;
    payload.precoVenda            = el('precoVenda').value.trim().replace(',', '.')    || null;
    payload.observacaoSolicitacao = normTexto(el('observacaoSolicitacao').value.trim())|| null;
    payload.prePago               = el('prePago').checked;
    payload.formaRecebimento      = el('formaRecebimento').value                      || null;
    if (el('previsaoEntrega').value) payload.previsaoEntrega = el('previsaoEntrega').value;
  }
  var id = G.editId, orig = G.editOrigem;
  G.editId = null; G.editOrigem = null;
  var res = await db.rpc('handover_item_editar', {
    p_token: G.token, p_id: id, p_origem: orig, p_payload: payload
  });
  if (rpcError(res)) return;
  if (res.error) { el('form-status').textContent = res.error.message || 'Erro ao salvar.'; return; }
  toast('Salvo com sucesso.', 'ok'); closeFormModal_(); markLastAction(); carregarBundle();
}
