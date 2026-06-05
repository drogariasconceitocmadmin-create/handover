/* global React */
/* Handover — app shell. Renders to #root. Wired to live Supabase RPCs via HO_API. */
(function () {
  const NS = window.ConceitoIndicaDesignSystem_1bb735 || {};
  const { NavRail, ThemeToggle, Avatar, AnimIcon, Button } = NS;
  const V = window.HandoverViews;
  const F = window.HandoverForms;
  const API = window.HO_API;
  const { useState, useEffect, useRef, useCallback } = React;
  const Ic = V.Ic;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "density": "comfortable",
    "urgency": "stripe"
  }/*EDITMODE-END*/;

  const SECTIONS = [
    { label: "OPERAÇÃO", items: [
      { id: "pendencias", label: "Pendências", icon: "orcamentos" },
      { id: "encomendas", label: "Encomendas", icon: "entregas", dot: true },
      { id: "compras", label: "Compras e reposição", icon: "estoque" },
    ]},
    { label: "TURNO", items: [
      { id: "checklist", label: "Checklist", icon: "margem" },
      { id: "historico", label: "Histórico", icon: "historico" },
      { id: "comprador", label: "Compras", icon: "recebiveis" },
    ]},
  ];

  // ---- filter sets ----
  const MED_FILTERS = [
    { id: "pendentes", label: "Pendentes", test: (x) => x.status === "Pendente" },
    { id: "todos", label: "Todos", test: () => true },
    { id: "faltas", label: "Faltas", test: (x) => x.tipo === "Falta" },
    { id: "encomendas", label: "Encomendas", test: (x) => x.tipo === "Encomenda" },
    { id: "comprados", label: "Comprados", test: (x) => x.status === "Comprado" },
    { id: "vencidos", label: "Vencidos / hoje", test: (x) => x.deadline === "vencido" || x.deadline === "hoje" },
    { id: "entregues", label: "Entregues", test: (x) => x.status === "Entregue" },
    { id: "naoenc", label: "Não encontrados", test: (x) => x.status === "Não encontrado" },
  ];
  const PEND_FILTERS = [
    { id: "todos", label: "Todas", test: () => true },
    { id: "urgentes", label: "Urgentes", test: (x) => x.urgencia === "Urgente" },
    { id: "normais", label: "Normais", test: (x) => x.urgencia !== "Urgente" },
  ];
  const COMPRA_FILTERS = [
    { id: "pendentes", label: "Pendentes", test: (x) => x.status === "Pendente" },
    { id: "todos", label: "Todos", test: () => true },
    { id: "alta", label: "Alta prioridade", test: (x) => ["Alta", "Urgente"].includes(x.prioridade) },
    { id: "comprados", label: "Comprados", test: (x) => x.status === "Comprado" },
  ];

  function turnoDefault() {
    const h = new Date().getHours();
    return (h >= 5 && h < 18) ? "Manhã" : "Noite";
  }

  // ---- toasts ----
  function useToasts() {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);
    const push = (msg) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, msg }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
    };
    return [toasts, push];
  }

  // ---- Dot matrix background (unchanged from prototype) ----
  function DotMatrix({ appRef }) {
    const canvasRef = useRef(null);
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      let raf;
      const SPACING = 22;
      const DOT_R = 1.25;
      const MOUSE_RADIUS = 110;
      const MOUSE_BOOST  = 0.38;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mouse  = { x: -9999, y: -9999 };
      const smooth = { x: -9999, y: -9999 };
      const onMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      };
      const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
      const parent = canvas.parentElement;
      parent.addEventListener("mousemove", onMove);
      parent.addEventListener("mouseleave", onLeave);
      const resize = () => {
        canvas.width  = canvas.offsetWidth  * devicePixelRatio;
        canvas.height = canvas.offsetHeight * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();
      const draw = (sec) => {
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        ctx.clearRect(0, 0, w, h);
        smooth.x += (mouse.x - smooth.x) * 0.5;
        smooth.y += (mouse.y - smooth.y) * 0.5;
        const isNight = appRef && appRef.current && appRef.current.classList.contains("night");
        const ch = isNight ? "255,255,255" : "0,0,0";
        const cols  = Math.ceil(w / SPACING) + 1;
        const rows  = Math.ceil(h / SPACING) + 1;
        const bx = w * 0.62, by = h * 0.46;
        const maxD = Math.hypot(w, h) * 0.55;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = col * SPACING + 4;
            const y = row * SPACING + 4;
            const wave   = Math.sin(col * 0.28 + row * 0.14 + sec * 0.55) * 0.5 + 0.5;
            const dist   = Math.hypot(x - bx, y - by);
            const radial = Math.max(0, 1 - dist / maxD);
            const ambient = wave * 0.11 + radial * 0.09;
            const md    = Math.hypot(x - smooth.x, y - smooth.y);
            const prox  = Math.max(0, 1 - md / MOUSE_RADIUS);
            const ring  = Math.sin(md * 0.22 - sec * 4) * 0.5 + 0.5;
            const boost = prox * (0.55 + ring * 0.45) * MOUSE_BOOST;
            const dotR  = DOT_R + prox * 0.8;
            const alpha = Math.min(0.72, ambient + boost);
            ctx.beginPath();
            ctx.arc(x, y, dotR, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + ch + "," + alpha + ")";
            ctx.fill();
          }
        }
      };
      if (prefersReduced) {
        draw(0);
      } else {
        const loop = (ts) => {
          ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
          draw(ts / 1000);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      }
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        parent.removeEventListener("mousemove", onMove);
        parent.removeEventListener("mouseleave", onLeave);
      };
    }, []);
    return React.createElement("canvas", {
      ref: canvasRef,
      style: { position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none", zIndex: 0 },
    });
  }

  function App() {
    const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
    const [operador, setOperador] = useState(null);   // { nome, perfil, token, usuario }
    const [route, setRoute] = useState("encomendas");
    const [kpiFilter, setKpiFilter] = useState(null);
    const [modal, setModal] = useState(null);
    const [ddOpen, setDdOpen] = useState(false);
    const [spin, setSpin] = useState(false);
    const [iconPhase, setIconPhase] = useState("static");
    const [turno, setTurno] = useState(turnoDefault());
    const [data, setData] = useState({ medicamentos: [], pendencias: [], compras: [], checklist: { turno: "—", categories: [], summary: null }, historico: [], comprador: [] });
    const [lastSync, setLastSync] = useState("—");

    const [toasts, toast] = useToasts();
    const ddRef = useRef(null);
    const appRef = useRef(null);

    // ---- data loading ----
    const reloadBundle = useCallback((tok, tn) => {
      const token = tok || (operador && operador.token);
      if (!token) return Promise.resolve();
      return API.loadBundle(token, tn || turno).then((b) => {
        setData((d) => Object.assign({}, d, b));
        setLastSync(new Date().toTimeString().slice(0, 5));
      }).catch(() => toast("Erro ao carregar dados"));
    }, [operador, turno]);

    const reloadComprador = useCallback((tok) => {
      const token = tok || (operador && operador.token);
      if (!token) return;
      API.loadComprador(token).then((g) => setData((d) => Object.assign({}, d, { comprador: g }))).catch(() => {});
    }, [operador]);

    const reloadHistorico = useCallback((tok) => {
      const token = tok || (operador && operador.token);
      if (!token) return;
      API.loadHistorico(token).then((h) => setData((d) => Object.assign({}, d, { historico: h }))).catch(() => {});
    }, [operador]);

    // after login: initial load
    const onLogin = (op) => {
      setOperador(op);
      reloadBundle(op.token, turno);
      reloadComprador(op.token);
      reloadHistorico(op.token);
    };

    // Auto-login from localStorage for testing
    useEffect(() => {
      if (operador) return;
      const token = localStorage.getItem('ho_token');
      const usuario = localStorage.getItem('ho_user');
      const nome = localStorage.getItem('ho_nome');
      if (token && usuario && nome) {
        onLogin({ token, usuario, nome, perfil: 'operador' });
        localStorage.removeItem('ho_token');
        localStorage.removeItem('ho_user');
        localStorage.removeItem('ho_nome');
      }
    }, []);

    useEffect(() => {
      if (!operador) return;
      const iv = setInterval(() => reloadBundle(), 300000);
      return () => clearInterval(iv);
    }, [operador, reloadBundle]);

    // lazy-refresh comprador/historico when their tab opens
    useEffect(() => {
      if (!operador) return;
      if (route === "comprador") reloadComprador();
      if (route === "historico") reloadHistorico();
    }, [route, operador]);

    // reload bundle when turno changes (checklist depends on it)
    useEffect(() => {
      if (operador) reloadBundle(operador.token, turno);
    }, [turno]);

    // Inject programmable-hover rules (copies DS :hover rules, triggered by .ho-anim-run)
    useEffect(() => {
      if (document.getElementById("ho-anim-rules")) return;
      const style = document.createElement("style");
      style.id = "ho-anim-rules";
      let rules = "";
      try {
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            Array.from(sheet.cssRules || []).forEach((rule) => {
              const txt = rule.cssText;
              if (txt && txt.includes(".ci-icon-trigger:hover")) {
                rules += txt.replace(/\.ci-icon-trigger:hover/g, ".ho-anim-run .ci-icon-trigger") + "\n";
              }
            });
          } catch (_) {}
        });
      } catch (_) {}
      style.textContent = rules;
      document.head.appendChild(style);
    }, []);

    useEffect(() => {
      const iv = setInterval(() => {
        setIconPhase("playing");
        setTimeout(() => setIconPhase("static"), 1200);
      }, 5000);
      return () => clearInterval(iv);
    }, []);

    useEffect(() => {
      if (!ddOpen) return;
      const h = (e) => { if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, [ddOpen]);

    // ---- action handlers (wired to RPCs) ----
    const handleQueueAction = (item, verb) => {
      const token = operador.token;
      if (item.kind === "med") {
        if (verb === "primary") {
          const v = item.status === "Pendente" ? "comprar" : "entregar";
          API.medAction(token, v, item.id).then((r) => {
            if (r && r.error) return toast("Erro ao atualizar");
            toast(v === "comprar" ? "Marcado como comprado" : "Marcado como entregue");
            reloadBundle();
          });
        } else if (verb === "whatsapp") {
          API.medAction(token, "whatsapp", item.id).then(() => { toast("Link WhatsApp gerado"); reloadBundle(); });
        } else if (verb === "cancelar") {
          const motivo = window.prompt("Motivo do cancelamento:");
          if (motivo === null) return;
          API.medAction(token, "cancelar", item.id, motivo).then((r) => {
            if (r && r.error) return toast("Erro ao cancelar");
            toast("Solicitação cancelada"); reloadBundle();
          });
        }
      } else if (item.raw && item.raw.Urgencia !== undefined) {
        // pendência geral → resolver
        if (verb === "primary") {
          API.pendenciaResolver(token, item.id, true).then((r) => {
            if (r && r.error) return toast("Erro ao resolver");
            toast("Pendência resolvida"); reloadBundle();
          });
        } else if (verb === "cancelar") {
          toast("Use a aba de pendências para excluir");
        }
      } else {
        toast("Ação registrada");
      }
    };

    const handleChecklistToggle = (item, nextStatus) => {
      API.checklistStatus(operador.token, item.id, nextStatus).then((r) => {
        if (r && r.error) return toast("Erro no checklist");
        reloadBundle();
      });
    };

    const handleCompradorAction = (item, status) => {
      API.compradorAction(operador.token, item, status).then((r) => {
        if (r && r.error) return toast("Erro: " + status);
        toast(status === "Comprado" ? "Item marcado como comprado" : status === "Cancelado" ? "Item cancelado" : "Item marcado como não encontrado");
        reloadComprador(); reloadBundle();
      });
    };

    const handleCreate = (type, payload) => {
      const token = operador.token;
      let p;
      if (type === "pendencia") p = API.criarPendencia(token, payload.titulo, payload.descricao, payload.urgencia);
      else if (type === "encomenda") p = API.criarMedicamento(token, payload);
      else p = API.criarCompra(token, payload);
      return p.then((r) => {
        if (r && r.error) { toast("Erro ao salvar"); return false; }
        toast("Registro salvo"); reloadBundle(); reloadComprador();
        return true;
      });
    };

    const handleTurnoChange = (newTurno) => {
      setTurno(newTurno);
      reloadBundle(operador.token, newTurno);
    };

    if (!operador) {
      return React.createElement("div", { ref: appRef, className: "ho-app", style: { position: "relative" }, "data-density": t.density, "data-urg": t.urgency },
        React.createElement(DotMatrix, { appRef }),
        React.createElement(F.Login, { onEnter: onLogin }));
    }

    // KPI derivations (from live data)
    const med = data.medicamentos;
    const kEnc = med.filter((x) => x.status === "Pendente").length;
    const kSemAviso = med.filter((x) => x.status === "Comprado" && !x.whatsapp).length;
    const kVenc = med.filter((x) => x.deadline === "vencido" || x.deadline === "hoje").length;
    const allChk = data.checklist.categories.flatMap((c) => c.items).filter((x) => !x.na);
    const chkDone = allChk.filter((x) => x.feito).length;
    const kUrg = data.pendencias.filter((x) => x.urgencia === "Urgente").length;

    const KPIS = [
      { id: "k1", label: "Pendências",         icon: "orcamentos", value: data.pendencias.length, sub: "Solicitações gerais", route: "pendencias",  filter: "todos",     gstart: false },
      { id: "k2", label: "Urgentes",            icon: "alert",      value: kUrg,                  sub: "Prioridade na loja",  route: "pendencias",  filter: "urgentes",  gstart: false, alert: true },
      { id: "k3", label: "Encomendas",          icon: "entregas",   value: kEnc,                  sub: "Faltas e encomendas", route: "encomendas",  filter: "pendentes", gstart: true },
      { id: "k4", label: "Comprados s/ aviso",  icon: "contas",     value: kSemAviso,             sub: "Avisar o cliente",    route: "encomendas",  filter: "comprados", gstart: false },
      { id: "k5", label: "Vencidos / hoje",     icon: "alert",      value: kVenc,                 sub: "Cobrar ainda hoje",   route: "encomendas",  filter: "vencidos",  gstart: false, alert: kVenc > 0 },
      { id: "k6", label: "Checklist",           icon: "margem",     value: chkDone + "/" + allChk.length, sub: "Turno " + turno, route: "checklist", filter: null, gstart: true },
    ];

    const goKpi = (k) => { setRoute(k.route); setKpiFilter(k.filter); };

    const RouteTitle = {
      pendencias: ["Pendências", "orcamentos"],
      encomendas: ["Encomendas", "entregas"],
      compras: ["Compras e reposição", "estoque"],
      checklist: ["Checklist do turno", "margem"],
      historico: ["Histórico", "historico"],
      comprador: ["Comprador", "recebiveis"],
    }[route];

    let view;
    if (route === "encomendas")
      view = React.createElement(V.QueueView, { key: "enc|" + kpiFilter, kind: "med", items: med, title: "Medicamentos solicitados", lede: "Encomendas e faltas do turno", filters: MED_FILTERS, initialFilter: kpiFilter, onToast: toast, onAction: handleQueueAction, onDetail: (i) => setModal({ type: "detail", item: i }) });
    else if (route === "pendencias")
      view = React.createElement(V.QueueView, { key: "pen|" + kpiFilter, kind: "geral", items: data.pendencias, title: "Pendências da loja", lede: "Tarefas e solicitações gerais", filters: PEND_FILTERS, initialFilter: kpiFilter, onToast: toast, onAction: handleQueueAction, onDetail: (i) => setModal({ type: "detail", item: i }) });
    else if (route === "compras")
      view = React.createElement(V.QueueView, { kind: "geral", items: data.compras, title: "Compras e reposição", lede: "Estoque, sacolas, papelaria e limpeza", filters: COMPRA_FILTERS, onToast: toast, onAction: handleQueueAction, onDetail: (i) => setModal({ type: "detail", item: i }) });
    else if (route === "checklist")
      view = React.createElement(V.Checklist, { data: data.checklist, turno: turno, onTurno: handleTurnoChange, onToast: toast, onToggle: handleChecklistToggle });
    else if (route === "historico")
      view = React.createElement(V.Historico, { items: data.historico });
    else if (route === "comprador")
      view = React.createElement(V.Comprador, { groups: data.comprador, onToast: toast, onAction: handleCompradorAction });

    const showKpis = ["pendencias", "encomendas", "compras"].includes(route);
    const initials = (operador.nome || operador.usuario || "?").slice(0, 2).toUpperCase();

    return React.createElement("div", { ref: appRef, className: "ho-app", "data-density": t.density, "data-urg": t.urgency },
      React.createElement("div", { className: "ho-rail-wrap" },
        React.createElement(NavRail, {
          sections: SECTIONS, active: route, onSelect: (id) => { setRoute(id); setKpiFilter(null); },
          collapsed: false,
          brand: { name: "Handover", subtitle: "Drogarias Conceito" },
          user: { initials: initials, name: operador.nome || operador.usuario, role: operador.perfil || "Operador do turno", tone: "pink" },
        }),
      ),
      React.createElement("div", { className: "ho-main", style: { position: "relative" } },
        React.createElement(DotMatrix, { appRef }),
        // topbar
        React.createElement("div", { className: "ho-topbar", style: { position: "relative", zIndex: 2 } },
            React.createElement("div", { className: "ho-title" },
            React.createElement("div", { className: iconPhase === "playing" ? "ho-anim-run" : "" },
              React.createElement(AnimIcon, { name: RouteTitle[1], size: 36, play: "hover", className: "ho-topbar-icon" }),
            ),
            React.createElement("div", { className: "ho-title-tx" },
              React.createElement("span", null, RouteTitle[0]),
            ),
          ),
          React.createElement("div", { className: "ho-spacer" }),
          React.createElement("div", { className: "ho-syncs" },
            React.createElement("span", { className: "k" }, "Atualizado"),
            React.createElement("span", { className: "v" }, lastSync),
          ),
          React.createElement("button", { className: "ho-icbtn" + (spin ? " ho-icbtn--spin" : ""), onClick: () => { setSpin(true); reloadBundle().then(() => toast("Painel atualizado")); reloadComprador(); reloadHistorico(); setTimeout(() => setSpin(false), 700); }, "aria-label": "Atualizar agora" }, Ic("refresh-cw")),
          React.createElement(ThemeToggle, { target: ".ho-app" }),

          React.createElement("div", { className: "ho-dd", ref: ddRef },
            React.createElement(Button, { variant: "primary", icon: Ic("plus"), iconRight: Ic("chevron-down"), onClick: () => setDdOpen(!ddOpen) }, "Novo registro"),
            ddOpen && React.createElement("div", { className: "ho-dd-menu" },
              [["pendencia", "clipboard-list", "Pendência da loja", "Registrar tarefa ou pendência"],
               ["encomenda", "package", "Encomenda de medicamentos", "Falta ou encomenda de cliente"],
               ["compra", "shopping-bag", "Compra e reposição", "Estoque, limpeza, sacolas, papelaria"]].map(([id, ic, ti, hp]) =>
                React.createElement("button", { key: id, className: "ho-dd-item", onClick: () => { setDdOpen(false); setModal({ type: "novo", initial: id }); } },
                  React.createElement("span", { className: "ho-dd-ico" }, Ic(ic)),
                  React.createElement("span", { className: "ho-dd-tx" }, React.createElement("b", null, ti), React.createElement("span", null, hp)),
                )),
            ),
          ),
        ),
        // content
        React.createElement("div", { className: "ho-scroll", style: { position: "relative", zIndex: 1 } },
          React.createElement("div", { className: "ho-page" },
            showKpis && React.createElement("div", { className: "ho-kstrip" },
              KPIS.map((k) => {
                const cls = "ho-kcell ho-kpi"
                  + (k.alert ? " alert" : "")
                  + (k.gstart ? " ho-kcell--gstart" : "")
                  + (kpiFilter === k.filter && route === k.route ? " on" : "");
                return React.createElement("div", { key: k.id, className: cls, role: "button", tabIndex: 0, onClick: () => goKpi(k) },
                  React.createElement("div", { className: "ho-kpi-l" }, React.createElement(AnimIcon, { name: k.icon, size: 14, play: "none" }), k.label),
                  React.createElement("div", { className: "ho-kpi-v" }, k.value),
                  React.createElement("div", { className: "ho-kpi-s" }, k.sub),
                );
              }),
            ),
            view,
          ),
        ),
      ),
      // modals
      modal && modal.type === "novo" && React.createElement(F.NovoRegistro, { initial: modal.initial, operador: operador.nome || operador.usuario, onClose: () => setModal(null), onToast: toast, onCreate: handleCreate }),
      modal && modal.type === "detail" && React.createElement(V.CardDetail, { item: modal.item, onClose: () => setModal(null) }),
      // tweaks
      React.createElement(window.TweaksPanel, null,
        React.createElement(window.TweakSection, { label: "Densidade dos cards" }),
        React.createElement(window.TweakRadio, { label: "Densidade", value: t.density, options: ["comfortable", "compact"], onChange: (v) => setTweak("density", v) }),
        React.createElement(window.TweakSection, { label: "Sinal de urgência" }),
        React.createElement(window.TweakRadio, { label: "Marcação", value: t.urgency, options: ["stripe", "tag"], onChange: (v) => setTweak("urgency", v) }),
      ),
      // toasts
      React.createElement("div", { className: "ho-toasts" },
        toasts.map((x) => React.createElement("div", { className: "ho-toast", key: x.id }, Ic("check-circle"), x.msg))),
    );
  }

  window.HandoverApp = App;
})();
