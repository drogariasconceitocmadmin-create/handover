/* Handover v2 — estado mutável compartilhado.
   Instância ÚNICA garantida por ESM: todos os módulos importam G daqui. */

export var TKEY = 'handover_token', SKEY = 'handover_sessao';

export var G = {
  token    : localStorage.getItem(TKEY) || null,
  sessao   : JSON.parse(localStorage.getItem(SKEY) || 'null'),
  bundle   : null,
  historico: null,
  currentTab     : 'pendencias',
  checklistFilter: 'todos',
  checklistOpen  : true,
  pendFilter : 'pendentes',
  medFilter     : 'todos',
  medSearch     : '',
  comprasFilter    : 'pendentes',
  compradorFilter  : 'todos',
  compradorCache   : null,   // { meds, comp } — evita RPC extra ao trocar filtro
  medCancelId: null,
  reopenId   : null,
  reopenOrigem: null,
  catOpen    : {},     // id → bool
  editId     : null,
  editOrigem : null,
  _autoRefreshTimer: null,
};
