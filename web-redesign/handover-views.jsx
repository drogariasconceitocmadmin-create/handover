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
  // Linha do checklist: badge de status + botões explícitos Feito/N-A/Pendente,
  // última marcação/responsável e observação editável.
  function CheckRow({ it, onStatus, onObs }) {
    const [obsOpen, setObsOpen] = useState(false);
    const [obs, setObs] = useState(it.observacao || "");
    const cur = it.na ? "Não aplicável" : (it.feito ? "Feito" : "Pendente");
    const tone = { "Feito": "done", "Não aplicável": "na", "Pendente": "pend" }[cur];
    const BTNS = [
      { label: "Feito", status: "Feito", cls: "feito" },
      { label: "N/A", status: "Não aplicável", cls: "na" },
      { label: "Pendente", status: "Pendente", cls: "pend" },
    ];
    const saveObs = () => { if (onObs) onObs(it, obs.trim()); setObsOpen(false); };
    return React.createElement("div", { className: "ho-checkrow2 " + tone },
      React.createElement("div", { className: "cr-head" },
        React.createElement("span", { className: "cr-name" }, it.texto),
        React.createElement("span", { className: "cr-badge cr-badge--" + tone }, cur),
      ),
      it.descricao ? React.createElement("p", { className: "cr-desc" }, String(it.descricao).replace(/\\n/g, "\n")) : null,
      React.createElement("div", { className: "cr-meta" },
        it.responsavel
          ? ("Última marcação: " + (it.quando || "—") + " · Responsável: " + it.responsavel)
          : "Sem marcação"),
      React.createElement("div", { className: "cr-actions" },
        BTNS.map((b) => React.createElement("button", {
          key: b.status, type: "button",
          className: "cr-btn cr-btn--" + b.cls + (cur === b.status ? " on" : ""),
          onClick: () => { if (cur !== b.status && onStatus) onStatus(it, b.status); },
        }, cur === b.status ? Ic("check") : null, b.label)),
      ),
      (it.observacao && !obsOpen) ? React.createElement("p", { className: "cr-obs" },
        React.createElement("span", { className: "cr-obs-lbl" }, "Obs: "), it.observacao) : null,
      obsOpen
        ? React.createElement("div", { className: "cr-obs-edit" },
            React.createElement("textarea", { className: "cr-obs-input", value: obs, rows: 2,
              onChange: (e) => setObs(e.target.value), placeholder: "Escreva uma observação..." }),
            React.createElement("div", { className: "cr-obs-row" },
              React.createElement("button", { type: "button", className: "cr-obs-save", onClick: saveObs }, "Salvar"),
              React.createElement("button", { type: "button", className: "cr-obs-cancel",
                onClick: () => { setObs(it.observacao || ""); setObsOpen(false); } }, "Cancelar"),
            ),
          )
        : React.createElement("button", { type: "button", className: "cr-obs-add", onClick: () => setObsOpen(true) },
            it.observacao ? "Editar observação" : "Adicionar observação"),
    );
  }

  function Checklist({ data, turno, onTurno, onToggle, onObs, onToast }) {
    const [filter, setFilter] = useState("todos");
    const [compact, setCompact] = useState(false);
    const cats = data.categories || [];

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
        React.createElement("div", { style: { display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" } },
          React.createElement(Button, { variant: compact ? "primary" : "secondary", size: "sm", icon: Ic(compact ? "list" : "layout-list"), onClick: () => setCompact((v) => !v) }, "Compacto"),
          React.createElement(SegmentedControl, { options: ["Manhã", "Noite"], value: turno, onChange: onTurno, size: "sm" }),
        ),
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
            compact
              ? visible.map(({ it }) => React.createElement("div", {
                  key: it.id, className: "ho-checkrow-c" + (it.feito ? " done" : "") + (it.na ? " na" : ""),
                  onClick: () => { if (it.na) onToggle(it, "Pendente"); else onToggle(it, it.feito ? "Pendente" : "Feito"); },
                  title: it.na ? "N/A — clique para reativar" : (it.feito ? "Feito — clique para desmarcar" : "Pendente — clique para concluir"),
                },
                  React.createElement("span", { className: "crc-box" }, Ic("check")),
                  React.createElement("span", { className: "crc-name" }, it.texto),
                  it.observacao ? React.createElement("span", { className: "crc-obs", title: it.observacao }, Ic("message-square")) : null,
                ))
              : visible.map(({ it }) => React.createElement(CheckRow, {
                  key: it.id, it: it, onStatus: onToggle, onObs: onObs,
                })),
          ),
        );
      }),
    );
  }

  // ============================================================
  // Histórico
  // ============================================================
  function Historico({ items, onDetail }) {
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
            onDetail && React.createElement("button", {
              style: { marginTop: 8, fontSize: 12, padding: "4px 8px", background: "var(--line)", border: "1px solid var(--line-2)", borderRadius: "4px", cursor: "pointer", fontFamily: "var(--font-sans)" },
              onClick: () => onDetail(e),
            }, "Ver trilha"),
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

  function BuyMeta(label, value, icon) {
    if (value === undefined || value === null || value === "" || value === "—") return null;
    return React.createElement("div", { className: "buy-meta-cell", key: label },
      React.createElement("dt", null, icon ? MetaIc(icon) : null, label),
      React.createElement("dd", null, value));
  }

  function BuyRow({ it, rowKey, status, onStatus, onToast, onAction, customActions, selectable, selected, onSelect, compact }) {
    const rowClass = "ho-buyrow" + (status ? " ho-buyrow--" + STATUS_CONF[status].tone : "") + (selected ? " sel" : "");
    const isMed = it.kind !== "compra";
    const metas = isMed
      ? [
          BuyMeta("Cliente", it.cliente, "user"),
          BuyMeta("Telefone", it.telefone, "phone"),
          BuyMeta("Atendente", it.atendente, "user-check"),
          BuyMeta("Recebimento", it.recebimento, "truck"),
          BuyMeta("Previsão", it.previsao, "calendar"),
          BuyMeta("Quantidade", it.qtd, "package"),
          BuyMeta("Cód. fornecedor", it.codigo, "hash"),
          BuyMeta("Preço de venda", it.preco, "tag"),
          it.prePago ? BuyMeta("Pré-pago", "Sim", "check-circle") : null,
        ]
      : [
          BuyMeta("Categoria", it.categoria, "layers"),
          BuyMeta("Solicitante", it.solicitante, "user"),
          BuyMeta("Prioridade", it.prioridade, "alert-circle"),
          BuyMeta("Quantidade", it.qtd, "package"),
          BuyMeta("Fornecedor sugerido", it.fornecedorSugerido, "store"),
          BuyMeta("Previsão", it.previsao, "calendar"),
        ];
    const actionsEl = customActions
      ? customActions.map((a) => React.createElement(Button, {
          key: a.label, size: "sm", variant: a.variant, icon: Ic(a.icon),
          onClick: () => a.onClick(it),
        }, a.label))
      : ACTIONS.map((a) => React.createElement(Button, {
          key: a, size: "sm",
          variant: status === a ? STATUS_CONF[a].variant : "secondary",
          icon: Ic(STATUS_CONF[a].icon),
          onClick: () => { const sel = status === a ? null : a; onStatus(rowKey, sel); if (sel && onAction) onAction(it, sel); else onToast(a === "Comprado" ? "Item marcado como comprado" : a === "Cancelado" ? "Item cancelado" : "Item marcado como não encontrado"); },
          style: status && status !== a ? { opacity: .45 } : {},
        }, a));

    // ----- Modo compacto: 2 linhas (nome·qtd·fornecedor·preço / ações) -----
    if (compact) {
      const sup = (it.fornecedor && it.fornecedor !== "—") ? it.fornecedor
        : ((it.fornecedorSugerido && it.fornecedorSugerido !== "—") ? it.fornecedorSugerido : null);
      return React.createElement("div", { className: rowClass + " ho-buyrow--compact" },
        selectable ? React.createElement("label", { className: "buy-check" },
          React.createElement("input", { type: "checkbox", checked: !!selected, onChange: () => onSelect && onSelect(it) }),
        ) : null,
        React.createElement("div", { className: "bc-body" },
          React.createElement("div", { className: "bc-line" },
            React.createElement("span", { className: "bc-nm" }, it.nm),
            (it.qtd && it.qtd !== "—") ? React.createElement("span", { className: "bc-tag" }, it.qtd) : null,
            sup ? React.createElement("span", { className: "bc-sup" }, MetaIc("store"), sup) : null,
            (it.preco && it.preco !== "—") ? React.createElement("span", { className: "bc-price" }, it.preco) : null,
          ),
          React.createElement("div", { className: "bc-actions" }, actionsEl),
        ),
      );
    }

    return React.createElement("div", { className: rowClass },
      selectable ? React.createElement("label", { className: "buy-check" },
        React.createElement("input", { type: "checkbox", checked: !!selected, onChange: () => onSelect && onSelect(it) }),
      ) : null,
      React.createElement("div", { className: "buy-actions" }, actionsEl),
      React.createElement("div", { className: "buy-body" },
        React.createElement("div", { className: "buy-head" },
          React.createElement("span", { className: "buy-tipo" }, it.tipo),
          it.status && isMed ? React.createElement("span", { className: "buy-status" }, it.status) : null,
        ),
        React.createElement("div", { className: "nm" }, it.nm, it.dosagem ? React.createElement("small", { className: "dose" }, " " + it.dosagem) : null),
        React.createElement("dl", { className: "buy-meta" }, metas.filter(Boolean)),
        it.obs ? React.createElement("p", { className: "buy-obs" },
          React.createElement("span", { className: "buy-obs-lbl" }, "Obs: "), it.obs) : null,
      ),
    );
  }

  function Comprador({ groups, token, onToast, onAction, onReverter, onComprado }) {
    const [statuses, setStatuses] = useState({});
    const [view, setView] = useState("ativos");   // 'ativos' | 'Cancelado' | 'Não encontrado'
    const [extra, setExtra] = useState(null);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [sel, setSel] = useState({});          // { itemId: item } — seleção p/ orçamento
    const [orcOpen, setOrcOpen] = useState(false);
    const [compact, setCompact] = useState(false);
    const setStatus = (key, val) => setStatuses((s) => Object.assign({}, s, { [key]: val }));
    const toggleSel = (it) => setSel((s) => { const n = Object.assign({}, s); if (n[it.id]) delete n[it.id]; else n[it.id] = it; return n; });
    const selItems = Object.values(sel);

    const matchItem = (it, s) =>
      (it.nm || "").toLowerCase().includes(s) ||
      (it.cliente || "").toLowerCase().includes(s) ||
      (it.telefone || "").toLowerCase().includes(s) ||
      (it.atendente || "").toLowerCase().includes(s) ||
      (it.solicitante || "").toLowerCase().includes(s) ||
      (it.fornecedor || it.fornecedorSugerido || "").toLowerCase().includes(s) ||
      (it.obs || "").toLowerCase().includes(s) ||
      (it.sub || "").toLowerCase().includes(s);

    const openView = (v) => {
      setSel({});  // limpa seleção ao trocar de aba
      if (v === "ativos") { setView("ativos"); setExtra(null); return; }
      setView(v); setLoading(true);
      window.HO_API.loadCompradorStatus(token, v)
        .then((g) => { setExtra(g); setLoading(false); })
        .catch(() => { setExtra([]); setLoading(false); });
    };
    const reloadExtra = () => { if (view !== "ativos") openView(view); };
    const doReverter = (it) => { onToast("Pedido revertido para a lista"); return Promise.resolve(onReverter(it)).then(reloadExtra); };
    const doComprado = (it) => { onToast("Item marcado como comprado"); return Promise.resolve(onComprado(it)).then(reloadExtra); };
    const fixActions = [
      { label: "Reverter", icon: "rotate-ccw", variant: "secondary", onClick: doReverter },
      { label: "Comprado", icon: "check", variant: "brand", onClick: doComprado },
    ];

    const base = view === "ativos" ? groups : (extra || []);
    const s = q.trim().toLowerCase();
    const showing = s
      ? base.map((g) => Object.assign({}, g, { items: g.items.filter((it) => matchItem(it, s)) })).filter((g) => g.items.length)
      : base;
    const totalItems = showing.reduce((a, g) => a + g.items.length, 0);
    const done = view === "ativos" ? Object.values(statuses).filter(Boolean).length : 0;
    const lede = view === "ativos"
      ? (done + " de " + totalItems + " itens resolvidos · agrupados por fornecedor.")
      : (view === "Cancelado" ? "Pedidos cancelados — reverta ou marque como comprado em caso de erro."
                              : "Pedidos não encontrados — reverta ou marque como comprado em caso de erro.");

    const viewBtns = [["ativos", "Lista ativa"], ["Cancelado", "Pedidos cancelados"], ["Não encontrado", "Pedidos não encontrados"]];

    return React.createElement(React.Fragment, null,
      React.createElement("div", { className: "ho-sechead" },
        React.createElement("div", null,
          React.createElement("div", { className: "ho-eyebrow", style: { marginBottom: 4 } }, "Compras"),
          React.createElement("h2", null, "Lista do comprador"),
          React.createElement("p", null, lede),
        ),
        React.createElement("div", { style: { display: "flex", gap: 9, flex: "0 0 auto" } },
          React.createElement(Button, { variant: compact ? "primary" : "secondary", size: "sm", icon: Ic(compact ? "list" : "layout-list"), onClick: () => setCompact((v) => !v) }, "Compacto"),
          view === "ativos" ? React.createElement(Button, { variant: "brand", size: "sm", icon: Ic("download"), onClick: () => onToast("Lista exportada") }, "Exportar lista") : null,
        ),
      ),
      React.createElement("div", { className: "ho-toolbar" },
        React.createElement("div", { className: "ho-search" },
          Ic("search"),
          React.createElement("input", { type: "search", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Buscar por item, cliente, telefone, fornecedor…" }),
        ),
        React.createElement("div", { className: "ho-filters" },
          viewBtns.map(([id, lb]) => React.createElement("button", {
            key: id, className: "ho-filter" + (view === id ? " on" : ""), onClick: () => openView(id),
          }, lb)),
        ),
      ),
      loading
        ? React.createElement("p", { style: { color: "var(--ink-3)", fontSize: 13.5 } }, "Carregando…")
        : showing.length === 0
          ? React.createElement("p", { style: { color: "var(--ink-3)", fontSize: 13.5 } },
              s ? "Nenhum item encontrado para a busca."
                : (view === "ativos" ? "Nenhum item pendente de compra." : "Nenhum pedido nesta categoria."))
          : showing.map((g, i) => React.createElement("div", { className: "ho-buygroup", key: i },
              React.createElement("div", { className: "ho-buygroup-h" },
                React.createElement(AnimIcon, { name: "estoque", size: 18 }),
                React.createElement("span", { className: "ven" }, g.fornecedor),
                React.createElement("span", { className: "ct" }, g.items.length + " itens"),
              ),
              g.items.map((it, j) => {
                const k = view + "-" + i + "-" + j;
                return React.createElement(BuyRow, {
                  key: k, rowKey: k, it: it, status: statuses[k] || null,
                  onStatus: setStatus, onToast: onToast, onAction: onAction,
                  customActions: view === "ativos" ? null : fixActions,
                  selectable: view === "ativos", selected: !!sel[it.id], onSelect: toggleSel,
                  compact: compact,
                });
              }),
            )),
      selItems.length > 0 ? React.createElement("div", { className: "ho-orcbar" },
        React.createElement("span", { className: "orc-count" }, selItems.length + " selecionado(s)"),
        React.createElement("button", { className: "orc-clear", onClick: () => setSel({}) }, "Limpar"),
        React.createElement(Button, { variant: "brand", icon: Ic("file-text"), onClick: () => setOrcOpen(true) }, "Solicitar orçamento"),
      ) : null,
      orcOpen ? React.createElement(OrcamentoModal, { items: selItems, onToast: onToast, onClose: () => setOrcOpen(false) }) : null,
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

  // ============================================================
  // Orçamento — selecionar itens, montar mensagem e enviar ao fornecedor
  // ============================================================
  function OrcamentoModal({ items, onClose, onToast }) {
    const buildMsg = () => {
      const linhas = items.map((it) => "• " + it.nm + (it.qtd && it.qtd !== "—" ? " — " + it.qtd : "")).join("\n");
      return "Olá! Gostaria de solicitar um orçamento dos itens abaixo:\n\n" + linhas +
        "\n\nPoderia me enviar os valores e o prazo de entrega? Obrigado!\nDrogarias Conceito";
    };
    const [fornecedor, setFornecedor] = useState("");
    const [fone, setFone] = useState("");
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState(buildMsg());

    const sendWA = () => {
      const d = (fone || "").replace(/\D/g, "");
      if (!d) return onToast("Informe o telefone (WhatsApp) do fornecedor");
      const num = d.length <= 11 ? "55" + d : d;
      window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      onToast("Abrindo WhatsApp…");
    };
    const sendEmail = () => {
      if (!email.trim()) return onToast("Informe o email do fornecedor");
      const subj = "Solicitação de orçamento" + (fornecedor.trim() ? " — " + fornecedor.trim() : "") + " · Drogarias Conceito";
      window.location.href = "mailto:" + encodeURIComponent(email.trim()) +
        "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(msg);
      onToast("Abrindo email…");
    };

    const field = (label, node) => React.createElement("div", { className: "orc-field" },
      React.createElement("label", { className: "orc-label" }, label), node);

    return React.createElement("div", { className: "ho-overlay", onClick: onClose },
      React.createElement("div", { className: "ho-modal ho-modal--wide", onClick: (e) => e.stopPropagation() },
        React.createElement("div", { className: "ho-modal-head" },
          React.createElement("div", null,
            React.createElement("h2", null, "Solicitar orçamento"),
            React.createElement("div", { className: "sub" }, items.length + " item(ns) selecionado(s)"),
          ),
          React.createElement("button", { className: "ho-modal-x", onClick: onClose }, Ic("x")),
        ),
        React.createElement("div", { className: "ho-modal-body" },
          React.createElement("div", { className: "orc-items" },
            items.map((it, i) => React.createElement("span", { key: i, className: "orc-chip" },
              it.nm + (it.qtd && it.qtd !== "—" ? " · " + it.qtd : ""))),
          ),
          React.createElement("div", { className: "orc-grid" },
            field("Fornecedor (opcional)", React.createElement("input", { className: "orc-input", value: fornecedor, onChange: (e) => setFornecedor(e.target.value), placeholder: "Nome do fornecedor" })),
            field("Telefone / WhatsApp", React.createElement("input", { className: "orc-input", inputMode: "tel", value: fone, onChange: (e) => setFone(e.target.value), placeholder: "(21) 99999-9999" })),
            field("Email", React.createElement("input", { className: "orc-input", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "fornecedor@email.com" })),
          ),
          field("Mensagem (editável)", React.createElement("textarea", { className: "orc-textarea", rows: 9, value: msg, onChange: (e) => setMsg(e.target.value) })),
        ),
        React.createElement("div", { className: "ho-modal-foot" },
          React.createElement(Button, { variant: "secondary", onClick: onClose }, "Cancelar"),
          React.createElement(Button, { variant: "secondary", icon: Ic("mail"), onClick: sendEmail }, "Enviar por email"),
          React.createElement(Button, { variant: "brand", icon: Ic("message-circle"), onClick: sendWA }, "Enviar por WhatsApp"),
        ),
      ),
    );
  }

  // ============================================================
  // Trilha — histórico completo (auditoria) de um item
  // ============================================================
  function TrilhaModal({ item, token, onClose }) {
    const [trilha, setTrilha] = useState(null);
    useEffect(() => {
      const id = item && item.id;
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { setTrilha([]); return; }
      window.HO_API.loadTrilha(token, id).then(setTrilha).catch(() => setTrilha([]));
    }, []);
    const toneFor = (a) => /cancel/i.test(a) ? "neg" : /entreg|comprad|feito|resolv/i.test(a) ? "pos" : /encontrad|revert|reabert/i.test(a) ? "warn" : "brand";
    return React.createElement("div", { className: "ho-overlay", onClick: onClose },
      React.createElement("div", { className: "ho-modal", onClick: (e) => e.stopPropagation() },
        React.createElement("div", { className: "ho-modal-head" },
          React.createElement("div", null,
            React.createElement("h2", null, item.titulo || "Item"),
            React.createElement("div", { className: "sub" }, trilha && trilha.length ? ("Histórico completo · " + trilha.length + " evento(s)") : "Histórico completo do item"),
          ),
          React.createElement("button", { className: "ho-modal-x", onClick: onClose }, Ic("x")),
        ),
        React.createElement("div", { className: "ho-modal-body" },
          trilha === null
            ? React.createElement("p", { style: { color: "var(--ink-3)", fontSize: 13.5 } }, "Carregando…")
            : trilha.length === 0
              ? React.createElement("p", { style: { color: "var(--ink-3)", fontSize: 13.5 } }, "Nenhum evento de auditoria registrado para este item.")
              : React.createElement("div", { className: "ho-tl" },
                  trilha.map((ev) => React.createElement("div", { className: "ho-tlitem", key: ev.id },
                    React.createElement("span", { className: "ho-tldot ho-tldot--" + toneFor(ev.acao) }),
                    React.createElement("div", { className: "ho-tlcard" },
                      React.createElement("div", { className: "ho-tltop" },
                        React.createElement("b", null, ev.acao + (ev.campo ? " · " + ev.campo : "")),
                        React.createElement("span", { className: "ho-tltime" }, ev.quando),
                      ),
                      React.createElement("div", { className: "ho-tldesc" }, ev.resumo || ((ev.de || "—") + " → " + (ev.para || "—"))),
                      React.createElement("div", { className: "ho-tlwho" }, "por " + ev.quem + (ev.perfil ? " · " + ev.perfil : "")),
                    ),
                  )),
                ),
        ),
        React.createElement("div", { className: "ho-modal-foot" },
          React.createElement(Button, { variant: "secondary", onClick: onClose }, "Fechar"),
        ),
      ),
    );
  }

  // ============================================================
  // Mensagens-tarefa diretas (checklist à parte)
  // ============================================================
  function MensagensModal({ data, usuarios, meUser, onClose, onCriar, onResponder, onConcluir, onReabrir, onToast }) {
    const [tab, setTab] = useState("recebidas");
    const [dest, setDest] = useState({});
    const [todos, setTodos] = useState(false);
    const [msg, setMsg] = useState("");
    const [reply, setReply] = useState({});
    const [busy, setBusy] = useState(false);

    const toggleDest = (u) => { setTodos(false); setDest((s) => { const n = Object.assign({}, s); if (n[u]) delete n[u]; else n[u] = true; return n; }); };
    const destList = Object.keys(dest);

    const enviar = () => {
      if (!msg.trim()) return onToast("Escreva a mensagem");
      if (!todos && destList.length === 0) return onToast("Escolha o destinatário");
      setBusy(true);
      Promise.resolve(onCriar(todos ? [] : destList, msg.trim(), todos)).then((r) => {
        setBusy(false);
        if (r && r.ok) { setMsg(""); setDest({}); setTodos(false); }
      });
    };
    const responder = (id) => {
      const txt = (reply[id] || "").trim();
      if (!txt) return;
      Promise.resolve(onResponder(id, txt)).then(() => setReply((s) => Object.assign({}, s, { [id]: "" })));
    };

    const card = (t, isRecebida) => React.createElement("div", { className: "msg-card" + (t.status === "Concluído" ? " done" : ""), key: t.id },
      React.createElement("div", { className: "msg-card-h" },
        React.createElement("span", { className: "msg-who" }, isRecebida ? ("De: " + t.de) : ("Para: " + t.para)),
        React.createElement("span", { className: "msg-badge msg-badge--" + (t.status === "Concluído" ? "done" : "pend") }, t.status),
        React.createElement("span", { className: "msg-time" }, t.criado),
      ),
      React.createElement("p", { className: "msg-text" }, t.mensagem),
      t.respostas.length ? React.createElement("div", { className: "msg-thread" },
        t.respostas.map((r, i) => React.createElement("div", { className: "msg-reply" + (r.autorUser === meUser ? " mine" : ""), key: i },
          React.createElement("b", null, r.autor), " ", React.createElement("span", null, r.texto),
          React.createElement("span", { className: "msg-reply-time" }, r.quando),
        ))) : null,
      React.createElement("div", { className: "msg-actions" },
        React.createElement("input", { className: "msg-reply-input", value: reply[t.id] || "", placeholder: "Responder…",
          onChange: (e) => setReply((s) => Object.assign({}, s, { [t.id]: e.target.value })),
          onKeyDown: (e) => { if (e.key === "Enter") responder(t.id); } }),
        React.createElement("button", { className: "msg-send", title: "Enviar resposta", onClick: () => responder(t.id) }, Ic("send")),
        (isRecebida && t.status !== "Concluído")
          ? React.createElement("button", { className: "msg-done", onClick: () => onConcluir(t.id) }, Ic("check"), "Concluir")
          : (t.status === "Concluído" ? React.createElement("button", { className: "msg-reopen", onClick: () => onReabrir(t.id) }, "Reabrir") : null),
      ),
    );

    const lista = tab === "recebidas" ? data.recebidas : data.enviadas;
    const pendRecebidas = data.recebidas.filter((t) => t.status !== "Concluído").length;

    return React.createElement("div", { className: "ho-overlay", onClick: onClose },
      React.createElement("div", { className: "ho-modal ho-modal--wide", onClick: (e) => e.stopPropagation() },
        React.createElement("div", { className: "ho-modal-head" },
          React.createElement("div", null,
            React.createElement("h2", null, "Mensagens"),
            React.createElement("div", { className: "sub" }, "Tarefas diretas entre a equipe"),
          ),
          React.createElement("button", { className: "ho-modal-x", onClick: onClose }, Ic("x")),
        ),
        React.createElement("div", { className: "ho-modal-body" },
          React.createElement("div", { className: "msg-compose" },
            React.createElement("div", { className: "orc-label" }, "Nova mensagem · para"),
            React.createElement("div", { className: "msg-dest" },
              React.createElement("button", { type: "button", className: "msg-chip" + (todos ? " on" : ""), onClick: () => { setTodos((v) => !v); setDest({}); } }, "Todos"),
              usuarios.map((u) => React.createElement("button", { key: u.u, type: "button", className: "msg-chip" + (dest[u.u] ? " on" : ""), onClick: () => toggleDest(u.u) }, u.label)),
            ),
            React.createElement("textarea", { className: "orc-textarea", rows: 3, value: msg, placeholder: "Escreva a tarefa/mensagem…", onChange: (e) => setMsg(e.target.value), style: { minHeight: 70 } }),
            React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 8 } },
              React.createElement(Button, { variant: "brand", icon: Ic("send"), disabled: busy, onClick: enviar }, busy ? "Enviando…" : "Enviar"),
            ),
          ),
          React.createElement("div", { className: "ho-filters", style: { margin: "16px 0 14px" } },
            React.createElement("button", { className: "ho-filter" + (tab === "recebidas" ? " on" : ""), onClick: () => setTab("recebidas") },
              "Recebidas", pendRecebidas ? React.createElement("span", { className: "ct" }, pendRecebidas) : null),
            React.createElement("button", { className: "ho-filter" + (tab === "enviadas" ? " on" : ""), onClick: () => setTab("enviadas") }, "Enviadas"),
          ),
          lista.length
            ? React.createElement("div", { className: "msg-list" }, lista.map((t) => card(t, tab === "recebidas")))
            : React.createElement("p", { style: { color: "var(--ink-3)", fontSize: 13.5 } }, tab === "recebidas" ? "Nenhuma mensagem recebida." : "Você ainda não enviou mensagens."),
        ),
        React.createElement("div", { className: "ho-modal-foot" },
          React.createElement(Button, { variant: "secondary", onClick: onClose }, "Fechar"),
        ),
      ),
    );
  }

  window.HandoverViews = { QueueView, Checklist, Historico, Comprador, CardDetail, OrcamentoModal, TrilhaModal, MensagensModal, Ic };
})();
