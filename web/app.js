/* Handover v2 — Supabase adapter. Visual 1:1 com o legado. */
(function () {
  'use strict';

  var cfg = window.HANDOVER_CONFIG;
  var db  = window.supabase.createClient(cfg.url, cfg.anonKey);

  var TKEY = 'handover_token', SKEY = 'handover_sessao';

  var G = {
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

  /* ── utils ── */
  function el(id) { return document.getElementById(id); }
  function ce(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmt(ts) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }); } catch(e) { return ts; }
  }
  function fmtHora(ts) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', timeZone:'America/Sao_Paulo' }); } catch(e) { return ''; }
  }
  function fmtData(d) {
    if (!d) return '';
    try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch(e) { return d; }
  }
  function nowHHMM() {
    return new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', timeZone:'America/Sao_Paulo' });
  }
  function turnoDefault() {
    // Manhã: 05:00–17:59  |  Noite: 18:00–04:59
    // Cobre turnos que começam cedo (abertura ~7h) até o fim do turno tarde (~17h)
    var h = parseInt(new Date().toLocaleString('pt-BR', { hour:'numeric', hour12:false, timeZone:'America/Sao_Paulo' }), 10);
    return (h >= 5 && h < 18) ? 'Manhã' : 'Noite';
  }
  function isVencido(dateStr) {
    if (!dateStr) return false;
    var d = new Date(dateStr + 'T23:59:59');
    return d < new Date();
  }
  function isHoje(dateStr) {
    if (!dateStr) return false;
    var hoje = new Date().toLocaleDateString('pt-BR');
    try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR') === hoje; } catch(e) { return false; }
  }

  /* ── toast ── */
  function toast(msg, tipo) {
    var r = el('toast-root');
    var t = ce('div', 'toast' + (tipo === 'erro' ? ' toast-erro' : tipo === 'ok' ? ' toast-ok' : ''));
    t.textContent = msg;
    r.appendChild(t);
    setTimeout(function() { t.remove(); }, 2800);
  }
  function markLastSync() { el('last-sync-label').textContent = nowHHMM(); }
  function markLastAction(label) { el('last-action-label').textContent = label || nowHHMM(); }

  /* ════════════════════════════════════════
     AUTH
  ════════════════════════════════════════ */
  async function doLogin() {
    var u = el('handover-login-usuario').value.trim();
    var p = el('handover-login-pin').value.trim();
    var err = el('handover-login-error');
    err.textContent = '';
    if (!u || !p) { err.textContent = 'Informe usuário e PIN.'; return; }
    var btn = el('handover-login-submit');
    btn.disabled = true; btn.textContent = 'Entrando…';
    try {
      var res = await db.rpc('handover_login', { p_usuario: u, p_pin: p });
      if (res.error) throw res.error;
      var d = res.data;
      if (!d || !(d.ok || d.success)) { err.textContent = (d && d.erro) || 'Usuário ou PIN incorretos.'; return; }
      G.token  = d.token;
      G.sessao = { usuario: d.usuario, nome: d.nome, perfil: d.perfil };
      localStorage.setItem(TKEY, G.token);
      localStorage.setItem(SKEY, JSON.stringify(G.sessao));
      el('handover-login-pin').value = '';
      abrirApp();
    } catch(e) { err.textContent = 'Erro de conexão.'; }
    finally { btn.disabled = false; btn.textContent = 'Entrar'; }
  }

  async function doLogout() {
    if (G._autoRefreshTimer) { clearInterval(G._autoRefreshTimer); G._autoRefreshTimer = null; }
    try { if (G.token) await db.rpc('handover_logout', { p_token: G.token }); } catch(_) {}
    G.token = G.sessao = G.bundle = G.historico = null;
    localStorage.removeItem(TKEY); localStorage.removeItem(SKEY);
    el('app-shell').classList.add('hidden');
    el('app-shell').setAttribute('aria-hidden', 'true');
    el('handover-login-overlay').classList.remove('hidden');
  }

  function sessaoExpirada() { toast('Sessão expirada.', 'erro'); doLogout(); }

  function rpcError(res) {
    if (!res.error) return false;
    if (String(res.error.message || '').indexOf('sessao_invalida') >= 0) { sessaoExpirada(); return true; }
    return false;
  }

  /* ════════════════════════════════════════
     ABRIR APP
  ════════════════════════════════════════ */
  function abrirApp() {
    el('handover-login-overlay').classList.add('hidden');
    var shell = el('app-shell');
    shell.classList.remove('hidden'); shell.setAttribute('aria-hidden', 'false');
    el('operador-atual').value = G.sessao.nome || G.sessao.usuario;
    el('operador-avatar-char').textContent = (G.sessao.nome || '?').charAt(0).toUpperCase();
    el('autor').value = G.sessao.nome || G.sessao.usuario;
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

  /* ════════════════════════════════════════
     BUNDLE
  ════════════════════════════════════════ */
  async function carregarBundle() {
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
  function refreshDashboardNow_() { carregarBundle(); }

  /* ════════════════════════════════════════
     SUMMARY STRIP — KPIs
  ════════════════════════════════════════ */
  function renderSummary() {
    var b    = G.bundle || {};
    var ger  = b.geral || [];
    var meds = b.medicamentos || [];
    var comp = b.comprasReposicao || [];
    var cl   = b.checklistTurno;

    var pend  = ger.filter(function(r) { return !r.resolvido; }).length;
    var urg   = ger.filter(function(r) { return !r.resolvido && r.urgencia === 'Urgente'; }).length;
    // KPI Encomendas = só itens Pendente (aguardando compra), igual v1.
    // Comprados (já adquiridos aguardando entrega) aparecem no KPI separado abaixo.
    var medAt = meds.filter(function(m) { return m.Status === 'Pendente'; }).length;
    var semAv = meds.filter(function(m) { return m.Status === 'Comprado' && m.Status_Aviso_WhatsApp !== 'Tentativa registrada'; }).length;
    var clPend = cl && cl.summary ? cl.summary.itensPendentes : 0;

    el('tab-badge-pendencias').textContent      = pend;
    el('tab-badge-medicamentos').textContent    = medAt;
    el('tab-badge-compras-reposicao').textContent = comp.length;
    el('tab-badge-checklist').textContent       = clPend;

    el('operation-summary').innerHTML = [
      kpiCard('kpi-blue',   icoClip_(),   'PENDÊNCIAS',           pend,  'Solicitações gerais',   'pendencias',    'pendentes'),
      kpiCard('kpi-red',    icoAlert_(),  'URGENTES',              urg,  'Prioridade na loja',    'pendencias',    'urgentes'),
      kpiCard('kpi-green',  icoPill_(),   'ENCOMENDAS',           medAt, 'Faltas e encomendas',   'medicamentos',  'pendentes'),
      kpiCard('kpi-orange', icoWA_(),     'COMPRADOS SEM AVISO',  semAv, 'WhatsApp pendente',     'medicamentos',  'comprados_sem_av'),
      kpiCardChecklist(cl),
    ].join('');

    // Ligar click nos cards de navegação
    el('operation-summary').querySelectorAll('[data-kpi-tab]').forEach(function(card) {
      card.addEventListener('click', function() {
        var tab    = card.getAttribute('data-kpi-tab');
        var filter = card.getAttribute('data-kpi-filter');
        setMainTab(tab);
        if (filter) {
          if (tab === 'pendencias')   { G.pendFilter = filter; renderPendencias(); }
          if (tab === 'medicamentos') { G.medFilter  = filter; renderMedicamentos(); }
        }
      });
    });
  }

  function kpiCardChecklist(cl) {
    var s = cl && cl.summary ? cl.summary : null;
    var turno    = (cl && cl.turno)                  || '—';
    var total    = s ? s.totalItens          : 0;
    var pend     = s ? s.itensPendentes      : 0;
    var feitos   = s ? s.itensFeitos         : 0;
    var na       = s ? s.itensNaoAplicaveis  : 0;
    var progr    = s ? s.percentualConcluido : 0;
    return '<div class="kpi-card kpi-cl kpi-cl-detail kpi-link" data-kpi-tab="checklist" role="button" tabindex="0">' +
      '<div class="kpi-ico">' + icoCheck_() + '</div>' +
      '<div class="kpi-body">' +
        '<div class="label">CHECKLIST · <strong style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;">' + escHtml(turno) + '</strong></div>' +
        '<div class="kpi-cl-stat-grid">' +
          '<div class="cs-item"><span class="cs-l">Total</span><span class="cs-v">' + total + '</span></div>' +
          '<div class="cs-item"><span class="cs-l">Pendentes</span><span class="cs-v">' + pend + '</span></div>' +
          '<div class="cs-item"><span class="cs-l">Feitos</span><span class="cs-v">' + feitos + '</span></div>' +
          '<div class="cs-item"><span class="cs-l">N/A</span><span class="cs-v">' + na + '</span></div>' +
        '</div>' +
        '<div class="kpi-cl-prog"><span style="width:' + progr + '%"></span></div>' +
        '<div class="sub" style="margin-top:4px;">' + progr + '% concluído</div>' +
      '</div>' +
    '</div>';
  }

  function kpiCard(cls, ico, label, value, sub, tab, filter) {
    var navAttrs = tab
      ? ' data-kpi-tab="' + tab + '"' + (filter ? ' data-kpi-filter="' + filter + '"' : '') + ' role="button" tabindex="0"'
      : '';
    var navCls = tab ? ' kpi-link' : '';
    return '<div class="kpi-card ' + cls + navCls + '"' + navAttrs + '>' +
      '<div class="kpi-ico">' + ico + '</div>' +
      '<div class="kpi-body">' +
        '<div class="label">' + escHtml(label) + '</div>' +
        '<div class="value">' + escHtml(String(value)) + '</div>' +
        '<div class="sub">' + escHtml(String(sub)) + '</div>' +
      '</div></div>';
  }

  /* ════════════════════════════════════════
     ABAS
  ════════════════════════════════════════ */
  function setMainTab(tab) {
    G.currentTab = tab;
    document.querySelectorAll('.main-tab').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-main-tab') === tab);
    });
    var isCL = (tab === 'checklist');
    el('panel-queue-wrap').classList.toggle('hidden', isCL);
    el('panel-checklist').classList.toggle('hidden', !isCL);
    if (isCL) renderChecklistPanel();
    else renderQueue();
  }

  /* ════════════════════════════════════════
     QUEUE DISPATCH
  ════════════════════════════════════════ */
  function renderQueue() {
    el('med-search-wrap').classList.toggle('hidden', G.currentTab !== 'medicamentos');
    el('historico-filters-panel').classList.add('hidden');
    if (G.currentTab === 'pendencias')        renderPendencias();
    else if (G.currentTab === 'medicamentos') renderMedicamentos();
    else if (G.currentTab === 'compras_reposicao') renderCompras();
    else if (G.currentTab === 'historico')    renderHistorico();
    else if (G.currentTab === 'comprador')    renderComprador();
  }

  /* ════════════════════════════════════════
     FILTER CHIPS HELPER
  ════════════════════════════════════════ */
  function filterChip(nsAttr, val, label, count, current) {
    var active = val === current ? ' active' : '';
    var badge  = count !== undefined
      ? '<span class="filter-count-badge">' + count + '</span>'
      : '';
    return '<button type="button" class="filter-button' + active + '" data-' + nsAttr + '="' + val + '">' +
      escHtml(label) + badge + '</button>';
  }

  /* ════════════════════════════════════════
     CARD BUILDER (qk-card-shell structure)
  ════════════════════════════════════════ */
  function buildCard(stripeClass, extraCardClass) {
    var card  = ce('div', 'queue-card' + (extraCardClass ? ' ' + extraCardClass : ''));
    var shell = ce('div', 'qk-card-shell');
    var stripe = ce('div', 'qk-stripe ' + stripeClass);
    var main  = ce('div', 'qk-card-main');
    shell.appendChild(stripe);
    shell.appendChild(main);
    card.appendChild(shell);
    return { card: card, main: main };
  }

  function buildTop(badges, timeStr, moreItems) {
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

  function buildMoreMenu(items) {
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

  function buildMeta(fields) {
    var dl = ce('dl', 'qk-meta');
    fields.forEach(function(f) {
      if (!f[1] && f[1] !== false) return;
      var row = ce('div', 'qk-meta-row');
      row.innerHTML = '<dt>' + escHtml(f[0]) + '</dt><dd>' + escHtml(String(f[1])) + '</dd>';
      dl.appendChild(row);
    });
    return dl;
  }

  function buildActions(btns) {
    var div = ce('div', 'qk-actions');
    btns.forEach(function(b) {
      var btn = ce('button', b.cls || 'btn-queue-secondary');
      btn.type = 'button'; btn.textContent = b.label;
      if (b.fn) btn.addEventListener('click', b.fn);
      div.appendChild(btn);
    });
    return div;
  }

  /* ════════════════════════════════════════
     PENDÊNCIAS
  ════════════════════════════════════════ */
  function renderPendencias() {
    var list = (G.bundle && G.bundle.geral) || [];
    el('queue-section-heading').textContent = 'Fila de pendências';
    el('queue-section-lede').classList.add('hidden');

    // contar por filtro
    var cPend  = list.filter(function(p) { return !p.resolvido; }).length;
    var cTodos = list.length;
    var cUrg   = list.filter(function(p) { return !p.resolvido && p.urgencia === 'Urgente'; }).length;
    var cVenc  = list.filter(function(p) { return !p.resolvido && (isVencido(p.data_vencimento) || isHoje(p.data_vencimento)); }).length;
    var cRes   = list.filter(function(p) { return p.resolvido; }).length;

    el('queue-filters-host').innerHTML =
      '<div class="filter-group">' +
      filterChip('pf', 'pendentes',    'Pendentes',   cPend,  G.pendFilter) +
      filterChip('pf', 'todos',        'Todos',        cTodos, G.pendFilter) +
      filterChip('pf', 'urgentes',     'Urgentes',     cUrg,   G.pendFilter) +
      filterChip('pf', 'vencidos',     'Vencidos/Hoje',cVenc,  G.pendFilter) +
      filterChip('pf', 'resolvidos',   'Resolvidos',   cRes,   G.pendFilter) +
      '</div>';

    el('queue-filters-host').querySelectorAll('.filter-button').forEach(function(b) {
      b.addEventListener('click', function() {
        G.pendFilter = b.getAttribute('data-pf');
        renderPendencias();
      });
    });

    var view = list.filter(function(p) {
      if (G.pendFilter === 'resolvidos') return p.resolvido;
      if (G.pendFilter === 'urgentes')   return !p.resolvido && p.urgencia === 'Urgente';
      if (G.pendFilter === 'vencidos')   return !p.resolvido && (isVencido(p.data_vencimento) || isHoje(p.data_vencimento));
      if (G.pendFilter === 'todos')      return true;
      return !p.resolvido;
    });

    el('queue-subtitle').textContent =
      'Pendências · Filtro: ' + G.pendFilter + ' · ' + view.length + ' registro(s)';

    renderQueueList(view, renderCardPend);
  }

  function renderCardPend(p) {
    var overdue = !p.resolvido && (isVencido(p.data_vencimento) || isHoje(p.data_vencimento));
    var c = buildCard(overdue ? 'qk-stripe-vencido' : p.resolvido ? 'qk-stripe-hist-resolvido' : 'qk-stripe-geral',
      overdue ? 'overdue' : '');

    // badges
    var badgesHtml = '<span class="qk-type-tag">SOLICITAÇÕES</span>' +
      ' <span class="badge">Solicitações</span>';
    if (!p.resolvido) badgesHtml += ' <span class="badge status-pendente">Pendente</span>';
    else              badgesHtml += ' <span class="badge status-entregue">Resolvido</span>';
    if (p.urgencia === 'Urgente') badgesHtml += ' <span class="badge badge-urgente">Urgente</span>';
    else if (p.urgencia === 'Alta') badgesHtml += ' <span class="badge">Alta</span>';
    if (overdue) badgesHtml += ' <span class="badge deadline-vencido">Vencido</span>';

    var menuItems = [];
    menuItems.push({ label: 'Ver detalhes', fn: (function(pp) { return function() {
      abrirDetalhes(pp.titulo || '(sem título)', [
        { title: 'SOLICITAÇÃO', fields: [
          ['Título',    pp.titulo],
          ['Urgência',  pp.urgencia],
          ['Autor',     pp.autor],
          ['Criado em', fmt(pp.criado_em)],
          ['Vencimento',pp.data_vencimento ? fmtData(pp.data_vencimento) + (pp.hora_vencimento ? ' ' + pp.hora_vencimento : '') : null],
          ['Descrição', pp.descricao],
        ]},
        { title: 'STATUS', fields: [
          ['Status',       pp.resolvido ? 'Resolvido' : 'Pendente'],
          ['Resolvido por',pp.resolvido_por],
        ]},
        { title: 'ÚLTIMA AÇÃO', fields: [
          ['Por', pp.ultima_acao_por],
          ['Em',  pp.ultima_acao_em ? fmt(pp.ultima_acao_em) : null],
        ]},
      ]);
    }; })(p) });
    menuItems.push({ label: 'Editar', fn: (function(pid) { return function() { editarItem(pid, 'Geral'); }; })(p.id) });
    menuItems.push({ label: 'Ver trilha de auditoria', fn: (function(pid, ptit) { return function() { abrirAuditDrawer(pid, ptit); }; })(p.id, p.titulo) });
    menuItems.push({ label: 'Copiar informações', fn: (function(pp) { return function() {
      copiarInfo([
        'Pendência: ' + (pp.titulo || ''),
        pp.descricao ? 'Descrição: ' + pp.descricao : null,
        'Urgência: ' + (pp.urgencia || 'Normal'),
        'Autor: ' + (pp.autor || ''),
        'Status: ' + (pp.resolvido ? 'Resolvido' : 'Pendente'),
        'Data: ' + fmt(pp.criado_em),
      ]);
    }; })(p) });
    if (!p.resolvido) {
      menuItems.push({ label: 'Marcar como resolvido', fn: function() { resolverPend(p.id, true); } });
    } else {
      menuItems.push({ label: 'Reabrir', fn: function() { resolverPend(p.id, false); } });
    }
    menuItems.push({ label: 'Excluir', fn: function() { excluirPend(p.id); } });

    c.main.appendChild(buildTop(badgesHtml, fmt(p.criado_em), menuItems));

    var titulo = ce('div', 'qk-title', escHtml(p.titulo || '(sem título)'));
    c.main.appendChild(titulo);

    if (p.descricao) {
      var desc = ce('div', 'qk-desc', escHtml(p.descricao));
      c.main.appendChild(desc);
      if (p.descricao.length > 180) {
        var expBtn = ce('button', 'qk-expand-btn');
        expBtn.type = 'button'; expBtn.textContent = 'Ver mais';
        expBtn.addEventListener('click', function() {
          var expanded = desc.classList.toggle('qk-desc--expanded');
          expBtn.textContent = expanded ? 'Ver menos' : 'Ver mais';
        });
        c.main.appendChild(expBtn);
      }
    }

    var uaPor = p.ultima_acao_por || p.Ultima_Acao_Por || p.autor || null;
    var uaEm  = p.ultima_acao_em  || p.Ultima_Acao_Em  || p.criado_em || null;
    c.main.appendChild(buildMeta([
      ['AUTOR',         p.autor],
      ['URGÊNCIA',      p.urgencia],
      ['ÚLTIMA AÇÃO',   uaPor ? (uaPor + (uaEm ? ' · ' + fmt(uaEm) : '')) : null],
      ['RESOLVIDO POR', p.resolvido_por || p.Resolvido_Por || null],
    ]));

    var actionBtns = [];
    if (!p.resolvido) {
      actionBtns.push({ label: 'Marcar como resolvido', cls: 'btn-queue-primary', fn: function() { resolverPend(p.id, true); } });
    } else {
      actionBtns.push({ label: 'Reabrir', cls: 'btn-queue-secondary', fn: function() { resolverPend(p.id, false); } });
    }
    c.main.appendChild(buildActions(actionBtns));
    return c.card;
  }

  async function resolverPend(id, val) {
    var res = await db.rpc('handover_pendencia_resolver', { p_token: G.token, p_id: id, p_resolvido: val });
    if (rpcError(res)) return;
    if (res.error) { toast('Erro ao atualizar.', 'erro'); return; }
    toast(val ? 'Marcada como resolvida.' : 'Reaberta.', 'ok');
    markLastAction(); carregarBundle();
  }

  async function excluirPend(id) {
    var motivo = window.prompt('Motivo da exclusão:');
    if (motivo === null) return;
    var res = await db.rpc('handover_pendencia_excluir', { p_token: G.token, p_id: id, p_motivo: motivo });
    if (rpcError(res)) return;
    if (res.error) { toast('Erro ao excluir.', 'erro'); return; }
    toast('Pendência excluída.', 'ok'); markLastAction(); carregarBundle();
  }

  /* ════════════════════════════════════════
     MEDICAMENTOS
  ════════════════════════════════════════ */
  function renderMedicamentos() {
    var list = (G.bundle && G.bundle.medicamentos) || [];
    el('queue-section-heading').textContent = 'Medicamentos solicitados';

    // Contagens por filtro
    var hoje = new Date().toLocaleDateString('pt-BR');
    function dtLocal(d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch(e) { return ''; } }

    var cPend  = list.filter(function(m) { return m.Status === 'Pendente'; }).length;
    var cTodos = list.length;
    var cFalt  = list.filter(function(m) { return m.Tipo === 'Falta'; }).length;
    var cEnc   = list.filter(function(m) { return m.Tipo === 'Encomenda'; }).length;
    var cComp  = list.filter(function(m) { return m.Status === 'Comprado'; }).length;
    var cSemAv = list.filter(function(m) { return m.Status === 'Comprado' && m.Status_Aviso_WhatsApp !== 'Tentativa registrada'; }).length;
    var cEnt   = list.filter(function(m) { return m.Status === 'Entregue'; }).length;
    var cCanc  = list.filter(function(m) { return m.Status === 'Cancelado'; }).length;
    var cNaoE  = list.filter(function(m) { return m.Status === 'Não encontrado'; }).length;
    var cVenc  = list.filter(function(m) {
      if (!m.Previsao_Entrega) return false;
      var d = dtLocal(m.Previsao_Entrega);
      return d && d <= hoje;
    }).length;
    var cResPar= list.filter(function(m) { return m.Status === 'Comprado' && m.Pre_Pago; }).length;

    var f = G.medFilter;
    el('queue-filters-host').innerHTML =
      '<div class="filter-group" style="flex-wrap:wrap;">' +
      filterChip('mf', 'pendentes',         'Pendentes',           cPend,  f) +
      filterChip('mf', 'todos',             'Todos',               cTodos, f) +
      filterChip('mf', 'Falta',             'Faltas',              cFalt,  f) +
      filterChip('mf', 'Encomenda',         'Encomendas',          cEnc,   f) +
      filterChip('mf', 'Comprado',          'Comprados',           cComp,  f) +
      filterChip('mf', 'comprados_sem_av',  'Comprados sem aviso', cSemAv, f) +
      filterChip('mf', 'Entregue',          'Entregues',           cEnt,   f) +
      filterChip('mf', 'Cancelado',         'Cancelados',          cCanc,  f) +
      filterChip('mf', 'Não encontrado',    'Não encontrados',     cNaoE,  f) +
      filterChip('mf', 'vencidos',          'Vencidos/Hoje',       cVenc,  f) +
      filterChip('mf', 'res_parcial',       'Resolvidos parcialmente', cResPar, f) +
      '</div>';

    el('queue-filters-host').querySelectorAll('.filter-button').forEach(function(b) {
      b.addEventListener('click', function() {
        G.medFilter = b.getAttribute('data-mf');
        renderMedicamentos();
      });
    });

    var search = (G.medSearch || '').toLowerCase();
    var view = list.filter(function(m) {
      var ok = true;
      switch (G.medFilter) {
        case 'pendentes':        ok = m.Status === 'Pendente'; break;
        case 'Falta':            ok = m.Tipo === 'Falta'; break;
        case 'Encomenda':        ok = m.Tipo === 'Encomenda'; break;
        case 'Comprado':         ok = m.Status === 'Comprado'; break;
        case 'comprados_sem_av': ok = m.Status === 'Comprado' && m.Status_Aviso_WhatsApp !== 'Tentativa registrada'; break;
        case 'Entregue':         ok = m.Status === 'Entregue'; break;
        case 'Cancelado':        ok = m.Status === 'Cancelado'; break;
        case 'Não encontrado':   ok = m.Status === 'Não encontrado'; break;
        case 'vencidos':
          ok = !!m.Previsao_Entrega && dtLocal(m.Previsao_Entrega) <= hoje; break;
        case 'res_parcial':      ok = m.Status === 'Comprado' && m.Pre_Pago; break;
        default: ok = true;
      }
      if (ok && search) {
        var txt = [m.Medicamento, m.Cliente, m.Telefone, m.Atendente, m.Status, String(m.Preco_Venda || '')]
          .join(' ').toLowerCase();
        ok = txt.indexOf(search) >= 0;
      }
      return ok;
    });

    el('queue-subtitle').textContent = 'Medicamentos · Filtro: ' + G.medFilter + ' · ' + view.length + ' registro(s)';

    // Agrupar por Pedido_ID
    var grupos = [], pedMap = {};
    view.forEach(function(m) {
      var pid = m.Pedido_ID;
      if (pid && m.Total_Itens > 1) {
        if (!pedMap[pid]) { pedMap[pid] = []; grupos.push({ tipo: 'pedido', pid: pid, itens: pedMap[pid] }); }
        pedMap[pid].push(m);
      } else {
        grupos.push({ tipo: 'single', item: m });
      }
    });

    var ql = el('queue-list'); ql.innerHTML = '';
    var qe = el('queue-empty');
    if (!grupos.length) { qe.classList.remove('hidden'); return; }
    qe.classList.add('hidden');
    grupos.forEach(function(g) {
      if (g.tipo === 'single') {
        ql.appendChild(renderCardMed(g.item, false));
      } else {
        ql.appendChild(renderGrupoMed(g));
      }
    });
  }

  function stripeForMed(m) {
    var s = m.Status || '';
    if (s === 'Cancelado') return 'qk-stripe-vencido';
    if (m.Previsao_Entrega && isVencido(m.Previsao_Entrega)) return 'qk-stripe-hoje';
    if (s === 'Entregue')  return 'qk-stripe-hist-resolvido';
    if (s === 'Comprado')  return 'qk-stripe-hoje';
    return 'qk-stripe-med';
  }

  function statusBadgeCls(s) {
    var map = { 'Pendente':'status-pendente', 'Comprado':'status-comprado',
                'Entregue':'status-entregue', 'Cancelado':'status-cancelado',
                'Não encontrado':'status-nao_encontrado' };
    return map[s] || '';
  }

  function renderCardMed(m, subItem) {
    var vencido = m.Previsao_Entrega && isVencido(m.Previsao_Entrega);
    var c = buildCard(stripeForMed(m), subItem ? 'qc-subitem' : '');

    var badgesHtml = '<span class="qk-type-tag">MEDICAMENTOS</span>' +
      ' <span class="badge">' + escHtml(m.Tipo || '') + '</span>' +
      ' <span class="badge ' + statusBadgeCls(m.Status) + '">' + escHtml(m.Status || '') + '</span>';
    if (vencido) badgesHtml += ' <span class="badge deadline-vencido">Vencido</span>';
    if (m.Pre_Pago) badgesHtml += ' <span class="badge">Pré-pago</span>';

    var menuItems = acoesMed(m);
    c.main.appendChild(buildTop(badgesHtml, fmt(m.Ultima_Acao_Em || m.Timestamp), menuItems));

    c.main.appendChild(ce('div', 'qk-title', escHtml(m.Medicamento || '(sem nome)')));

    var descParts = [];
    if (m.Tipo) descParts.push('Tipo: ' + m.Tipo);
    if (m.Pre_Pago !== undefined && m.Pre_Pago !== null) descParts.push('Pré-pago: ' + (m.Pre_Pago ? 'Sim' : 'Não'));
    if (m.Observacao_Solicitacao) descParts.push('Obs: ' + m.Observacao_Solicitacao);
    if (descParts.length) c.main.appendChild(ce('div', 'qk-desc', escHtml(descParts.join(' · '))));

    c.main.appendChild(buildMeta([
      ['CLIENTE',          m.Cliente],
      ['TELEFONE',         m.Telefone],
      ['RECEBIMENTO',      m.Forma_Recebimento],
      ['ATENDENTE',        m.Atendente],
      ['PREVISÃO',         fmtData(m.Previsao_Entrega)],
      ['FORNECEDOR',       m.Fornecedor_Compra && m.Fornecedor_Compra !== 'Não informado' ? m.Fornecedor_Compra : null],
      ['CÓDIGO COMPRA',    m.Codigo_Compra_Fornecedor],
      ['PREÇO',            m.Preco_Venda ? 'R$ ' + m.Preco_Venda : null],
      ['WHATSAPP',         m.Status_Aviso_WhatsApp || 'Não registrado'],
      ['ÚLTIMA AÇÃO',      m.Ultima_Acao_Por ? m.Ultima_Acao_Por + (m.Ultima_Acao_Em ? ' · ' + fmt(m.Ultima_Acao_Em) : '') : null],
    ]));

    c.main.appendChild(buildActions(botoesAcoesCard(m)));
    return c.card;
  }

  function acoesMed(m) {
    var s = m.Status;
    var items = [];
    items.push({ label: 'Ver detalhes', fn: (function(mm) { return function() {
      abrirDetalhes(mm.Medicamento || '(sem nome)', [
        { title: 'SOLICITAÇÃO', fields: [
          ['Tipo',        mm.Tipo],
          ['Status',      mm.Status],
          ['Atendente',   mm.Atendente],
          ['Previsão',    fmtData(mm.Previsao_Entrega)],
          ['Recebimento', mm.Forma_Recebimento],
          ['Observação',  mm.Observacao_Solicitacao],
        ]},
        { title: 'CLIENTE', fields: [
          ['Nome',     mm.Cliente],
          ['Telefone', mm.Telefone],
          ['Pré-pago', mm.Pre_Pago ? 'Sim' : null],
        ]},
        { title: 'COMPRA', fields: [
          ['Fornecedor',    mm.Fornecedor_Compra && mm.Fornecedor_Compra !== 'Não informado' ? mm.Fornecedor_Compra : null],
          ['Código compra', mm.Codigo_Compra_Fornecedor],
          ['Preço',         mm.Preco_Venda ? 'R$ ' + mm.Preco_Venda : null],
          ['WhatsApp',      mm.Status_Aviso_WhatsApp || 'Não registrado'],
        ]},
        { title: 'ÚLTIMA AÇÃO', fields: [
          ['Por', mm.Ultima_Acao_Por],
          ['Em',  mm.Ultima_Acao_Em ? fmt(mm.Ultima_Acao_Em) : null],
        ]},
      ]);
    }; })(m) });
    if (s === 'Pendente') {
      items.push({ label: 'Marcar como comprado', fn: function() { acaoMed('comprar', m.ID); } });
      items.push({ label: 'Cancelar solicitação', fn: function() { abrirCancelarMed(m.ID, m.Medicamento, m.Cliente); } });
    }
    if (s === 'Comprado') {
      items.push({ label: 'Marcar como entregue', fn: function() { acaoMed('entregar', m.ID); } });
      items.push({ label: 'Reverter para Pendente', fn: function() { acaoMed('reverter', m.ID); } });
      if (m.Telefone) items.push({ label: 'Enviar WhatsApp', fn: function() { acaoWhatsApp(m.ID); } });
    }
    items.push({ label: 'Editar', fn: (function(mid) { return function() { editarItem(mid, 'Medicamentos'); }; })(m.ID) });
    items.push({ label: 'Ver trilha de auditoria', fn: function() { abrirAuditDrawer(m.ID, m.Medicamento); } });
    items.push({ label: 'Copiar informações', fn: (function(mm) { return function() {
      copiarInfo([
        'Medicamento: ' + (mm.Medicamento || ''),
        'Tipo: ' + (mm.Tipo || ''),
        'Status: ' + (mm.Status || ''),
        mm.Cliente    ? 'Cliente: '   + mm.Cliente    : null,
        mm.Telefone   ? 'Telefone: '  + mm.Telefone   : null,
        mm.Atendente  ? 'Atendente: ' + mm.Atendente  : null,
        mm.Previsao_Entrega ? 'Previsão: ' + fmtData(mm.Previsao_Entrega) : null,
        mm.Preco_Venda ? 'Preço: R$ ' + mm.Preco_Venda : null,
      ]);
    }; })(m) });
    return items;
  }

  function botoesAcoesCard(m) {
    var s = m.Status; var btns = [];
    if (s === 'Pendente') {
      btns.push({ label: 'Marcar comprado', cls: 'btn-queue-primary', fn: function() { acaoMed('comprar', m.ID); } });
      btns.push({ label: 'Cancelar', cls: 'btn-queue-light', fn: function() { abrirCancelarMed(m.ID, m.Medicamento, m.Cliente); } });
    }
    if (s === 'Comprado') {
      btns.push({ label: 'Marcar entregue', cls: 'btn-queue-primary', fn: function() { acaoMed('entregar', m.ID); } });
      if (m.Telefone) btns.push({ label: 'WhatsApp', cls: 'whatsapp', fn: function() { acaoWhatsApp(m.ID); } });
      btns.push({ label: 'Reverter', cls: 'btn-queue-light', fn: function() { acaoMed('reverter', m.ID); } });
    }
    btns.push({ label: 'Auditoria', cls: 'btn-queue-secondary', fn: function() { abrirAuditDrawer(m.ID, m.Medicamento); } });
    return btns;
  }

  function renderGrupoMed(g) {
    // Pedido multi-item: primeiro card do grupo tem tabela dos itens
    var primeiro = g.itens[0];
    var c = buildCard(stripeForMed(primeiro));

    var badgesHtml = '<span class="qk-type-tag">MEDICAMENTOS</span>' +
      ' <span class="badge-pedido-count">Pedido · ' + g.itens.length + ' itens</span>' +
      ' <span class="badge ' + statusBadgeCls(primeiro.Status) + '">' + escHtml(primeiro.Status || '') + '</span>';

    c.main.appendChild(buildTop(badgesHtml, fmt(primeiro.Ultima_Acao_Em), []));

    var tbl = ce('table', 'grp-items-table');
    tbl.innerHTML = '<thead><tr>' +
      '<th>Medicamento</th><th>Qtd</th><th>Obs.</th><th></th>' +
      '</tr></thead>';
    var tbody = ce('tbody');
    g.itens.forEach(function(m) {
      var tr = document.createElement('tr');
      var actionsBtns = [];
      if (m.Status === 'Pendente') actionsBtns.push('<button type="button" class="btn-queue-primary" style="font-size:10px;padding:3px 8px;">Comprado</button>');
      if (m.Status === 'Comprado') actionsBtns.push('<button type="button" class="btn-queue-primary" style="font-size:10px;padding:3px 8px;">Entregue</button>');
      tr.innerHTML = '<td class="grp-item-name">' + escHtml(m.Medicamento || '') + '</td>' +
        '<td class="grp-item-qty">' + escHtml(m.Quantidade_Item || '1') + '</td>' +
        '<td>' + escHtml(m.Observacao_Item || '') + '</td>' +
        '<td class="grp-item-actions">' + actionsBtns.join('') + '</td>';

      var compBtn = tr.querySelector('.btn-queue-primary');
      if (compBtn) compBtn.addEventListener('click', (function(id, st) {
        return function() { acaoMed(st === 'Pendente' ? 'comprar' : 'entregar', id); };
      })(m.ID, m.Status));
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    c.main.appendChild(tbl);

    c.main.appendChild(buildMeta([
      ['CLIENTE',    primeiro.Cliente],
      ['TELEFONE',   primeiro.Telefone],
      ['ATENDENTE',  primeiro.Atendente],
      ['PREVISÃO',   fmtData(primeiro.Previsao_Entrega)],
    ]));
    return c.card;
  }

  async function acaoMed(acao, id) {
    var rpcMap = { comprar:'handover_medicamento_comprar', entregar:'handover_medicamento_entregar',
                   reverter:'handover_medicamento_reverter', cancelar:'handover_medicamento_cancelar' };
    var motivo;
    if (acao === 'reverter') {
      motivo = window.prompt('Motivo da reversão:');
      if (motivo === null) return;
    }
    var params = { p_token: G.token, p_id: id };
    if (motivo !== undefined) params.p_motivo = motivo;
    var res = await db.rpc(rpcMap[acao], params);
    if (rpcError(res)) return;
    if (res.error) { toast('Erro: ' + (res.error.message || acao), 'erro'); return; }
    var msgs = { comprar:'Comprado.', entregar:'Entregue.', reverter:'Revertido.', cancelar:'Cancelado.' };
    toast(msgs[acao] || 'Atualizado.', 'ok'); markLastAction(msgs[acao]); carregarBundle();
  }

  async function acaoWhatsApp(id) {
    var meds = (G.bundle && G.bundle.medicamentos) || [];
    for (var _i = 0; _i < meds.length; _i++) {
      if (meds[_i].ID === id && meds[_i].Telefone) {
        var digits = String(meds[_i].Telefone).replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) {
          toast('Telefone inválido para WhatsApp (' + digits.length + ' dígitos). Verifique o cadastro.', 'erro');
          return;
        }
        break;
      }
    }
    var res = await db.rpc('handover_medicamento_whatsapp', { p_token: G.token, p_id: id });
    if (rpcError(res)) return;
    if (res.error) { toast('Erro WhatsApp.', 'erro'); return; }
    var d = res.data || {};
    if (d.whatsAppUrl) window.open(d.whatsAppUrl, '_blank', 'noopener');
    toast('Link WhatsApp gerado.', 'ok'); markLastAction('WhatsApp'); carregarBundle();
  }

  /* ════════════════════════════════════════
     MODAL CANCELAR MEDICAMENTO
  ════════════════════════════════════════ */
  function abrirCancelarMed(id, nomeMed, nomeCliente) {
    G.medCancelId = id;
    el('med-cancel-summary-med').textContent = nomeMed || '';
    var cliWrap = el('med-cancel-summary-cli-wrap');
    if (nomeCliente) { el('med-cancel-summary-cli').textContent = 'Cliente: ' + nomeCliente; cliWrap.classList.remove('hidden'); }
    else cliWrap.classList.add('hidden');
    el('med-cancel-motivo').value = '';
    el('med-cancel-overlay').classList.remove('hidden');
    el('med-cancel-overlay').setAttribute('aria-hidden', 'false');
  }
  function closeCancelMedicationModal_() {
    G.medCancelId = null;
    el('med-cancel-overlay').classList.add('hidden');
    el('med-cancel-overlay').setAttribute('aria-hidden', 'true');
  }
  async function confirmCancelMedicationModal_() {
    if (!G.medCancelId) return;
    var motivo = el('med-cancel-motivo').value.trim();
    if (!motivo) { el('med-cancel-motivo').focus(); return; }
    var res = await db.rpc('handover_medicamento_cancelar', { p_token: G.token, p_id: G.medCancelId, p_motivo: motivo });
    closeCancelMedicationModal_();
    if (rpcError(res)) return;
    if (res.error) { toast('Erro ao cancelar.', 'erro'); return; }
    toast('Cancelado.', 'ok'); markLastAction('Cancelado'); carregarBundle();
  }

  /* ════════════════════════════════════════
     COMPRAS E REPOSIÇÃO
  ════════════════════════════════════════ */
  function renderCompras() {
    var list = (G.bundle && G.bundle.comprasReposicao) || [];
    el('queue-section-heading').textContent = 'Compras e reposição';

    var cPend = list.filter(function(r) { return r.Status_Compra === 'Pendente de compra'; }).length;
    var cTodos = list.length;
    var cNaoE = list.filter(function(r) { return r.Status_Compra === 'Não encontrado'; }).length;

    var f = G.comprasFilter || 'pendentes';

    el('queue-filters-host').innerHTML =
      '<div class="filter-group">' +
      filterChip('cf', 'pendentes',      'Pendentes',       cPend,  f) +
      filterChip('cf', 'todos',          'Todos',           cTodos, f) +
      filterChip('cf', 'nao_encontrado', 'Não encontrados', cNaoE,  f) +
      '</div>';

    el('queue-filters-host').querySelectorAll('.filter-button').forEach(function(b) {
      b.addEventListener('click', function() {
        G.comprasFilter = b.getAttribute('data-cf');
        renderCompras();
      });
    });

    var view = list.filter(function(r) {
      if (f === 'pendentes')      return r.Status_Compra === 'Pendente de compra';
      if (f === 'nao_encontrado') return r.Status_Compra === 'Não encontrado';
      return true;
    });

    el('queue-subtitle').textContent =
      'Compras e reposição · Filtro: ' + f + ' · ' + view.length + ' registro(s)';

    renderQueueList(view, renderCardCompra);
  }

  function renderCardCompra(r) {
    var c = buildCard('qk-stripe-geral');
    var statusCls = r.Status_Compra === 'Não encontrado' ? 'status-cancelado' : 'status-pendente';
    var badgesHtml = '<span class="qk-type-tag">COMPRAS E REPOSIÇÃO</span>' +
      ' <span class="badge">' + escHtml(r.Categoria_Compra || 'Reposição') + '</span>' +
      ' <span class="badge ' + statusCls + '">' + escHtml(r.Status_Compra || 'Pendente de compra') + '</span>';
    if (r.Prioridade === 'Urgente') badgesHtml += ' <span class="badge badge-urgente">Urgente</span>';

    var menuItems = [];
    menuItems.push({ label: 'Ver detalhes', fn: (function(rr) { return function() {
      abrirDetalhes(rr.Item || '(sem item)', [
        { title: 'SOLICITAÇÃO', fields: [
          ['Item / Produto',    rr.Item],
          ['Categoria',         rr.Categoria_Compra],
          ['Quantidade',        rr.Quantidade],
          ['Prioridade',        rr.Prioridade],
          ['Solicitante',       rr.Solicitante],
          ['Data da solicitação', fmt(rr.Data_Solicitacao)],
        ]},
        { title: 'COMPRA', fields: [
          ['Status compra',   rr.Status_Compra],
          ['Status handover', rr.Status_Handover],
          ['Observação',      rr.Observacao || rr.Motivo],
          ['Fornecedor',      rr.Fornecedor_Sugerido],
          ['Previsão desejada', fmtData(rr.Previsao_Desejada)],
        ]},
        { title: 'ÚLTIMA AÇÃO', fields: [
          ['Por', rr.Ultima_Acao_Por],
          ['Em',  rr.Ultima_Acao_Em ? fmt(rr.Ultima_Acao_Em) : null],
        ]},
      ]);
    }; })(r) });
    menuItems.push({ label: 'Copiar informações', fn: (function(rr) { return function() {
      copiarInfo([
        'Item: ' + (rr.Item || ''),
        'Categoria: ' + (rr.Categoria_Compra || ''),
        'Quantidade: ' + (rr.Quantidade || ''),
        'Prioridade: ' + (rr.Prioridade || ''),
        'Solicitante: ' + (rr.Solicitante || ''),
        rr.Motivo ? 'Obs: ' + rr.Motivo : null,
      ]);
    }; })(r) });
    var _perfil = (G.sessao || {}).perfil || '';
    if (['gerente','admin'].indexOf(_perfil) >= 0) {
      menuItems.push({ label: 'Cancelar', fn: (function(rid) { return function() { cancelarReposicao(rid); }; })(r.ID) });
    }

    c.main.appendChild(buildTop(badgesHtml, fmt(r.Data_Solicitacao), menuItems));
    c.main.appendChild(ce('div', 'qk-title', escHtml(r.Item || '(sem item)')));
    if (r.Motivo) c.main.appendChild(ce('div', 'qk-desc', escHtml(r.Motivo)));
    c.main.appendChild(buildMeta([
      ['QUANTIDADE',   r.Quantidade],
      ['PRIORIDADE',   r.Prioridade],
      ['SOLICITANTE',  r.Solicitante],
      ['PREVISÃO',     fmtData(r.Previsao_Desejada)],
      ['FORNECEDOR',   r.Fornecedor_Sugerido],
    ]));
    if (['gerente','admin'].indexOf(_perfil) >= 0) {
      c.main.appendChild(buildActions([
        { label: 'Cancelar', cls: 'btn-queue-secondary',
          fn: (function(rid) { return function() { cancelarReposicao(rid); }; })(r.ID) }
      ]));
    }
    return c.card;
  }

  /* ════════════════════════════════════════
     HISTÓRICO
  ════════════════════════════════════════ */
  async function renderHistorico() {
    el('queue-section-heading').textContent = 'Histórico / Resolvidos';
    el('queue-filters-host').innerHTML = '';
    el('queue-subtitle').textContent = 'Carregando…';
    if (!G.historico) {
      var res = await db.rpc('handover_historico', { p_token: G.token, p_limit: 100 });
      if (rpcError(res)) return;
      if (res.error) { el('queue-subtitle').textContent = 'Erro ao carregar.'; return; }
      G.historico = (res.data && res.data.historico) || [];
    }
    var list = G.historico;
    el('tab-badge-historico').textContent = list.length;
    el('queue-subtitle').textContent = 'Histórico · ' + list.length + ' registro(s)';
    renderQueueList(list, renderCardHistorico);
  }

  function renderCardHistorico(h) {
    var c = buildCard('qk-stripe-hist', 'queue-card--historico');
    var badgesHtml = '<span class="qk-type-tag">' + escHtml(h.Origem || 'HISTÓRICO') + '</span>' +
      ' <span class="badge status-historico_resolvido">' + escHtml(h.Estado_Arquivo || h.Status || 'Arquivado') + '</span>';
    c.main.appendChild(buildTop(badgesHtml, fmt(h.Ultima_Acao_Em), []));
    var titulo = h.Titulo || h.Medicamento || h.Item || '(registro)';
    c.main.appendChild(ce('div', 'qk-title', escHtml(titulo)));
    c.main.appendChild(buildActions([
      { label: 'Reabrir', cls: 'btn-queue-secondary', fn: function() { abrirModalReopen(h.ID, h.Origem); } }
    ]));
    return c.card;
  }

  /* ════════════════════════════════════════
     MODAL REABRIR
  ════════════════════════════════════════ */
  function abrirModalReopen(id, origem) {
    G.reopenId = id; G.reopenOrigem = origem;
    el('reopen-motivo-input').value = '';
    el('reopen-confirm-overlay').classList.remove('hidden');
    el('reopen-confirm-overlay').setAttribute('aria-hidden', 'false');
  }
  function cancelReopenHistoricoModal_() {
    G.reopenId = null; G.reopenOrigem = null;
    el('reopen-confirm-overlay').classList.add('hidden');
    el('reopen-confirm-overlay').setAttribute('aria-hidden', 'true');
  }
  async function confirmReopenHistoricoModal_() {
    if (!G.reopenId) return;
    var motivo = el('reopen-motivo-input').value.trim();
    var res = await db.rpc('handover_historico_reabrir', { p_token: G.token, p_id: G.reopenId, p_motivo: motivo });
    cancelReopenHistoricoModal_();
    if (rpcError(res)) return;
    if (res.error) { toast('Erro ao reabrir.', 'erro'); return; }
    G.historico = null;
    toast('Reaberto.', 'ok'); markLastAction('Reaberto'); carregarBundle();
  }

  /* ════════════════════════════════════════
     SIDEBAR
  ════════════════════════════════════════ */
  function renderSidebar() {
    // Checklist
    var cl = G.bundle && G.bundle.checklistTurno;
    var body = el('sidebar-checklist-body');
    if (!body) return; // elemento removido do DOM
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

  /* ════════════════════════════════════════
     CHECKLIST PANEL
  ════════════════════════════════════════ */
  function renderChecklistPanel() {
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
  function onChecklistTurnoChange_(turno) { G.bundle = null; carregarBundle(); }
  function toggleChecklistPanel() {
    G.checklistOpen = !G.checklistOpen;
    el('checklist-toggle-btn').textContent = G.checklistOpen ? 'Fechar checklist' : 'Abrir checklist';
    el('checklist-content').classList.toggle('hidden', !G.checklistOpen);
    if (G.checklistOpen && G.bundle && G.bundle.checklistTurno) renderChecklistCats(G.bundle.checklistTurno);
  }
  function setChecklistFilter(f) {
    G.checklistFilter = f;
    G.catOpen = {};   // reabrir todas as categorias ao trocar filtro
    document.querySelectorAll('[data-check-filter]').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-check-filter') === f);
    });
    if (G.bundle && G.bundle.checklistTurno) renderChecklistCats(G.bundle.checklistTurno);
  }
  async function refreshChecklistToday() {
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

  /* ════════════════════════════════════════
     AUDIT DRAWER
  ════════════════════════════════════════ */
  var _auditAllData = [];
  var _auditFilter  = 'todos';

  async function abrirAuditDrawer(id, titulo) {
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

  function closeAuditDrawer_() {
    el('audit-drawer-overlay').classList.add('hidden');
    el('audit-drawer-overlay').setAttribute('aria-hidden', 'true');
  }
  function onAuditDrawerOverlayClick_(e) { if (e.target === el('audit-drawer-overlay')) closeAuditDrawer_(); }
  function copyAuditTrailToClipboard_() {
    var d = el('audit-drawer-inner')._auditData;
    if (!d || !d.length) { toast('Nada para copiar.'); return; }
    var txt = d.map(function(a) { return [fmt(a.Data_Hora), a.Acao, a.Campo||'', a.Valor_Anterior||'', a.Valor_Novo||'', a.Nome||'', a.Resumo||''].join('\t'); }).join('\n');
    navigator.clipboard.writeText(txt).then(function() { toast('Copiado.', 'ok'); }).catch(function() { toast('Erro ao copiar.', 'erro'); });
  }

  /* ════════════════════════════════════════
     CARD DETAIL OVERLAY
  ════════════════════════════════════════ */
  function closeCardDetailOverlay_() {
    el('card-detail-overlay').classList.add('hidden');
    el('card-detail-overlay').setAttribute('aria-hidden', 'true');
  }

  // sections: [{ title: 'SEÇÃO', fields: [['Label', valor], ...] }]
  function abrirDetalhes(titulo, sections) {
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

  function copiarInfo(linhas) {
    var txt = linhas.filter(Boolean).join('\n');
    navigator.clipboard.writeText(txt)
      .then(function() { toast('Copiado.', 'ok'); })
      .catch(function() { toast('Erro ao copiar.', 'erro'); });
  }

  /* ════════════════════════════════════════
     FORM MODAL
  ════════════════════════════════════════ */
  function openFormModal(cat, titulo) {
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
  function openNovoRegistroPendencia_()       { openFormModal('Geral', 'Nova pendência da loja'); }
  function openNovoRegistroEncomenda_()        { openFormModal('Medicamentos', 'Encomenda de medicamentos'); el('tipo').value = 'Encomenda'; onTipoChange_(); }
  function openNovoRegistroCompraReposicao_()  { openFormModal('Compras_Reposicao', 'Compra e reposição'); }
  function closeFormModal_() {
    G.editId = null; G.editOrigem = null;
    el('form-modal-overlay').classList.add('hidden'); el('form-modal-overlay').setAttribute('aria-hidden', 'true');
  }

  function onTipoChange_() {
    var tipo = el('tipo').value;
    var isFalta = tipo === 'Falta';
    el('med-medicamento-field').classList.toggle('hidden', !isFalta);
    el('med-itens-table-wrapper').classList.toggle('hidden', isFalta);
    el('med-encomenda-only').classList.toggle('hidden', isFalta);
    if (!isFalta && el('itens-tbody').rows.length === 0) addItemRow_();
  }

  var _iIdx = 0;
  function addItemRow_() {
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
  function initRepItens_() { el('rep-itens-tbody').innerHTML = ''; _rIdx = 0; addReposicaoItemRow_(); }
  function addReposicaoItemRow_() {
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

  function setPrevisaoOffsetDays(n) { var d = new Date(); d.setDate(d.getDate()+n); el('previsaoEntrega').value = d.toISOString().slice(0,10); }
  function setReposicaoPrevisaoOffsetDays_(n) { var d = new Date(); d.setDate(d.getDate()+n); el('reposicao-previsao').value = d.toISOString().slice(0,10); }

  async function onFormSubmit(e) {
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

  async function salvarGeral() {
    var titulo = el('tituloGeral').value.trim();
    var desc   = el('descricao').value.trim();
    var urg    = el('urgenciaGeral').value;
    if (!titulo && !desc) { el('form-status').textContent = 'Informe título ou descrição.'; return; }
    var res = await db.rpc('handover_pendencia_criar', { p_token: G.token, p_titulo: titulo, p_descricao: desc, p_urgencia: urg });
    if (rpcError(res)) return;
    if (res.error) { el('form-status').textContent = res.error.message || 'Erro.'; return; }
    toast('Pendência adicionada.', 'ok'); closeFormModal_(); markLastAction(); carregarBundle();
  }

  async function salvarMedicamento() {
    var tipo  = el('tipo').value;
    var aten  = el('atendente').value.trim();
    var fn    = el('fornecedorCompra').value;
    var cod   = el('codigoCompraFornecedor').value.trim();
    var preco = el('precoVenda').value.trim().replace(',', '.');
    var obs   = el('observacaoSolicitacao').value.trim();
    var payload = { tipo:tipo, atendente:aten, fornecedorCompra:fn, codigoCompraFornecedor:cod,
                    precoVenda:preco||null, observacaoSolicitacao:obs };
    if (tipo === 'Falta') {
      var med = el('medicamento').value.trim();
      if (!med) { el('form-status').textContent = 'Informe o medicamento.'; return; }
      if (!aten) { el('form-status').textContent = 'Informe o atendente.'; return; }
      payload.medicamento = med;
      payload.itens = [{ medicamento:med, quantidade:'1', observacaoItem:'' }];
    } else {
      var rows = el('itens-tbody').querySelectorAll('tr');
      var itens = [];
      rows.forEach(function(tr) {
        var m = tr.querySelector('[name$="_m"]'); var q = tr.querySelector('[name$="_q"]'); var o = tr.querySelector('[name$="_o"]');
        if (m && m.value.trim()) itens.push({ medicamento:m.value.trim(), quantidade:q&&q.value||'1', observacaoItem:o&&o.value.trim()||'' });
      });
      if (!itens.length) { el('form-status').textContent = 'Adicione ao menos um medicamento.'; return; }
      var prev = el('previsaoEntrega').value;
      if (!prev) { el('form-status').textContent = 'Informe a previsão de entrega.'; return; }
      payload.itens = itens;
      payload.cliente = el('cliente').value.trim();
      payload.telefone = el('telefone').value.trim();
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

  async function salvarReposicao() {
    var rows = el('rep-itens-tbody').querySelectorAll('tr');
    var itens = [];
    rows.forEach(function(tr) {
      var i = tr.querySelector('[name$="_i"]'); var q = tr.querySelector('[name$="_q"]'); var o = tr.querySelector('[name$="_o"]');
      if (i && i.value.trim()) itens.push({ item:i.value.trim(), quantidade:q&&q.value||'', observacaoItem:o&&o.value.trim()||'' });
    });
    if (!itens.length) { el('form-status').textContent = 'Adicione ao menos um item.'; return; }
    var payload = { itens:itens, prioridade:el('reposicao-prioridade').value,
                    observacao:el('reposicao-observacao').value.trim(),
                    fornecedorSugerido:el('reposicao-fornecedor').value.trim(),
                    previsaoDesejada:el('reposicao-previsao').value||null };
    var res = await db.rpc('handover_compra_reposicao_criar', { p_token: G.token, p_payload: payload });
    if (rpcError(res)) return;
    if (res.error) { el('form-status').textContent = res.error.message || 'Erro.'; return; }
    toast('Compra registrada.', 'ok'); closeFormModal_(); markLastAction(); carregarBundle();
  }

  /* ════════════════════════════════════════
     EDIÇÃO INLINE (F2)
  ════════════════════════════════════════ */
  function editarItem(id, origem) {
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

  async function salvarEdicao(cat) {
    var payload = {};
    if (cat === 'Geral') {
      payload.titulo    = el('tituloGeral').value.trim();
      payload.descricao = el('descricao').value.trim();
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
      payload.medicamento           = el('medicamento').value.trim()                     || null;
      payload.cliente               = el('cliente').value.trim()                         || null;
      payload.telefone              = el('telefone').value.trim()                         || null;
      payload.precoVenda            = el('precoVenda').value.trim().replace(',', '.')     || null;
      payload.observacaoSolicitacao = el('observacaoSolicitacao').value.trim()           || null;
      payload.prePago               = el('prePago').checked;
      payload.formaRecebimento      = el('formaRecebimento').value                       || null;
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

  /* ════════════════════════════════════════
     COMPRADOR (F4)
  ════════════════════════════════════════ */
  async function renderComprador() {
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

  async function cancelarReposicao(id) {
    var motivo = window.prompt('Motivo do cancelamento:');
    if (motivo === null) return;
    var res = await db.rpc('handover_compra_reposicao_cancelar', {
      p_token: G.token, p_id: id, p_motivo: motivo
    });
    if (rpcError(res)) return;
    if (res.error) { toast('Erro ao cancelar.', 'erro'); return; }
    toast('Cancelado.', 'ok'); markLastAction(); carregarBundle();
  }

  /* ════════════════════════════════════════
     HELPERS DE LISTA
  ════════════════════════════════════════ */
  function renderQueueList(items, cardFn) {
    var ql = el('queue-list'); ql.innerHTML = '';
    var qe = el('queue-empty');
    if (!items || !items.length) { qe.classList.remove('hidden'); return; }
    qe.classList.add('hidden');
    items.forEach(function(item) { ql.appendChild(cardFn(item)); });
  }

  /* ════════════════════════════════════════
     DROPDOWN
  ════════════════════════════════════════ */
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

  /* ════════════════════════════════════════
     ÍCONES SVG
  ════════════════════════════════════════ */
  function icoClip_()  { return '<svg class="ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>'; }
  function icoAlert_() { return '<svg class="ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'; }
  function icoPill_()  { return '<svg class="ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="9.5" width="13" height="5" rx="2.5" transform="rotate(-45 12 12)"/></svg>'; }
  function icoWA_()    { return '<svg class="ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'; }
  function icoCheck_() { return '<svg class="ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'; }

  /* ════════════════════════════════════════
     EVENTOS
  ════════════════════════════════════════ */
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
    if (G.currentTab === 'medicamentos') renderMedicamentos();
  });
  el('form-modal-overlay').addEventListener('click', function(e) { if (e.target === el('form-modal-overlay')) closeFormModal_(); });
  el('card-detail-overlay').addEventListener('click', function(e) { if (e.target === el('card-detail-overlay')) closeCardDetailOverlay_(); });

  document.querySelectorAll('.main-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = btn.getAttribute('data-main-tab');
      if (tab === 'historico') G.historico = null;
      if (tab === 'comprador') G.compradorCache = null;  // dados frescos ao entrar na aba
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
    var items = el('novo-registro-menu') && el('novo-registro-menu').querySelectorAll('.dropdown-dd-item');
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

  /* ════════════════════════════════════════
     GLOBAIS (chamados pelo HTML via onclick)
  ════════════════════════════════════════ */
  window.refreshDashboardNow_           = refreshDashboardNow_;
  window.openNovoRegistroPendencia_     = openNovoRegistroPendencia_;
  window.openNovoRegistroEncomenda_     = openNovoRegistroEncomenda_;
  window.openNovoRegistroCompraReposicao_ = openNovoRegistroCompraReposicao_;
  window.setMainTab                     = setMainTab;
  window.onChecklistTurnoChange_        = onChecklistTurnoChange_;
  window.toggleChecklistPanel           = toggleChecklistPanel;
  window.setChecklistFilter             = setChecklistFilter;
  window.refreshChecklistToday          = refreshChecklistToday;
  window.closeAuditDrawer_              = closeAuditDrawer_;
  window.onAuditDrawerOverlayClick_     = onAuditDrawerOverlayClick_;
  window.closeCardDetailOverlay_        = closeCardDetailOverlay_;
  window.copyAuditTrailToClipboard_     = copyAuditTrailToClipboard_;
  window.addItemRow_                    = addItemRow_;
  window.addReposicaoItemRow_           = addReposicaoItemRow_;
  window.setPrevisaoOffsetDays          = setPrevisaoOffsetDays;
  window.setReposicaoPrevisaoOffsetDays_ = setReposicaoPrevisaoOffsetDays_;
  window.closeCancelMedicationModal_    = closeCancelMedicationModal_;
  window.confirmCancelMedicationModal_  = confirmCancelMedicationModal_;
  window.cancelReopenHistoricoModal_    = cancelReopenHistoricoModal_;
  window.confirmReopenHistoricoModal_   = confirmReopenHistoricoModal_;

  /* ════════════════════════════════════════
     BOOT
  ════════════════════════════════════════ */
  if (G.token && G.sessao) { abrirApp(); }

})();
