/* Compras Conceito — camada de dados (Supabase RPCs → shapes do app).
   Backend idêntico ao Handover (mesmas RPCs SECURITY DEFINER, perfil comprador).
   Exposto em window.CO_API. */
window.CO_API = (function () {
  var cfg = window.HANDOVER_CONFIG || {};
  var client = (window.supabase && cfg.url)
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null;
  var SESS_KEY = "compras_conceito_sessao";

  function rpc(fn, params) {
    if (!client) return Promise.resolve({ error: { message: "supabase indisponível" } });
    return client.rpc(fn, params || {});
  }

  // ---------- sessão (localStorage) ----------
  function saveSession(op) {
    try { localStorage.setItem(SESS_KEY, JSON.stringify(op)); } catch (e) {}
  }
  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESS_KEY) || "null"); } catch (e) { return null; }
  }
  function clearSession() {
    try { localStorage.removeItem(SESS_KEY); } catch (e) {}
  }

  // ---------- date / format helpers ----------
  function parseDate(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    var s = String(v).trim();
    var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    var us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (us) return new Date(+us[3], +us[1] - 1, +us[2]);
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function fmt(v) {
    var s = String(v || "").trim();
    if (!s) return "—";
    var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (iso) return iso[3] + "/" + iso[2] + " · " + iso[4] + ":" + iso[5];
    var d = parseDate(s);
    if (d) return pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
    return s;
  }
  function fmtData(v) {
    var d = parseDate(v);
    if (!d) return v ? String(v) : "—";
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
  }

  // ---------- auth ----------
  function login(usuario, pin) {
    return rpc("handover_login", { p_usuario: usuario, p_pin: pin }).then(function (res) {
      if (res.error) return { ok: false, erro: "Erro de conexão." };
      var d = res.data || {};
      if (d && d.token) saveSession(d);
      return d;
    });
  }
  function logout(token) {
    clearSession();
    return Promise.resolve(rpc("handover_logout", { p_token: token })).catch(function () {});
  }
  function usuariosComPin() {
    return rpc("handover_usuarios_com_pin", {}).then(function (res) {
      if (res.error) return [];
      return (res.data || []).map(function (u) { return { u: u.Usuario, label: u.Nome }; });
    }).catch(function () { return []; });
  }
  function usuariosSemPin() {
    return rpc("handover_usuarios_sem_pin", {}).then(function (res) {
      if (res.error) return [];
      return (res.data || []).map(function (u) { return { u: u.Usuario, label: u.Nome }; });
    }).catch(function () { return []; });
  }
  // Lista de destinatários p/ mensagens: todos os usuários (com ou sem PIN),
  // exceto você mesmo, ordenados por nome.
  function destinatarios(meUser) {
    return Promise.all([usuariosComPin(), usuariosSemPin()]).then(function (arr) {
      var seen = {}, out = [];
      [].concat(arr[0] || [], arr[1] || []).forEach(function (u) {
        if (u && u.u && u.u !== meUser && !seen[u.u]) { seen[u.u] = 1; out.push(u); }
      });
      out.sort(function (a, b) { return String(a.label).localeCompare(String(b.label)); });
      return out;
    }).catch(function () { return []; });
  }
  function primeiroAcesso(usuario, pin) {
    return rpc("handover_primeiro_acesso", { p_usuario: usuario, p_pin: pin }).then(function (res) {
      if (res.error) return { ok: false, erro: "Erro de conexão." };
      var d = res.data || {};
      if (d && d.token) saveSession(d);
      return d;
    });
  }
  // valida sessão restaurada do localStorage (token ainda válido?).
  // Usa notificacoes_listar: acessível a qualquer perfil com sessão válida —
  // compras_listar daria nao_autorizado para operador e deslogaria indevidamente.
  function validarSessao(token) {
    return rpc("handover_notificacoes_listar", { p_token: token }).then(function (res) {
      return !res.error;
    }).catch(function () { return false; });
  }

  // ---------- fila de compras ----------
  function _compradorGroups(d) {
    var meds = d.medicamentos || [];
    var comp = d.comprasReposicao || [];
    var groups = [], gMap = {};
    meds.forEach(function (m) {
      var key = (m.Fornecedor_Compra && m.Fornecedor_Compra !== "Não informado") ? m.Fornecedor_Compra : "A definir";
      if (!gMap[key]) { gMap[key] = { fornecedor: key, items: [] }; groups.push(gMap[key]); }
      gMap[key].items.push({
        id: m.ID, origem: "Medicamentos", status: null, kind: "med",
        nm: m.Medicamento || "(sem nome)",
        sub: [m.Tipo, m.Cliente].filter(Boolean).join(" · "),
        qtd: m.Quantidade_Item || "1 cx",
        cod: m.Codigo_Compra_Fornecedor ? ("cód. " + m.Codigo_Compra_Fornecedor) : "—",
        tipo: m.Tipo || "Encomenda",
        statusItem: m.Status || "Pendente",
        dosagem: m.Dosagem || "",
        cliente: m.Cliente || "—",
        telefone: m.Telefone || "—",
        recebimento: m.Forma_Recebimento || "—",
        atendente: m.Atendente || "—",
        previsao: fmtData(m.Previsao_Entrega),
        prePago: !!m.Pre_Pago,
        preco: m.Preco_Venda ? ("R$ " + m.Preco_Venda) : "—",
        fornecedor: key,
        codigo: m.Codigo_Compra_Fornecedor || "—",
        obs: m.Observacao_Solicitacao || "",
      });
    });
    if (comp.length) {
      var rg = { fornecedor: "Reposição / Estoque", items: [] };
      comp.forEach(function (r) {
        rg.items.push({
          id: r.ID, origem: "Reposicao", status: null, kind: "compra",
          nm: r.Item || "(sem item)",
          sub: [r.Categoria_Compra, r.Solicitante].filter(Boolean).join(" · "),
          qtd: r.Quantidade || "—",
          cod: r.Fornecedor_Sugerido || "—",
          tipo: r.Categoria_Compra || "Reposição",
          categoria: r.Categoria_Compra || "—",
          solicitante: r.Solicitante || "—",
          prioridade: r.Prioridade || "Normal",
          fornecedorSugerido: r.Fornecedor_Sugerido || "—",
          previsao: fmtData(r.Previsao_Desejada),
          obs: r.Observacao || "",
        });
      });
      groups.push(rg);
    }
    return groups;
  }

  function loadComprador(token) {
    return rpc("handover_compras_listar", { p_token: token }).then(function (res) {
      if (res.error) throw res.error;
      return _compradorGroups(res.data || {});
    });
  }
  function loadCompradorStatus(token, status) {
    return rpc("handover_compras_listar_status", { p_token: token, p_status: status }).then(function (res) {
      if (res.error) throw res.error;
      return _compradorGroups(res.data || {});
    });
  }
  // Marca item: 'Comprado' | 'Pendente de compra' (reverter) | 'Não encontrado' | 'Cancelado'
  function compradorMarcar(token, item, rpcStatus, obs) {
    var origem = item.origem === "Medicamentos" ? "Medicamentos" : "ComprasReposicao";
    return rpc("handover_compra_marcar", { p_token: token, p_origem: origem, p_id: item.id, p_status: rpcStatus, p_obs: obs || "" });
  }
  // Dispatcher fiel ao web: aplica a RPC certa por origem do item.
  //   status: 'Comprado' | 'Não encontrado' | 'Cancelado'
  function compradorAction(token, item, status) {
    if (item.origem === "Medicamentos") {
      if (status === "Comprado" || status === "Não encontrado")
        return rpc("handover_compra_marcar", { p_token: token, p_origem: "Medicamentos", p_id: item.id, p_status: status, p_obs: "" });
      if (status === "Cancelado")
        return rpc("handover_medicamento_cancelar", { p_token: token, p_id: item.id, p_motivo: "Cancelado pelo comprador" });
    } else { // Reposicao
      if (status === "Comprado") return rpc("handover_compra_reposicao_comprar", { p_token: token, p_id: item.id });
      if (status === "Cancelado") return rpc("handover_compra_reposicao_cancelar", { p_token: token, p_id: item.id, p_motivo: "Cancelado pelo comprador" });
    }
    return Promise.resolve({ error: null });
  }

  // WhatsApp do cliente (item de medicamento já comprado): retorna URL p/ abrir.
  function medWhatsapp(token, id) {
    return rpc("handover_medicamento_whatsapp", { p_token: token, p_id: id }).then(function (res) {
      return (res && res.data) || {};
    });
  }

  // ---------- mensagens (comunicação com a loja) ----------
  function _tarefaMap(t) {
    return {
      id: t.ID, grupoId: t.Grupo_ID,
      de: t.Criado_Nome || t.Criado_Por, deUser: t.Criado_Por,
      para: t.Destinatario_Nome || t.Destinatario, paraUser: t.Destinatario,
      mensagem: t.Mensagem || "", status: t.Status || "Pendente", lido: !!t.Lido,
      criado: fmt(t.Criado_Em), concluido: t.Concluido_Em ? fmt(t.Concluido_Em) : null,
      criadoRaw: (t.Criado_Em || "").slice(0, 10),
      concluidoPor: t.Concluido_Por || null,
      respostas: (t.Respostas || []).map(function (r) {
        return { autor: r.Autor_Nome || r.Autor, autorUser: r.Autor, texto: r.Texto, quando: fmt(r.Criado_Em) };
      }),
    };
  }
  function tarefasListar(token) {
    return rpc("handover_tarefas_listar", { p_token: token }).then(function (res) {
      if (res.error) return { recebidas: [], enviadas: [], naoLidas: 0 };
      var d = res.data || {};
      return {
        recebidas: (d.recebidas || []).map(_tarefaMap),
        enviadas: (d.enviadas || []).map(_tarefaMap),
        naoLidas: d.naoLidas || 0,
      };
    }).catch(function () { return { recebidas: [], enviadas: [], naoLidas: 0 }; });
  }
  function tarefaCriar(token, destinatarios, mensagem, todos) {
    return rpc("handover_tarefa_criar", { p_token: token, p_destinatarios: destinatarios || [], p_mensagem: mensagem, p_todos: !!todos })
      .then(function (res) { return (res && res.data) || { ok: false, erro: "Erro de conexão." }; });
  }
  function tarefaResponder(token, tarefaId, texto) {
    return rpc("handover_tarefa_responder", { p_token: token, p_tarefa_id: tarefaId, p_texto: texto })
      .then(function (res) { return (res && res.data) || { ok: false }; });
  }
  function tarefaConcluir(token, tarefaId) {
    return rpc("handover_tarefa_concluir", { p_token: token, p_tarefa_id: tarefaId }).then(function (res) { return (res && res.data) || { ok: false }; });
  }
  function tarefaReabrir(token, tarefaId) {
    return rpc("handover_tarefa_reabrir", { p_token: token, p_tarefa_id: tarefaId }).then(function (res) { return (res && res.data) || { ok: false }; });
  }
  function tarefasMarcarLidas(token) {
    return Promise.resolve(rpc("handover_tarefas_marcar_lidas", { p_token: token })).catch(function () {});
  }

  // ---------- notificações in-app (badge, somente leitura) ----------
  function notificacoesListar(token) {
    return rpc("handover_notificacoes_listar", { p_token: token }).then(function (res) {
      if (res.error) return { notificacoes: [], naoLidas: 0 };
      var d = res.data || {};
      return { notificacoes: d.notificacoes || [], naoLidas: d.naoLidas || 0 };
    }).catch(function () { return { notificacoes: [], naoLidas: 0 }; });
  }

  // ---------- cotação: registra o evento na auditoria (1 linha por item) ----------
  function cotacaoRegistrar(token, items) {
    var payload = (items || []).map(function (it) {
      return { id: it.id, origem: it.origem === "Medicamentos" ? "Medicamentos" : "Reposicao", nome: it.nm };
    });
    return rpc("handover_cotacao_registrar", { p_token: token, p_itens: payload }).then(function (res) {
      if (res.error) throw res.error;
      return res.data || {};
    });
  }

  return {
    // sessão
    readSession: readSession, clearSession: clearSession, validarSessao: validarSessao,
    // auth
    login: login, logout: logout, usuariosComPin: usuariosComPin,
    usuariosSemPin: usuariosSemPin, primeiroAcesso: primeiroAcesso, destinatarios: destinatarios,
    // compras
    loadComprador: loadComprador, loadCompradorStatus: loadCompradorStatus,
    compradorMarcar: compradorMarcar, compradorAction: compradorAction, medWhatsapp: medWhatsapp,
    // mensagens
    tarefasListar: tarefasListar, tarefaCriar: tarefaCriar, tarefaResponder: tarefaResponder,
    tarefaConcluir: tarefaConcluir, tarefaReabrir: tarefaReabrir, tarefasMarcarLidas: tarefasMarcarLidas,
    // notificações + cotação
    notificacoesListar: notificacoesListar, cotacaoRegistrar: cotacaoRegistrar,
    // util
    fmt: fmt, fmtData: fmtData,
  };
})();
