/* global React, ReactDOM */
/* Compras Conceito — app do comprador (PWA mobile-first). */
(function () {
  const { useState, useEffect, useRef, useCallback } = React;
  const API = window.CO_API;

  // ---- lucide icon helper (innerHTML, estável) ----
  const _pascal = (n) => String(n).split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  const _cache = {};
  function svgFor(name, size) {
    const key = name + "|" + (size || "");
    if (_cache[key]) return _cache[key];
    let html = "";
    try {
      const node = window.lucide && window.lucide.icons[_pascal(name)];
      if (node) {
        const svg = window.lucide.createElement(node);
        if (size) { svg.setAttribute("width", size); svg.setAttribute("height", size); }
        html = svg.outerHTML;
      }
    } catch (e) {}
    _cache[key] = html;
    return html;
  }
  const Ic = ({ n, size }) => React.createElement("span", {
    className: "co-ic", style: { display: "inline-flex" },
    dangerouslySetInnerHTML: { __html: svgFor(n, size) },
  });

  // ---- dropdown Glass (substitui <select> nativo) ----
  function GlassSelect({ value, options, placeholder, disabled, onChange }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    useEffect(() => {
      if (!open) return;
      const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
      document.addEventListener("mousedown", h);
      document.addEventListener("touchstart", h);
      return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
    }, [open]);
    const sel = (options || []).find((o) => o.value === value);
    const hasOpts = (options || []).length > 0;
    return React.createElement("div", { className: "gsel" + (open ? " gsel--open" : ""), ref: wrapRef },
      React.createElement("button", {
        type: "button", className: "gsel-trigger", disabled: disabled || !hasOpts,
        onClick: () => hasOpts && setOpen(!open),
      },
        React.createElement("span", { className: "gsel-val" + (!sel ? " gsel-ph" : "") },
          sel ? sel.label : (placeholder || "— Escolha —")),
        React.createElement(Ic, { n: "chevron-down", size: 20 }),
      ),
      open ? React.createElement("div", { className: "gsel-pop" },
        (options || []).map((o) => React.createElement("button", {
          key: o.value || "_", type: "button",
          className: "gsel-opt" + (o.value === value ? " on" : ""),
          onClick: () => { onChange(o.value); setOpen(false); },
        }, o.label)),
      ) : null,
    );
  }

  // =====================================================
  // LOGIN
  // =====================================================
  function Login({ onLogin }) {
    const [modo, setModo] = useState("login"); // 'login' | 'primeiro'
    const [usuarios, setUsuarios] = useState(null);
    const [user, setUser] = useState("");
    const [pin, setPin] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const carregar = useCallback((m) => {
      setUsuarios(null); setUser(""); setPin(""); setErr("");
      const fn = m === "primeiro" ? API.usuariosSemPin : API.usuariosComPin;
      fn().then(setUsuarios);
    }, []);
    useEffect(() => { carregar("login"); }, [carregar]);

    const trocar = (m) => { setModo(m); carregar(m); };

    const submit = () => {
      if (!user) return setErr("Escolha seu nome.");
      if (pin.length !== 4) return setErr("Digite os 4 dígitos do PIN.");
      setBusy(true); setErr("");
      const fn = modo === "primeiro" ? API.primeiroAcesso : API.login;
      fn(user, pin).then((d) => {
        setBusy(false);
        if (d && d.token) return onLogin(d);
        setErr(d && d.erro ? d.erro : "PIN incorreto.");
        setPin("");
      });
    };

    const onPin = (e) => {
      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
      setPin(v); setErr("");
    };

    return (
      React.createElement("div", { className: "co-login" },
        React.createElement("div", { className: "co-login-card" },
          React.createElement("div", { className: "co-login-brand" },
            React.createElement("img", { src: "icons/icon-192.png", alt: "" }),
            React.createElement("b", null, "Compras Conceito"),
            React.createElement("span", null, "App do comprador"),
          ),
          React.createElement("h1", null, modo === "primeiro" ? "Primeiro acesso" : "Entrar"),
          React.createElement("p", { className: "co-sub" },
            modo === "primeiro" ? "Defina seu PIN de 4 dígitos." : "Identifique-se para ver a fila de compras."),

          React.createElement("div", { className: "co-field" },
            React.createElement("label", null, "Seu nome"),
            React.createElement(GlassSelect, {
              value: user,
              placeholder: usuarios === null ? "Carregando…" :
                (usuarios.length ? "— Escolha —" : (modo === "primeiro" ? "Ninguém pendente" : "Nenhum usuário")),
              options: (usuarios || []).map((u) => ({ value: u.u, label: u.label })),
              onChange: (v) => { setUser(v); setErr(""); },
            }),
          ),
          React.createElement("div", { className: "co-field" },
            React.createElement("label", null, modo === "primeiro" ? "Novo PIN (4 dígitos)" : "PIN"),
            React.createElement("input", {
              className: "co-input", inputMode: "numeric", pattern: "[0-9]*", type: "password",
              maxLength: 4, value: pin, onChange: onPin, placeholder: "••••",
              onKeyDown: (e) => { if (e.key === "Enter") submit(); },
            }),
          ),
          React.createElement("p", { className: "co-err" }, err),
          React.createElement("button", { className: "co-btn", onClick: submit, disabled: busy },
            busy ? "Entrando…" : (modo === "primeiro" ? "Definir PIN e entrar" : "Entrar")),
          React.createElement("a", { className: "co-link", onClick: () => trocar(modo === "primeiro" ? "login" : "primeiro") },
            modo === "primeiro" ? "Já tenho PIN — entrar" : "Primeiro acesso?"),
        ),
      )
    );
  }

  // =====================================================
  // COMPRAS
  // =====================================================
  const VIEWS = [
    { id: "ativos", label: "A comprar" },
    { id: "Não encontrado", label: "Não encontrados" },
    { id: "Cancelado", label: "Cancelados" },
  ];

  function BuyCard({ item, view, busy, expanded, selectable, selected, onSelect, onToggle, onAction, onRevert, onWhats }) {
    const isMed = item.origem === "Medicamentos";
    const urg = item.prioridade && ["Alta", "Urgente"].indexOf(item.prioridade) >= 0;
    return (
      React.createElement("div", { className: "co-card" + (busy ? " done" : "") + (selected ? " sel" : "") },
        React.createElement("div", { className: "co-card-top" },
          selectable ? React.createElement("button", {
            type: "button", className: "co-check" + (selected ? " on" : ""), onClick: () => onSelect(item),
            "aria-label": "Selecionar item",
          }, selected ? React.createElement(Ic, { n: "check", size: 15 }) : null) : null,
          React.createElement("div", { style: { flex: 1, minWidth: 0 } },
            React.createElement("div", { className: "co-card-nm" }, item.nm),
            item.sub ? React.createElement("div", { className: "co-card-sub" }, item.sub) : null,
          ),
          urg ? React.createElement("span", { className: "co-chip co-chip--urg" }, "Urgente")
            : React.createElement("span", { className: "co-chip" }, item.qtd),
        ),

        React.createElement("div", { className: "co-meta" },
          item.qtd && !urg ? null : React.createElement("span", null, React.createElement(Ic, { n: "package" }), item.qtd),
          item.cod && item.cod !== "—" ? React.createElement("span", null, React.createElement(Ic, { n: "hash" }), item.cod) : null,
          isMed && item.previsao && item.previsao !== "—" ? React.createElement("span", null, React.createElement(Ic, { n: "calendar" }), item.previsao) : null,
          item.prePago ? React.createElement("span", null, React.createElement(Ic, { n: "badge-check" }), "Pré-pago") : null,
        ),

        expanded ? React.createElement("div", { className: "co-more" },
          isMed
            ? [
                ["Cliente", item.cliente], ["Telefone", item.telefone], ["Recebimento", item.recebimento],
                ["Atendente", item.atendente], ["Dosagem", item.dosagem || "—"], ["Obs.", item.obs || "—"],
              ].map(([k, v], i) => v && v !== "—" ?
                React.createElement("div", { className: "co-more-row", key: i },
                  React.createElement("b", null, k), React.createElement("span", null, v)) : null)
            : [
                ["Categoria", item.categoria], ["Solicitante", item.solicitante],
                ["Prioridade", item.prioridade], ["Fornecedor sug.", item.fornecedorSugerido], ["Obs.", item.obs || "—"],
              ].map(([k, v], i) => v && v !== "—" ?
                React.createElement("div", { className: "co-more-row", key: i },
                  React.createElement("b", null, k), React.createElement("span", null, v)) : null),
        ) : null,

        (item.obs || isMed) ? React.createElement("div", { className: "co-expand", onClick: onToggle },
          React.createElement(Ic, { n: expanded ? "chevron-up" : "chevron-down", size: 14 }),
          expanded ? "Menos" : "Detalhes") : null,

        view === "ativos"
          ? React.createElement("div", { className: "co-actions" },
              React.createElement("button", { className: "co-act co-act--buy", disabled: busy, onClick: () => onAction(item, "Comprado") },
                React.createElement(Ic, { n: "check", size: 16 }), "Comprei"),
              isMed ? React.createElement("button", { className: "co-act co-act--na", disabled: busy, onClick: () => onAction(item, "Não encontrado") },
                React.createElement(Ic, { n: "search-x", size: 16 }), "Não achei") : null,
              React.createElement("button", { className: "co-act co-act--cancel", disabled: busy, onClick: () => onAction(item, "Cancelado") },
                React.createElement(Ic, { n: "x", size: 16 }), "Cancelar"),
            )
          : React.createElement("div", { className: "co-actions" },
              React.createElement("button", { className: "co-act co-act--buy", disabled: busy, onClick: () => onRevert(item, "Comprado") },
                React.createElement(Ic, { n: "check", size: 16 }), "Comprei"),
              React.createElement("button", { className: "co-act", disabled: busy, onClick: () => onRevert(item, "Pendente de compra") },
                React.createElement(Ic, { n: "rotate-ccw", size: 16 }), "Reabrir"),
            ),
      )
    );
  }

  function Compras({ token, toast }) {
    const [view, setView] = useState("ativos");
    const [groups, setGroups] = useState(null);
    const [busy, setBusy] = useState({});
    const [exp, setExp] = useState({});
    const [postBuy, setPostBuy] = useState(null);
    const [sel, setSel] = useState({});     // { "origem:id": item }
    const [orcOpen, setOrcOpen] = useState(false);
    const [denied, setDenied] = useState(false); // perfil sem acesso à fila (nao_autorizado)

    const selKey = (it) => it.origem + ":" + it.id;
    const toggleSel = (it) => setSel((s) => {
      const n = Object.assign({}, s); const k = selKey(it);
      if (n[k]) delete n[k]; else n[k] = it; return n;
    });
    const selItems = Object.values(sel);

    const load = useCallback(() => {
      setGroups(null); setSel({}); setDenied(false);
      const p = view === "ativos" ? API.loadComprador(token) : API.loadCompradorStatus(token, view);
      p.then(setGroups).catch((e) => {
        setGroups([]);
        if (String((e && e.message) || e).indexOf("nao_autorizado") >= 0) setDenied(true);
        else toast("Erro ao carregar");
      });
    }, [token, view, toast]);
    useEffect(() => { load(); }, [load]);

    const removeFromGroups = (item) => {
      setGroups((gs) => (gs || []).map((g) => Object.assign({}, g, {
        items: g.items.filter((it) => !(it.id === item.id && it.origem === item.origem)),
      })).filter((g) => g.items.length));
      setSel((s) => { const n = Object.assign({}, s); delete n[selKey(item)]; return n; });
    };

    const act = (item, status) => {
      const k = item.origem + ":" + item.id;
      setBusy((b) => Object.assign({}, b, { [k]: true }));
      API.compradorAction(token, item, status).then((r) => {
        if (r && r.error) { setBusy((b) => Object.assign({}, b, { [k]: false })); return toast("Erro ao salvar"); }
        removeFromGroups(item);
        toast(status === "Comprado" ? "Comprado ✓" : status === "Cancelado" ? "Cancelado" : "Marcado: não encontrado");
        if (status === "Comprado" && item.origem === "Medicamentos" && item.telefone && item.telefone !== "—") {
          setPostBuy(item);
        }
      });
    };

    const revert = (item, status) => {
      const k = item.origem + ":" + item.id;
      setBusy((b) => Object.assign({}, b, { [k]: true }));
      API.compradorMarcar(token, item, status).then((r) => {
        if (r && r.error) { setBusy((b) => Object.assign({}, b, { [k]: false })); return toast("Erro ao salvar"); }
        removeFromGroups(item);
        toast(status === "Comprado" ? "Comprado ✓" : "Reaberto");
      });
    };

    const whats = (item) => {
      API.medWhatsapp(token, item.id).then((d) => {
        if (d && d.whatsAppUrl) { window.open(d.whatsAppUrl, "_blank", "noopener"); setPostBuy(null); }
        else toast("Não foi possível gerar o WhatsApp");
      });
    };

    const total = (groups || []).reduce((n, g) => n + g.items.length, 0);

    return (
      React.createElement(React.Fragment, null,
        React.createElement("div", { className: "co-subtabs" },
          VIEWS.map((v) => React.createElement("button", {
            key: v.id, className: "co-subtab" + (view === v.id ? " on" : ""), onClick: () => setView(v.id),
          }, v.label)),
        ),
        React.createElement("div", { className: "co-refresh-line" },
          React.createElement("button", { onClick: load },
            React.createElement(Ic, { n: "refresh-cw", size: 14 }), "Atualizar"),
        ),

        groups === null
          ? React.createElement("div", { className: "co-spinner" })
          : denied
            ? React.createElement("div", { className: "co-empty" },
                React.createElement(Ic, { n: "lock", size: 40 }),
                React.createElement("div", null, "Acesso restrito — fila de compras disponível para os perfis comprador e admin."))
          : !total
            ? React.createElement("div", { className: "co-empty" },
                React.createElement(Ic, { n: view === "ativos" ? "party-popper" : "inbox", size: 40 }),
                React.createElement("div", null, view === "ativos" ? "Fila vazia — tudo comprado!" : "Nada aqui."))
            : groups.map((g) => React.createElement("div", { className: "co-group", key: g.fornecedor },
                React.createElement("div", { className: "co-group-head" },
                  React.createElement(Ic, { n: "store", size: 14 }), g.fornecedor,
                  React.createElement("span", { className: "co-count" }, g.items.length)),
                g.items.map((it) => React.createElement(BuyCard, {
                  key: it.origem + ":" + it.id, item: it, view: view,
                  busy: !!busy[it.origem + ":" + it.id],
                  expanded: !!exp[it.origem + ":" + it.id],
                  selectable: view === "ativos", selected: !!sel[it.origem + ":" + it.id], onSelect: toggleSel,
                  onToggle: () => setExp((e) => Object.assign({}, e, { [it.origem + ":" + it.id]: !e[it.origem + ":" + it.id] })),
                  onAction: act, onRevert: revert, onWhats: whats,
                })),
              )),

        postBuy ? React.createElement("div", { className: "co-toast", style: { display: "flex", gap: 12, alignItems: "center" } },
          React.createElement("span", null, "Comprado ✓ Avisar cliente?"),
          React.createElement("button", { className: "co-btn", style: { width: "auto", padding: "7px 14px" }, onClick: () => whats(postBuy) }, "WhatsApp"),
          React.createElement("button", { className: "co-iconbtn", onClick: () => setPostBuy(null) }, React.createElement(Ic, { n: "x", size: 16 })),
        ) : null,

        selItems.length > 0 ? React.createElement("div", { className: "co-selbar" },
          React.createElement("button", { className: "co-selbar-clear", onClick: () => setSel({}) },
            React.createElement(Ic, { n: "x", size: 16 })),
          React.createElement("span", { className: "co-selbar-count" }, selItems.length + " selecionado(s)"),
          React.createElement("button", { className: "co-selbar-go", onClick: () => setOrcOpen(true) },
            React.createElement(Ic, { n: "message-circle", size: 17 }), "Fazer pedido"),
        ) : null,

        orcOpen ? React.createElement(OrcamentoSheet, { items: selItems, token: token, toast: toast, onClose: () => setOrcOpen(false) }) : null,
      )
    );
  }

  // =====================================================
  // ORÇAMENTO / PEDIDO — monta a mensagem e usa o compartilhamento nativo (escolhe contatos no WhatsApp)
  // =====================================================
  function OrcamentoSheet({ items, token, onClose, toast }) {
    const buildMsg = () => {
      const linhas = items.map((it) => "• " + it.nm + (it.qtd && it.qtd !== "—" ? " — " + it.qtd : "")).join("\n");
      return "Olá! Gostaria de fazer o pedido dos itens abaixo:\n\n" + linhas +
        "\n\nPoderia confirmar disponibilidade, valores e prazo de entrega? Obrigado!\nDrogarias Conceito";
    };
    const [msg, setMsg] = useState(buildMsg());
    const podeCompartilhar = typeof navigator !== "undefined" && !!navigator.share;

    // registra o evento de cotação na auditoria (fire-and-forget; não bloqueia o fluxo)
    const registrar = () => {
      if (!token) return;
      API.cotacaoRegistrar(token, items).catch(() => toast("Cotação enviada, mas não registrada no histórico"));
    };

    const compartilhar = async () => {
      try {
        if (navigator.share) {
          await navigator.share({ text: msg });
          registrar();
          onClose();
        } else {
          await navigator.clipboard.writeText(msg);
          registrar();
          toast("Mensagem copiada — cole no WhatsApp");
        }
      } catch (e) {
        if (e && e.name === "AbortError") return; // usuário cancelou
        try {
          await navigator.clipboard.writeText(msg);
          registrar();
          toast("Mensagem copiada — cole no WhatsApp");
        }
        catch (_) { toast("Não foi possível compartilhar"); }
      }
    };
    const copiar = async () => {
      try { await navigator.clipboard.writeText(msg); registrar(); toast("Mensagem copiada"); }
      catch (_) { toast("Não foi possível copiar"); }
    };

    return React.createElement("div", { className: "co-sheet-overlay", onClick: onClose },
      React.createElement("div", { className: "co-sheet", onClick: (e) => e.stopPropagation() },
        React.createElement("div", { className: "co-sheet-grip" }),
        React.createElement("div", { className: "co-sheet-head" },
          React.createElement("div", null,
            React.createElement("h2", null, "Fazer pedido"),
            React.createElement("div", { className: "co-sheet-sub" }, items.length + " item(ns) selecionado(s)")),
          React.createElement("button", { className: "co-iconbtn", onClick: onClose }, React.createElement(Ic, { n: "x", size: 18 })),
        ),
        React.createElement("div", { className: "co-sheet-body" },
          React.createElement("div", { className: "co-chips" },
            items.map((it, i) => React.createElement("span", { key: i, className: "co-chipitem" },
              it.nm + (it.qtd && it.qtd !== "—" ? " · " + it.qtd : ""))),
          ),
          React.createElement("div", { className: "co-sheet-note" },
            React.createElement(Ic, { n: "info", size: 15 }),
            React.createElement("span", null, "Toque em Compartilhar e escolha o WhatsApp — lá você seleciona um ou vários fornecedores pra receber a mesma mensagem."),
          ),
          React.createElement("div", { className: "co-field" },
            React.createElement("label", null, "Mensagem (editável)"),
            React.createElement("textarea", { className: "co-input", style: { minHeight: 150, resize: "vertical" }, value: msg, onChange: (e) => setMsg(e.target.value) }),
          ),
        ),
        React.createElement("div", { className: "co-sheet-foot" },
          React.createElement("button", { className: "co-btn", onClick: compartilhar },
            React.createElement(Ic, { n: "share-2", size: 18 }), podeCompartilhar ? " Compartilhar pedido" : " Copiar mensagem"),
          podeCompartilhar ? React.createElement("button", { className: "co-btn co-btn--ghost", style: { marginTop: 9 }, onClick: copiar },
            React.createElement(Ic, { n: "copy", size: 17 }), " Copiar mensagem") : null,
        ),
      )
    );
  }

  // =====================================================
  // MENSAGENS
  // =====================================================
  function Mensagens({ token, meUser, toast }) {
    const [tab, setTab] = useState("recebidas");
    const [data, setData] = useState(null);
    const [texto, setTexto] = useState("");
    const [reply, setReply] = useState({});
    const [busy, setBusy] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [dest, setDest] = useState({});     // { usuario: true }
    const [todos, setTodos] = useState(false);

    const load = useCallback((markRead) => {
      API.tarefasListar(token).then((d) => {
        setData(d);
        if (markRead && d.naoLidas) API.tarefasMarcarLidas(token);
      });
    }, [token]);
    useEffect(() => { load(true); }, [load]);
    useEffect(() => { API.destinatarios(meUser).then(setUsuarios); }, [meUser]);

    const toggleDest = (u) => { setTodos(false); setDest((s) => { const n = Object.assign({}, s); if (n[u]) delete n[u]; else n[u] = true; return n; }); };
    const destList = Object.keys(dest);

    const enviar = () => {
      if (!texto.trim()) return toast("Escreva a mensagem");
      if (!todos && destList.length === 0) return toast("Escolha o destinatário");
      setBusy(true);
      API.tarefaCriar(token, todos ? [] : destList, texto.trim(), todos).then((r) => {
        setBusy(false);
        if (r && r.ok === false && r.erro) return toast(r.erro);
        setTexto(""); setDest({}); setTodos(false); toast("Mensagem enviada"); load();
      });
    };
    const responder = (t) => {
      const txt = (reply[t.id] || "").trim();
      if (!txt) return;
      API.tarefaResponder(token, t.id, txt).then(() => {
        setReply((r) => Object.assign({}, r, { [t.id]: "" })); load();
      });
    };
    const concluir = (t) => API.tarefaConcluir(token, t.id).then(() => { toast("Concluída"); load(); });
    const reabrir = (t) => API.tarefaReabrir(token, t.id).then(() => { toast("Reaberta"); load(); });

    const lista = data ? (tab === "recebidas" ? data.recebidas : data.enviadas) : [];

    return (
      React.createElement(React.Fragment, null,
        React.createElement("div", { className: "co-compose" },
          React.createElement("div", { className: "co-compose-lbl" }, "Para"),
          React.createElement("div", { className: "co-dest" },
            React.createElement("button", { type: "button", className: "co-dchip co-dchip--all" + (todos ? " on" : ""),
              onClick: () => { setTodos((v) => !v); setDest({}); } },
              React.createElement(Ic, { n: "users", size: 14 }), "Todos"),
            usuarios.map((u) => React.createElement("button", {
              key: u.u, type: "button", className: "co-dchip" + (dest[u.u] ? " on" : ""), onClick: () => toggleDest(u.u),
            }, u.label)),
          ),
          React.createElement("textarea", { value: texto, placeholder: "Escreva a mensagem…", onChange: (e) => setTexto(e.target.value) }),
          React.createElement("div", { className: "co-compose-row" },
            React.createElement("span", { className: "co-compose-hint" },
              todos ? "Enviando para todos" : (destList.length ? destList.length + " destinatário(s)" : "Selecione quem recebe")),
            React.createElement("button", { className: "co-btn", style: { width: "auto", padding: "10px 20px" }, disabled: busy, onClick: enviar },
              React.createElement(Ic, { n: "send", size: 16 }), busy ? "Enviando…" : "Enviar"),
          ),
        ),

        React.createElement("div", { className: "co-msg-tabs" },
          React.createElement("button", { className: "co-msg-tab" + (tab === "recebidas" ? " on" : ""), onClick: () => setTab("recebidas") },
            React.createElement(Ic, { n: "inbox", size: 16 }), "Recebidas",
            data && data.naoLidas ? React.createElement("span", { className: "co-badge" }, data.naoLidas) : null),
          React.createElement("button", { className: "co-msg-tab" + (tab === "enviadas" ? " on" : ""), onClick: () => setTab("enviadas") },
            React.createElement(Ic, { n: "send", size: 16 }), "Enviadas"),
        ),

        data === null
          ? React.createElement("div", { className: "co-spinner" })
          : !lista.length
            ? React.createElement("div", { className: "co-empty" },
                React.createElement(Ic, { n: "message-square", size: 40 }),
                React.createElement("div", null, tab === "recebidas" ? "Nenhuma mensagem recebida." : "Você ainda não enviou nada."))
            : lista.map((t) => React.createElement("div", { className: "co-thread" + (tab === "recebidas" && !t.lido ? " unread" : ""), key: t.id },
                React.createElement("div", { className: "co-thread-head" },
                  React.createElement("span", { className: "co-thread-who" }, tab === "recebidas" ? t.de : ("Para: " + t.para)),
                  React.createElement("span", { className: "co-thread-when" }, t.criado)),
                React.createElement("div", { className: "co-thread-msg" }, t.mensagem),
                t.status === "Concluída" ? React.createElement("div", { className: "co-thread-done" },
                  React.createElement(Ic, { n: "check", size: 13 }), " Concluída" + (t.concluidoPor ? " por " + t.concluidoPor : "")) : null,
                t.respostas && t.respostas.length ? React.createElement("div", { className: "co-replies" },
                  t.respostas.map((r, i) => React.createElement("div", { className: "co-reply-item", key: i },
                    React.createElement("b", null, r.autor + ": "), r.texto,
                    React.createElement("span", { className: "co-rwhen" }, r.quando)))) : null,
                React.createElement("div", { className: "co-reply" },
                  React.createElement("input", { value: reply[t.id] || "", placeholder: "Responder…",
                    onChange: (e) => setReply((rr) => Object.assign({}, rr, { [t.id]: e.target.value })),
                    onKeyDown: (e) => { if (e.key === "Enter") responder(t); } }),
                  React.createElement("button", { onClick: () => responder(t) }, React.createElement(Ic, { n: "send", size: 16 })),
                ),
                tab === "recebidas" ? React.createElement("div", { style: { marginTop: 9 } },
                  t.status === "Concluída"
                    ? React.createElement("button", { className: "co-act", style: { padding: "8px" }, onClick: () => reabrir(t) },
                        React.createElement(Ic, { n: "rotate-ccw", size: 15 }), "Reabrir")
                    : React.createElement("button", { className: "co-act co-act--buy on", style: { padding: "8px" }, onClick: () => concluir(t) },
                        React.createElement(Ic, { n: "check", size: 15 }), "Marcar concluída")) : null,
              )),
      )
    );
  }

  // =====================================================
  // APP ROOT
  // =====================================================
  function App() {
    const [operador, setOperador] = useState(null);
    const [route, setRoute] = useState("compras");
    const [toastMsg, setToastMsg] = useState(null);
    const [restoring, setRestoring] = useState(true);
    const [naoLidas, setNaoLidas] = useState(0);
    const [notifCount, setNotifCount] = useState(0);
    const toastTimer = useRef(null);

    const toast = useCallback((m) => {
      setToastMsg(m);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
    }, []);

    // restaurar sessão
    useEffect(() => {
      const s = API.readSession();
      if (!s || !s.token) { setRestoring(false); return; }
      API.validarSessao(s.token).then((ok) => {
        if (ok) setOperador(s); else API.clearSession();
        setRestoring(false);
      });
    }, []);

    // badge de não lidas (mensagens + notificações in-app; poll a cada 20s)
    useEffect(() => {
      if (!operador) return;
      let alive = true;
      const tick = () => {
        API.tarefasListar(operador.token).then((d) => { if (alive) setNaoLidas(d.naoLidas || 0); });
        API.notificacoesListar(operador.token).then((d) => { if (alive) setNotifCount(d.naoLidas || 0); });
      };
      tick();
      const iv = setInterval(tick, 20000);
      return () => { alive = false; clearInterval(iv); };
    }, [operador, route]);

    const onLogin = (op) => { setOperador(op); setRoute("compras"); };
    const sair = () => { API.logout(operador && operador.token); setOperador(null); };

    if (restoring) return React.createElement("div", { className: "co-spinner", style: { marginTop: "45vh" } });
    if (!operador) return React.createElement(Login, { onLogin });

    return (
      React.createElement("div", { className: "co-app" },
        React.createElement("header", { className: "co-header" },
          React.createElement("img", { src: "icons/icon-192.png", alt: "" }),
          React.createElement("div", null,
            React.createElement("div", { className: "co-h-title" }, route === "compras" ? "Fila de compras" : "Mensagens"),
            React.createElement("div", { className: "co-h-sub" }, "Olá, " + (operador.nome || operador.usuario || "comprador")),
          ),
          React.createElement("div", { className: "co-h-spacer" }),
          notifCount > 0 ? React.createElement("span", { className: "co-h-notif", title: notifCount + " notificação(ões) não lida(s)" },
            React.createElement(Ic, { n: "bell", size: 17 }),
            React.createElement("span", { className: "co-h-notif-n" }, notifCount > 99 ? "99+" : notifCount)) : null,
          React.createElement("button", { className: "co-iconbtn", onClick: sair, title: "Sair" }, React.createElement(Ic, { n: "log-out", size: 18 })),
        ),

        React.createElement("main", { className: "co-main" },
          route === "compras"
            ? React.createElement(Compras, { token: operador.token, toast })
            : React.createElement(Mensagens, { token: operador.token, meUser: operador.usuario, toast }),
        ),

        toastMsg ? React.createElement("div", { className: "co-toast" }, toastMsg) : null,

        React.createElement("nav", { className: "co-nav" },
          React.createElement("button", { className: "co-nav-btn" + (route === "compras" ? " on" : ""), onClick: () => setRoute("compras") },
            React.createElement(Ic, { n: "shopping-cart", size: 23 }), "Compras"),
          React.createElement("button", { className: "co-nav-btn" + (route === "mensagens" ? " on" : ""), onClick: () => setRoute("mensagens") },
            React.createElement(Ic, { n: "message-circle", size: 23 }), "Mensagens",
            naoLidas ? React.createElement("span", { className: "co-nav-dot" }) : null),
        ),
      )
    );
  }

  window.CompradorApp = App;
  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
})();
