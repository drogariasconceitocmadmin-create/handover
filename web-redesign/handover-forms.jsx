/* global React */
/* Handover — Novo registro modal + Login. Exports to window. */
(function () {
  const NS = window.ConceitoIndicaDesignSystem_1bb735 || {};
  const { Button } = NS;
  const { useState } = React;
  const Ic = (window.HandoverViews && window.HandoverViews.Ic)
    || ((n, p) => React.createElement("span", p));

  const Field = ({ label, children }) =>
    React.createElement("div", { className: "ho-field" },
      React.createElement("label", null, label), children);

  const Input = (p) => React.createElement("input", Object.assign({ className: "ho-input" }, p));
  const Select = ({ children, ...p }) => React.createElement("select", Object.assign({ className: "ho-select" }, p), children);
  const Textarea = (p) => React.createElement("textarea", Object.assign({ className: "ho-textarea" }, p));

  // Helper to format date as YYYY-MM-DD
  const fmtDateISO = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };

  // Date shortcuts component
  const DateInput = (p) => {
    const inputRef = React.useRef(null);
    const setDate = (daysOffset) => {
      const d = new Date();
      d.setDate(d.getDate() + daysOffset);
      const iso = fmtDateISO(d);
      if (inputRef.current) {
        inputRef.current.value = iso;
        inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
    return React.createElement("div", null,
      React.createElement("input", Object.assign({ ref: inputRef, className: "ho-input" }, p, { type: "date" })),
      React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" } },
        React.createElement("button", { type: "button", className: "ho-date-btn", onClick: () => setDate(1) }, "Amanhã"),
        React.createElement("button", { type: "button", className: "ho-date-btn", onClick: () => setDate(2) }, "Depois de amanhã"),
        React.createElement("button", { type: "button", className: "ho-date-btn", onClick: () => setDate(7) }, "Semana que vem"),
      ),
    );
  };

  const TYPES = [
    { id: "pendencia", label: "Pendência da loja", icon: "clipboard-list", help: "Tarefa ou pendência do turno" },
    { id: "encomenda", label: "Encomenda / falta", icon: "package", help: "Medicamento para encomendar" },
    { id: "compra", label: "Compra e reposição", icon: "shopping-bag", help: "Estoque, sacolas, papelaria…" },
  ];

  function NovoRegistro({ initial, operador, onClose, onToast, onCreate }) {
    const [type, setType] = useState(initial || "encomenda");
    const formRef = React.useRef(null);

    const val = (name) => {
      const f = formRef.current;
      if (!f) return "";
      const el = f.elements[name];
      if (!el) return "";
      return el.type === "checkbox" ? el.checked : (el.value || "").trim();
    };

    const submit = (e) => {
      e.preventDefault();
      let payload;
      if (type === "pendencia") {
        if (!val("titulo")) { onToast("Informe o título"); return; }
        payload = { titulo: val("titulo"), descricao: val("descricao"), urgencia: val("urgencia") || "Normal" };
      } else if (type === "encomenda") {
        const med = val("medicamento");
        if (!med) { onToast("Informe o medicamento"); return; }
        payload = {
          tipo: val("tipo") || "Encomenda",
          atendente: operador,
          fornecedorCompra: val("fornecedorCompra"),
          codigoCompraFornecedor: "",
          precoVenda: null,
          observacaoSolicitacao: val("observacaoSolicitacao"),
          medicamento: med,
          itens: [{ medicamento: med, quantidade: "1", observacaoItem: "" }],
          cliente: val("cliente"),
          telefone: val("telefone"),
          prePago: val("prePago"),
          formaRecebimento: val("formaRecebimento"),
          previsaoEntrega: val("previsaoEntrega") || null,
        };
      } else {
        const item = val("item");
        if (!item) { onToast("Informe o item"); return; }
        payload = {
          itens: [{ item: item, quantidade: val("quantidade") || "", observacaoItem: val("observacao") }],
          prioridade: val("prioridade") || "Normal",
          observacao: val("observacao"),
          fornecedorSugerido: val("fornecedorSugerido"),
          previsaoDesejada: null,
        };
      }
      const res = onCreate ? onCreate(type, payload) : Promise.resolve(true);
      Promise.resolve(res).then((ok) => { if (ok !== false) onClose(); });
    };

    return React.createElement("div", { className: "ho-overlay", onClick: onClose },
      React.createElement("div", { className: "ho-modal", onClick: (e) => e.stopPropagation() },
        React.createElement("div", { className: "ho-modal-head" },
          React.createElement("div", null,
            React.createElement("h2", null, "Novo registro"),
            React.createElement("div", { className: "sub" }, "Operador: " + operador),
          ),
          React.createElement("button", { className: "ho-modal-x", onClick: onClose }, Ic("x")),
        ),
        React.createElement("form", { className: "ho-modal-body", onSubmit: submit, id: "ho-form", ref: formRef },
          // type segmented
          React.createElement("div", { className: "ho-field" },
            React.createElement("label", null, "Tipo de registro"),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 } },
              TYPES.map((t) => React.createElement("button", {
                key: t.id, type: "button",
                onClick: () => setType(t.id),
                style: {
                  display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start",
                  padding: "var(--sp-4) var(--sp-4)", cursor: "pointer", textAlign: "left",
                  borderRadius: "var(--radius-sm)", fontFamily: "var(--font-sans)",
                  border: "1px solid " + (type === t.id ? "var(--brand)" : "var(--line)"),
                  background: type === t.id ? "var(--brand-soft)" : "var(--panel)",
                  color: type === t.id ? "var(--brand)" : "var(--ink-2)",
                  transition: "all var(--dur-2)",
                },
              },
                Ic(t.icon, { style: { width: 18, height: 18 } }),
                React.createElement("span", { style: { fontSize: 12, fontWeight: 600, lineHeight: 1.2 } }, t.label),
              )),
            ),
          ),

          type === "pendencia" && React.createElement(React.Fragment, null,
            React.createElement(Field, { label: "Título / assunto" }, React.createElement(Input, { name: "titulo", placeholder: "Resumo curto da solicitação" })),
            React.createElement("div", { className: "ho-field-row" },
              React.createElement(Field, { label: "Urgência" }, React.createElement(Select, { name: "urgencia" },
                React.createElement("option", null, "Normal"), React.createElement("option", null, "Urgente"))),
              React.createElement(Field, { label: "Prazo (opcional)" }, React.createElement(DateInput, { name: "prazo" })),
            ),
            React.createElement(Field, { label: "Descrição" }, React.createElement(Textarea, { name: "descricao", placeholder: "Detalhe a pendência…" })),
          ),

          type === "encomenda" && React.createElement(React.Fragment, null,
            React.createElement("div", { className: "ho-field-row" },
              React.createElement(Field, { label: "Tipo" }, React.createElement(Select, { name: "tipo" },
                React.createElement("option", null, "Encomenda"), React.createElement("option", null, "Falta"))),
              React.createElement(Field, { label: "Fornecedor de compra" }, React.createElement(Select, { name: "fornecedorCompra" },
                React.createElement("option", null, "Não informado"), React.createElement("option", null, "Panpharma"), React.createElement("option", null, "Santa Cruz"))),
            ),
            React.createElement(Field, { label: "Medicamento" }, React.createElement(Input, { name: "medicamento", placeholder: "Ex.: Losartana 50MG C/ 30 comp" })),
            React.createElement("div", { className: "ho-field-row" },
              React.createElement(Field, { label: "Cliente" }, React.createElement(Input, { name: "cliente", placeholder: "Nome do cliente" })),
              React.createElement(Field, { label: "Telefone" }, React.createElement(Input, { name: "telefone", placeholder: "(21) 91234-5678" })),
            ),
            React.createElement("div", { className: "ho-field-row" },
              React.createElement(Field, { label: "Forma de recebimento" }, React.createElement(Select, { name: "formaRecebimento" },
                React.createElement("option", null, "A combinar"), React.createElement("option", null, "Retira na loja"), React.createElement("option", null, "Entregar no endereço"))),
              React.createElement(Field, { label: "Previsão de entrega" }, React.createElement(DateInput, { name: "previsaoEntrega" })),
            ),
            React.createElement("label", { className: "ho-checkrow-inline", style: { marginBottom: 14 } },
              React.createElement("input", { type: "checkbox", name: "prePago" }), React.createElement("span", null, "Cliente já deixou pago (pré-pago)")),
            React.createElement(Field, { label: "Observação da solicitação" },
              React.createElement(Textarea, { name: "observacaoSolicitacao", placeholder: "Ex.: aceita similar, laboratório específico…" })),
          ),

          type === "compra" && React.createElement(React.Fragment, null,
            React.createElement(Field, { label: "Item / produto" }, React.createElement(Input, { name: "item", placeholder: "Ex.: Sacola P, papel térmico, detergente" })),
            React.createElement("div", { className: "ho-field-row" },
              React.createElement(Field, { label: "Quantidade" }, React.createElement(Input, { name: "quantidade", placeholder: "Ex.: 2 caixas, 10 un" })),
              React.createElement(Field, { label: "Prioridade" }, React.createElement(Select, { name: "prioridade" },
                React.createElement("option", null, "Baixa"), React.createElement("option", null, "Normal"), React.createElement("option", null, "Alta"), React.createElement("option", null, "Urgente"))),
            ),
            React.createElement(Field, { label: "Fornecedor sugerido (opcional)" }, React.createElement(Input, { name: "fornecedorSugerido", placeholder: "Onde costumamos comprar" })),
            React.createElement(Field, { label: "Observação (opcional)" }, React.createElement(Textarea, { name: "observacao" })),
          ),
        ),
        React.createElement("div", { className: "ho-modal-foot" },
          React.createElement(Button, { variant: "ghost", onClick: onClose }, "Cancelar"),
          React.createElement(Button, { variant: "brand", type: "submit", form: "ho-form", icon: Ic("check") }, "Salvar registro"),
        ),
      ),
    );
  }

  // ---- Login ----
  const MARK = React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M22 12h-4l-3 9L9 3l-3 9H2" }));

  const USERS = [
    { u: "isaque", label: "Isaque" }, { u: "ainale", label: "Ainale" },
    { u: "priscila", label: "Priscila" }, { u: "jelcinei", label: "Jelcinei" },
    { u: "carlos", label: "Carlos" }, { u: "marco", label: "Marco" },
    { u: "marcelo", label: "Marcelo" },
  ];

  function Login({ onEnter }) {
    const API = window.HO_API;
    const [user, setUser] = useState("");
    const [pin, setPin] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const entrar = () => {
      setErr("");
      if (!user || !pin) { setErr("Informe usuário e PIN."); return; }
      setBusy(true);
      API.login(user, pin).then((r) => {
        setBusy(false);
        if (!r.ok) { setErr(r.erro || "Falha no login."); return; }
        onEnter({ token: r.token, nome: r.nome, usuario: r.usuario, perfil: r.perfil });
      });
    };

    return React.createElement("div", { className: "ho-login" },
      React.createElement("div", { className: "ho-login-card" },
        React.createElement("div", { className: "ho-login-brand" },
          React.createElement("div", { className: "ho-login-mark" }, MARK),
          React.createElement("b", null, "Drogarias Conceito"),
          React.createElement("span", null, "Handover — acesso com PIN"),
        ),
        React.createElement("h1", null, "Entrar"),
        React.createElement("p", { className: "lede" }, "Identifique-se para abrir o turno."),
        React.createElement(Field, { label: "Usuário" },
          React.createElement(Select, { value: user, onChange: (e) => setUser(e.target.value) },
            React.createElement("option", { value: "" }, "— Escolha —"),
            USERS.map((n) => React.createElement("option", { key: n.u, value: n.u }, n.label)))),
        React.createElement(Field, { label: "PIN" },
          React.createElement(Input, { type: "password", inputMode: "numeric", value: pin,
            onChange: (e) => setPin(e.target.value),
            onKeyDown: (e) => { if (e.key === "Enter") entrar(); }, placeholder: "••••" })),
        err && React.createElement("p", { style: { margin: "0 0 12px", fontSize: 12.5, color: "var(--neg)" } }, err),
        React.createElement(Button, { variant: "primary", block: true, onClick: entrar, disabled: busy }, busy ? "Entrando…" : "Entrar"),
      ),
    );
  }

  window.HandoverForms = { NovoRegistro, Login };
})();
