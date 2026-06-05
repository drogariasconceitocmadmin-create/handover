/* global React */
/* Handover — screen views. Exports to window. */
(function () {
  const NS = window.ConceitoIndicaDesignSystem_1bb735 || {};
  const { Button, Badge, AnimIcon, StatusDot, SegmentedControl } = NS;
  const { useState, useEffect, useRef } = React;

  // React-safe lucide icon: renders the SVG into a stable <span> via innerHTML
  // so React never reconciles the SVG internals (avoids the createIcons
  // node-replacement crash when the list re-renders from live data).
  const _pascal = (n) => String(n).split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  const _svgCache = {};
  function lucideSvg(name, size) {
    const key = name + "|" + (size || "");
    if (_svgCache[key]) return _svgCache[key];
    let html = "";
    try {
      const node = window.lucide && window.lucide.icons[_pascal(name)];
      if (node) {
        const svg = window.lucide.createElement(node);
        if (size) { svg.setAttribute("width", size); svg.setAttribute("height", size); }
        html = svg.outerHTML;
      }
    } catch (_) {}
    _svgCache[key] = html;
    return html;
  }
  const Ic = (n, props) => {
    const p = props || {};
    let size;
    if (p.style && p.style.width) size = parseInt(p.style.width, 10);
    return React.createElement("span", Object.assign({}, p, {
      className: (p.className || "") + " ho-ic",
      dangerouslySetInnerHTML: { __html: lucideSvg(n, size) },
    }));
  };

  // Small icon for meta labels
  const MetaIc = (n) => React.createElement("span", {
    className: "ho-ic",
    style: { width: 11, height: 11, flexShrink: 0, marginRight: 4, opacity: .7, display: "inline-flex" },
    dangerouslySetInnerHTML: { __html: lucideSvg(n, 11) },
  });
  const META_ICONS = {
    "Cliente":      "user",
    "Telefone":     "phone",
    "Recebimento":  "truck",
    "Atendente":    "user-check",
    "Previsão":     "calendar",
    "WhatsApp":     "message-circle",
    "Autor":        "user",
    "Urgência":     "alert-triangle",
    "Prazo":        "calendar",
    "Registrado":   "clock",
  };

  // ---- mappings ----
  const STATUS_TONE = {
    "Pendente": "warn", "Comprado": "brand", "Entregue": "pos",
    "Cancelado": "muted", "Não encontrado": "neg",
  };
  const DEADLINE = {
    vencido: { stripe: "neg", tag: ["neg", "Vencido"] },
    hoje: { stripe: "warn", tag: ["warn", "Hoje"] },
    futuro: { stripe: "muted", tag: null },
  };

  function useClickOutside(open, onClose) {
    const ref = useRef(null);
    useEffect(() => {
      if (!open) return;
      const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, [open, onClose]);
    return ref;
  }

  // ============================================================
  // Queue card — the centerpiece
  // ============================================================
  function QueueCard({ item, onToast, onDetail, onAction, index }) {
    const act = onAction || (() => onToast("Ação registrada"));
    const [menu, setMenu] = useState(false);
    const ref = useClickOutside(menu, () => setMenu(false));
    const dl = DEADLINE[item.deadline] || DEADLINE.futuro;
    const stone = STATUS_TONE[item.status] || "muted";
    const isMed = item.kind === "med";

    const meta = isMed
      ? [
          ["Cliente", item.cliente, !item.cliente || item.cliente === "—"],
          ["Telefone", item.telefone, !item.telefone || item.telefone === "—"],
          ["Recebimento", item.recebimento],
          ["Atendente", item.atendente],
          ["Previsão", item.previsao],
          ["WhatsApp", item.whatsapp ? "Avisado" : "Não avisado", !item.whatsapp],
        ]
      : null;

    const done = item.status === "Entregue" || item.status === "Cancelado";

    return React.createElement("article", {
      className: "ho-qcard", style: { animationDelay: (index * 0.04) + "s" },
    },
      React.createElement("div", { className: "ho-qstripe ho-qstripe--" + dl.stripe }),
      React.createElement("div", { className: "ho-qbody" },
        // top row
        React.createElement("div", { className: "ho-qtop" },
          React.createElement("div", { className: "ho-qbadges" },
            React.createElement("span", { className: "ho-qtag" }, isMed ? item.tipo : "Pendência"),
            React.createElement(Badge, { tone: stone }, item.status),
            dl.tag && React.createElement(Badge, { tone: dl.tag[0], dot: true }, dl.tag[1]),
            item.prePago && React.createElement(Badge, { tone: "pos" }, "Pré-pago"),
            item.urgencia === "Urgente" && React.createElement(Badge, { tone: "neg", dot: true }, "Urgente"),
          ),
          React.createElement("div", { className: "ho-qtop-right" },
            React.createElement("span", { className: "ho-qtime" }, item.criado),
            React.createElement("div", { className: "ho-kebab", ref: ref },
              React.createElement("button", { className: "ho-kebab-btn", onClick: () => setMenu(!menu), "aria-label": "Mais ações" }, Ic("more-horizontal")),
              menu && React.createElement("div", { className: "ho-kebab-menu" },
                React.createElement("button", { onClick: () => { setMenu(false); onDetail(item); } }, Ic("eye"), "Ver detalhes"),
                React.createElement("button", { onClick: () => { setMenu(false); onToast("Informações copiadas"); } }, Ic("copy"), "Copiar informações"),
                React.createElement("button", { onClick: () => { setMenu(false); onToast("Trilha de auditoria"); } }, Ic("history"), "Trilha de auditoria"),
                React.createElement("div", { className: "ho-kebab-sep" }),
                React.createElement("button", { className: "danger", onClick: () => { setMenu(false); act(item, "cancelar"); } }, Ic("x-circle"), "Cancelar solicitação"),
              ),
            ),
          ),
        ),
        // title
        React.createElement("h3", { className: "ho-qtitle" },
          isMed ? item.medicamento : item.titulo,
          isMed && item.dosagem && React.createElement("span", { style: { fontWeight: 500, color: "var(--ink-3)", fontSize: 13.5 } }, "  " + item.dosagem),
        ),
        React.createElement("p", { className: "ho-qdesc" }, item.obs || item.descricao || "—"),
        // meta grid
        isMed
          ? React.createElement("dl", { className: "ho-qmeta" },
              meta.map(([k, v, muted], i) => React.createElement("div", { className: "ho-qm", key: i },
                React.createElement("dt", null, META_ICONS[k] ? MetaIc(META_ICONS[k]) : null, k),
                React.createElement("dd", { className: muted ? "muted" : "" }, v || "—"),
              )),
            )
          : React.createElement("dl", { className: "ho-qmeta ho-qmeta--collapsed" },
              [["Autor", item.autor], ["Urgência", item.urgencia], ["Prazo", item.deadline === "hoje" ? "Hoje" : item.deadline === "vencido" ? "Vencido" : "—"], ["Registrado", item.criado]]
                .map(([k, v], i) => React.createElement("div", { className: "ho-qm", key: i },
                  React.createElement("dt", null, META_ICONS[k] ? MetaIc(META_ICONS[k]) : null, k), React.createElement("dd", null, v))),
            ),
        // actions
        React.createElement("div", { className: "ho-qfoot" },
          !done && React.createElement(Button, { variant: "primary", size: "sm", icon: Ic("check"), onClick: () => act(item, "primary") },
            isMed ? (item.status === "Pendente" ? "Marcar comprado" : "Marcar entregue") : "Resolver"),
          isMed && item.telefone && item.telefone !== "—" && React.createElement("button", { className: "ho-wa", onClick: () => act(item, "whatsapp") }, Ic("message-circle"), "WhatsApp"),
          React.createElement(Button, { variant: "ghost", size: "sm", onClick: () => onDetail(item) }, "Detalhes"),
          React.createElement("span", { className: "grow" }),
          React.createElement("span", { className: "ho-qtime", style: { display: "flex", alignItems: "center", gap: 4 } },
            Ic("clock", { style: { width: 11, height: 11, opacity: .55 } }),
            "Últ.: " + (item.ultima ? item.ultima.por + " · " + item.ultima.em : item.criado)),
        ),
      ),
    );
  }

  // ============================================================
  // Queue view — search + filters + list
  // ============================================================
  function QueueView({ kind, items, title, lede, filters, initialFilter, onToast, onDetail, onAction }) {
    const [q, setQ] = useState("");
    const [active, setActive] = useState(initialFilter || filters[0].id);
    const qRef = useRef(null);

    const af = filters.find((f) => f.id === active) || filters[0];
    let list = items.filter(af.test);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((it) =>
        (it.titulo || it.medicamento || it.item || "").toLowerCase().includes(s) ||
        (it.cliente || "").toLowerCase().includes(s) ||
        (it.telefone || "").toLowerCase().includes(s) ||
        (it.autor || "").toLowerCase().includes(s) ||
        (it.obs || "").toLowerCase().includes(s)
      );
    }

    return React.createElement(React.Fragment, null,
      React.createElement("div", { className: "ho-sechead" },
        React.createElement("div", null,
          React.createElement("div", { className: "ho-eyebrow", style: { marginBottom: 4 } }, "Passagem de turno"),
          React.createElement("h2", null, title),
          React.createElement("p", null, lede + " · " + list.length + " registro(s)"),
        ),
      ),
      React.createElement("div", { className: "ho-toolbar" },
        React.createElement("div", { className: "ho-search" },
          Ic("search"),
          React.createElement("input", { type: "search", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Buscar por item, cliente, telefone, atendente…" }),
        ),
        React.createElement("div", { className: "ho-filters" },
          filters.map((f) => {
            const ct = items.filter(f.test).length;
            return React.createElement("button", {
              key: f.id, className: "ho-filter" + (active === f.id ? " on" : ""),
              onClick: () => setActive(f.id),
            }, f.label, React.createElement("span", { className: "ct" }, ct));
          }),
        ),
      ),
      list.length
        ? React.createElement("div", { className: "ho-qlist" },
            list.map((it, i) => React.createElement(QueueCard, { key: it.id, item: it, index: i, onToast: onToast, onDetail: onDetail, onAction: onAction })),
          )
        : React.createElement("div", { className: "ho-empty" },
            Ic("inbox"),
            React.createElement("b", null, "Nada por aqui"),
            React.createElement("span", null, "Nenhum item para o filtro selecionado."),
          ),
    );
  }

  // ============================================================
  // Checklist
  // ============================================================
  function Checklist({ data, turno, onTurno, onToggle, onToast }) {
    const [filter, setFilter] = useState("todos");
    const cats = data.categories || [];

    const toggle = (ci, ii) => {
      const it = cats[ci].items[ii];
      if (it.na) return;
      const next = it.feito ? "Pendente" : "Feito";
      if (onToggle) onToggle(it, next);
    };

    const all = cats.flatMap((c) => c.items);
    const total = all.filter((x) => !x.na).length;
    const done = all.filter((x) => x.feito).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const fTest = {
      todos: () => true,
      pendentes: (x) => !x.feito && !x.na,
      feitos: (x) => x.feito,
      na: (x) => x.na,
    }[filter];

    return React.createElement(React.Fragment, null,
      React.createElement("div", { className: "ho-sechead" },
        React.createElement("div", null,
          React.createElement("div", { className: "ho-eyebrow", style: { marginBottom: 4 } }, "Rotina do turno"),
          React.createElement("h2", null, "Checklist do turno"),
          React.createElement("p", null, "Tarefas obrigatórias de abertura, limpeza e operação."),
        ),
        React.createElement(SegmentedControl, { options: ["Manhã", "Noite"], value: turno, onChange: onTurno, size: "sm" }),
      ),
      React.createElement("div", { className: "ci-card", style: { marginBottom: 16 } },
        React.createElement("div", { className: "ho-check-head", style: { marginBottom: 0 } },
          React.createElement("div", { className: "ho-progress" },
            React.createElement("div", { className: "ho-progress-top" },
              React.createElement("span", { className: "pct" }, pct + "%"),
              React.createElement("span", { className: "lbl" }, done + " de " + total + " concluídas · turno " + turno),
            ),
            React.createElement("div", { className: "ho-progress-bar" },
              React.createElement("div", { className: "ho-progress-fill", style: { width: pct + "%" } })),
          ),
        ),
      ),
      React.createElement("div", { className: "ho-filters", style: { marginBottom: 16 } },
        [["todos", "Todos"], ["pendentes", "Pendentes"], ["feitos", "Feitos"], ["na", "Não aplicáveis"]].map(([id, lb]) =>
          React.createElement("button", { key: id, className: "ho-filter" + (filter === id ? " on" : ""), onClick: () => setFilter(id) }, lb)),
      ),
      cats.map((c, ci) => {
        const visible = c.items.map((it, ii) => ({ it, ii })).filter(({ it }) => fTest(it));
        if (!visible.length) return null;
        const cdone = c.items.filter((x) => x.feito).length;
        return React.createElement("div", { className: "ho-checkcat", key: ci },
          React.createElement("div", { className: "ho-checkcat-h" },
            React.createElement("span", { className: "ttl" }, c.nome),
            React.createElement("span", { className: "meta" }, cdone + "/" + c.items.length),
          ),
          React.createElement("div", { className: "ho-checkrows" },
            visible.map(({ it, ii }) => React.createElement("div", {
              key: it.id, className: "ho-checkrow" + (it.feito ? " done" : "") + (it.na ? " na" : ""),
              onClick: () => toggle(ci, ii),
            },
              React.createElement("span", { className: "box" }, Ic("check")),
              React.createElement("div", { className: "tx" },
                React.createElement("div", { className: "tx-title" },
                  React.createElement("span", { className: "tx-name" }, it.texto),
                  it.horario && React.createElement("span", { className: "tx-time" }, it.horario),
                ),
                it.descricao && React.createElement("p", { className: "tx-desc" }, String(it.descricao).replace(/\\n/g, "\n")),
                React.createElement("div", { className: "tx-foot" },
                  React.createElement("button", {
                    className: "ho-na-btn" + (it.na ? " on" : ""),
                    onClick: (e) => { e.stopPropagation(); if (onToggle) onToggle(it, it.na ? "Pendente" : "Não aplicável"); },
                  }, it.na ? "Marcar aplicável" : "N/A"),
                ),
              ),
              it.who && !it.na && React.createElement("span", { className: "who" }, it.who),
            )),
          ),
        );
      }),
    );
  }

  // ============================================================
  // Histórico
  // ============================================================
  function Historico({ items }) {
    return React.createElement(React.Fragment, null,
      React.createElement("div", { className: "ho-sechead" },
        React.createElement("div", null,
          React.createElement("div", { className: "ho-eyebrow", style: { marginBottom: 4 } }, "Trilha"),
          React.createElement("h2", null, "Histórico recente"),
          React.createElement("p", null, "Tudo que mudou no turno, com autor e horário."),
        ),
      ),
      React.createElement("div", { className: "ho-tl" },
        items.map((e) => React.createElement("div", { className: "ho-tlitem", key: e.id },
          React.createElement("span", { className: "ho-tldot ho-tldot--" + e.tone }),
          React.createElement("div", { className: "ho-tlcard" },
            React.createElement("div", { className: "ho-tltop" },
              React.createElement("b", null, e.titulo),
              React.createElement("span", { className: "ho-tltime" }, e.time),
            ),
            React.createElement("div", { className: "ho-tldesc" }, e.desc),
            React.createElement("div", { className: "ho-tlwho" }, "por " + e.who),
          ),
        )),
      ),
    );
  }

  // ============================================================
  // Comprador
  // ============================================================
  const STATUS_CONF = {
    Comprado:       { variant: "brand",       icon: "check",     tone: "comprado" },
    Cancelado:      { variant: "destructive",  icon: "x",         tone: "cancelado" },
    "Não encontrado": { variant: "secondary",  icon: "search-x",  tone: "naoenc" },
  };
  const ACTIONS = ["Comprado", "Cancelado", "Não encontrado"];

  function BuyRow({ it, rowKey, status, onStatus, onToast, onAction }) {
    const rowClass = "ho-buyrow" + (status ? " ho-buyrow--" + STATUS_CONF[status].tone : "");
    return React.createElement("div", { className: rowClass },
      React.createElement("div", { className: "buy-actions" },
        ACTIONS.map((a) => React.createElement(Button, {
          key: a, size: "sm",
          variant: status === a ? STATUS_CONF[a].variant : "secondary",
          icon: Ic(STATUS_CONF[a].icon),
          onClick: () => { const sel = status === a ? null : a; onStatus(rowKey, sel); if (sel && onAction) onAction(it, sel); else onToast(a === "Comprado" ? "Item marcado como comprado" : a === "Cancelado" ? "Item cancelado" : "Item marcado como não encontrado"); },
          style: status && status !== a ? { opacity: .45 } : {},
        }, a)),
      ),
      React.createElement("div", { className: "nm" }, it.nm, React.createElement("small", null, it.sub)),
      React.createElement("div", { className: "buy-info" },
        React.createElement("span", { className: "qt" }, it.qtd),
        React.createElement("span", { className: "cod" }, it.cod),
      ),
    );
  }

  function Comprador({ groups, onToast, onAction }) {
    const [statuses, setStatuses] = useState({});
    const setStatus = (key, val) => setStatuses((s) => Object.assign({}, s, { [key]: val }));
    const totalItems = groups.reduce((a, g) => a + g.items.length, 0);
    const done = Object.values(statuses).filter(Boolean).length;
    return React.createElement(React.Fragment, null,
      React.createElement("div", { className: "ho-sechead" },
        React.createElement("div", null,
          React.createElement("div", { className: "ho-eyebrow", style: { marginBottom: 4 } }, "Compras"),
          React.createElement("h2", null, "Lista do comprador"),
          React.createElement("p", null, done + " de " + totalItems + " itens resolvidos · agrupados por fornecedor."),
        ),
        React.createElement(Button, { variant: "brand", size: "sm", icon: Ic("download"), onClick: () => onToast("Lista exportada") }, "Exportar lista"),
      ),
      groups.map((g, i) => React.createElement("div", { className: "ho-buygroup", key: i },
        React.createElement("div", { className: "ho-buygroup-h" },
          React.createElement(AnimIcon, { name: "estoque", size: 18 }),
          React.createElement("span", { className: "ven" }, g.fornecedor),
          React.createElement("span", { className: "ct" }, g.items.length + " itens"),
        ),
        g.items.map((it, j) => {
          const k = i + "-" + j;
          return React.createElement(BuyRow, { key: k, rowKey: k, it: it, status: statuses[k] || null, onStatus: setStatus, onToast: onToast, onAction: onAction });
        }),
      )),
    );
  }

  // ============================================================
  // Card detail modal
  // ============================================================
  function CardDetail({ item, onClose }) {
    const isMed = item.kind === "med";
    const rows = isMed
      ? [["Tipo", item.tipo], ["Status", item.status], ["Cliente", item.cliente], ["Telefone", item.telefone],
         ["Recebimento", item.recebimento], ["Atendente", item.atendente], ["Previsão", item.previsao],
         ["Fornecedor", item.fornecedor], ["Preço de venda", item.preco], ["Pré-pago", item.prePago ? "Sim" : "Não"]]
      : [["Urgência", item.urgencia], ["Autor", item.autor], ["Registrado", item.criado], ["Status", item.status]];
    return React.createElement("div", { className: "ho-overlay", onClick: onClose },
      React.createElement("div", { className: "ho-modal", onClick: (e) => e.stopPropagation() },
        React.createElement("div", { className: "ho-modal-head" },
          React.createElement("div", null,
            React.createElement("h2", null, isMed ? item.medicamento : item.titulo),
            React.createElement("div", { className: "sub" }, isMed ? item.dosagem : "Pendência da loja"),
          ),
          React.createElement("button", { className: "ho-modal-x", onClick: onClose }, Ic("x")),
        ),
        React.createElement("div", { className: "ho-modal-body ho-card-detail" },
          React.createElement("dl", null,
            rows.map(([k, v], i) => React.createElement("div", { key: i },
              React.createElement("dt", null, k), React.createElement("dd", null, v || "—"))),
          ),
          (item.obs || item.descricao) && React.createElement("div", { style: { marginTop: 16 } },
            React.createElement("div", { className: "ho-eyebrow", style: { marginBottom: 6 } }, "Observação"),
            React.createElement("p", { style: { margin: 0, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5 } }, item.obs || item.descricao),
          ),
        ),
        React.createElement("div", { className: "ho-modal-foot" },
          React.createElement(Button, { variant: "secondary", onClick: onClose }, "Fechar"),
        ),
      ),
    );
  }

  window.HandoverViews = { QueueView, Checklist, Historico, Comprador, CardDetail, Ic };
})();
