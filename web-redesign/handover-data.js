/* Handover — REAL data layer (Supabase RPCs → prototype view shapes).
   Replaces the mock HO_DATA. Exposes window.HO_API with async loaders,
   action handlers and the PascalCase→prototype mappers.

   The redesigned views (handover-views.jsx) read the same item shapes the
   mock produced, so the mappers below are the single contract point. */
window.HO_API = (function () {
  var cfg = window.HANDOVER_CONFIG || {};
  var client = (window.supabase && cfg.url)
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null;

  function rpc(fn, params) {
    if (!client) return Promise.resolve({ error: { message: "supabase indisponível" } });
    return client.rpc(fn, params || {});
  }

  // ---------- date / format helpers ----------
  function parseDate(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    var s = String(v).trim();
    // ISO (YYYY-MM-DD[ T...])
    var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    // US M/D/YYYY
    var us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (us) return new Date(+us[3], +us[1] - 1, +us[2]);
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  // "DD/MM · HH:MM"
  function fmt(v) {
    var s = String(v || "").trim();
    if (!s) return "—";
    var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (iso) return iso[3] + "/" + iso[2] + " · " + iso[4] + ":" + iso[5];
    var d = parseDate(s);
    if (d) return pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
    return s;
  }
  // "DD/MM"
  function fmtData(v) {
    var d = parseDate(v);
    if (!d) return v ? String(v) : "—";
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
  }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  function deadline(previsao, status) {
    if (["Entregue", "Cancelado", "Não encontrado"].indexOf(status) >= 0) return "futuro";
    var d = parseDate(previsao);
    if (!d) return "futuro";
    var today = startOfDay(new Date());
    var t = startOfDay(d);
    if (t < today) return "vencido";
    if (t === today) return "hoje";
    return "futuro";
  }

  // ---------- mappers ----------
  function mapMed(m) {
    return {
      kind: "med",
      raw: m,
      id: m.ID,
      tipo: m.Tipo || "Encomenda",
      medicamento: m.Medicamento || "(sem nome)",
      dosagem: m.Dosagem || "",
      status: m.Status || "Pendente",
      deadline: deadline(m.Previsao_Entrega, m.Status),
      prePago: !!m.Pre_Pago,
      obs: m.Observacao_Solicitacao || "",
      cliente: m.Cliente || "—",
      telefone: m.Telefone || "—",
      recebimento: m.Forma_Recebimento || "—",
      atendente: m.Atendente || "—",
      previsao: fmtData(m.Previsao_Entrega),
      whatsapp: m.Status_Aviso_WhatsApp === "Tentativa registrada",
      ultima: { por: m.Ultima_Acao_Por || "—", em: fmt(m.Ultima_Acao_Em || m.Timestamp) },
      preco: m.Preco_Venda ? "R$ " + m.Preco_Venda : "—",
      fornecedor: (m.Fornecedor_Compra && m.Fornecedor_Compra !== "Não informado") ? m.Fornecedor_Compra : "—",
      codigo: m.Codigo_Compra_Fornecedor || "—",
      criado: fmt(m.Timestamp || m.Ultima_Acao_Em),
    };
  }
  function mapPendencia(p) {
    return {
      kind: "geral",
      raw: p,
      id: p.ID,
      titulo: p.Titulo || "(sem título)",
      urgencia: p.Urgencia || "Normal",
      deadline: deadline(p.Data_Vencimento, p.Resolvido ? "Entregue" : "Pendente"),
      descricao: p.Descricao || "—",
      autor: p.Autor || "—",
      criado: fmt(p.Timestamp),
      status: p.Resolvido ? "Entregue" : "Pendente",
    };
  }
  function mapCompra(r) {
    var st = r.Status_Compra || "Pendente de compra";
    var status = st === "Comprado" ? "Comprado" : st === "Não encontrado" ? "Não encontrado" : "Pendente";
    var pri = r.Prioridade || "Normal";
    return {
      kind: "geral",
      raw: r,
      id: r.ID,
      titulo: r.Item || "(sem item)",
      item: r.Item || "(sem item)",
      qtd: r.Quantidade || "—",
      prioridade: pri,
      fornecedor: r.Fornecedor_Sugerido || "—",
      obs: r.Motivo || r.Observacao || "",
      urgencia: ["Alta", "Urgente"].indexOf(pri) >= 0 ? "Urgente" : "Normal",
      deadline: "futuro",
      autor: r.Solicitante || "—",
      criado: fmt(r.Data_Solicitacao),
      status: status,
    };
  }

  // ---------- loaders ----------
  function login(usuario, pin) {
    return rpc("handover_login", { p_usuario: usuario, p_pin: pin }).then(function (res) {
      if (res.error) return { ok: false, erro: "Erro de conexão." };
      var d = res.data || {};
      if (!(d.ok || d.success)) return { ok: false, erro: d.erro || "Usuário ou PIN incorretos." };
      return { ok: true, token: d.token, usuario: d.usuario, nome: d.nome, perfil: d.perfil };
    });
  }
  function logout(token) { return rpc("handover_logout", { p_token: token }).catch(function () {}); }

  function loadBundle(token, turno) {
    return rpc("handover_dashboard_bundle", { p_token: token, p_turno: turno }).then(function (res) {
      if (res.error) throw res.error;
      var b = res.data || {};
      var geral = (b.geral || []).filter(function (p) { return !p.Excluido && !p.Resolvido; });
      var cl = b.checklistTurno || null;
      return {
        medicamentos: (b.medicamentos || []).map(mapMed),
        pendencias: geral.map(mapPendencia),
        compras: (b.comprasReposicao || []).map(mapCompra),
        checklist: mapChecklist(cl),
        checklistRaw: cl,
      };
    });
  }

  function mapChecklist(cl) {
    if (!cl) return { turno: "—", categories: [], summary: null };
    var items = cl.items || [];
    var cats = [], catMap = {};
    items.forEach(function (it) {
      var c = it.Categoria || "Geral";
      if (!catMap[c]) { catMap[c] = { nome: c, items: [] }; cats.push(catMap[c]); }
      catMap[c].items.push({
        id: it.ID,
        texto: it.Item || "",
        descricao: it.Descricao || "",
        horario: it.Horario_Referencia || "",
        feito: it.Status === "Feito",
        na: it.Status === "Não aplicável",
        who: it.Responsavel ? (it.Responsavel + (it.Data_Hora_Check ? " · " + fmt(it.Data_Hora_Check) : "")) : undefined,
        status: it.Status,
      });
    });
    return { turno: cl.turno || "—", data: cl.data, categories: cats, summary: cl.summary || null };
  }

  function loadHistorico(token) {
    return rpc("handover_historico", { p_token: token, p_limit: 100 }).then(function (res) {
      if (res.error) throw res.error;
      var list = (res.data && res.data.historico) || [];
      return list.map(function (h) {
        var estado = h.Estado_Arquivo || h.Status || "Arquivado";
        var tone = estado === "Cancelado" ? "neg"
          : estado === "Entregue" ? "pos"
          : estado === "Não encontrado" ? "warn"
          : "brand";
        return {
          id: h.ID || (h.Origem + "-" + (h.Titulo || h.Medicamento || h.Item)),
          tone: tone,
          titulo: h.Titulo || h.Medicamento || h.Item || "(registro)",
          desc: (h.Origem || "") + (h.Descricao ? " · " + h.Descricao : (h.Cliente ? " · " + h.Cliente : "")),
          who: h.Resolvido_Por || h.Cancelado_Por || h.Ultima_Acao_Por || "Sistema",
          time: fmt(h.Data_Resolucao || h.Data_Cancelamento || h.Ultima_Acao_Em || h.Timestamp),
        };
      });
    });
  }

  function loadComprador(token) {
    return rpc("handover_compras_listar", { p_token: token }).then(function (res) {
      if (res.error) throw res.error;
      var d = res.data || {};
      var meds = d.medicamentos || [];
      var comp = d.comprasReposicao || [];
      var groups = [], gMap = {};
      meds.forEach(function (m) {
        var key = (m.Fornecedor_Compra && m.Fornecedor_Compra !== "Não informado") ? m.Fornecedor_Compra : "A definir";
        if (!gMap[key]) { gMap[key] = { fornecedor: key, items: [] }; groups.push(gMap[key]); }
        gMap[key].items.push({
          id: m.ID, origem: "Medicamentos", status: null,
          kind: "med",
          nm: m.Medicamento || "(sem nome)",
          sub: [m.Tipo, m.Cliente].filter(Boolean).join(" · "),
          qtd: m.Quantidade_Item || "1 cx",
          cod: m.Codigo_Compra_Fornecedor ? ("cód. " + m.Codigo_Compra_Fornecedor) : "—",
          tipo: m.Tipo || "Encomenda",
          status: m.Status || "Pendente",
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
            id: r.ID, origem: "Reposicao", status: null,
            kind: "compra",
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
    });
  }

  // ---------- actions ----------
  function medAction(token, verb, id, motivo) {
    if (verb === "whatsapp") {
      return rpc("handover_medicamento_whatsapp", { p_token: token, p_id: id }).then(function (res) {
        var d = (res && res.data) || {};
        if (d.whatsAppUrl) window.open(d.whatsAppUrl, "_blank", "noopener");
        return res;
      });
    }
    var map = {
      comprar: "handover_medicamento_comprar", entregar: "handover_medicamento_entregar",
      reverter: "handover_medicamento_reverter", cancelar: "handover_medicamento_cancelar",
    };
    var params = { p_token: token, p_id: id };
    if (motivo !== undefined) params.p_motivo = motivo;
    return rpc(map[verb], params);
  }
  function pendenciaResolver(token, id, val) {
    return rpc("handover_pendencia_resolver", { p_token: token, p_id: id, p_resolvido: val });
  }
  function checklistStatus(token, id, status) {
    return rpc("handover_checklist_status", { p_token: token, p_id: id, p_status: status });
  }
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

  // ---------- create (Novo registro) ----------
  function criarPendencia(token, titulo, descricao, urgencia) {
    return rpc("handover_pendencia_criar", { p_token: token, p_titulo: titulo, p_descricao: descricao, p_urgencia: urgencia });
  }
  function criarMedicamento(token, payload) {
    return rpc("handover_medicamento_criar", { p_token: token, p_payload: payload });
  }
  function criarCompra(token, payload) {
    return rpc("handover_compra_reposicao_criar", { p_token: token, p_payload: payload });
  }

  return {
    client: client,
    login: login, logout: logout,
    loadBundle: loadBundle, loadHistorico: loadHistorico, loadComprador: loadComprador,
    medAction: medAction, pendenciaResolver: pendenciaResolver, checklistStatus: checklistStatus,
    compradorAction: compradorAction,
    criarPendencia: criarPendencia, criarMedicamento: criarMedicamento, criarCompra: criarCompra,
    fmt: fmt, fmtData: fmtData,
  };
})();

// Minimal empty fallback so any stray reference doesn't crash before login.
window.HO_DATA = { medicamentos: [], pendencias: [], compras: [], checklist: { turno: "—", categories: [] }, historico: [], comprador: [] };
