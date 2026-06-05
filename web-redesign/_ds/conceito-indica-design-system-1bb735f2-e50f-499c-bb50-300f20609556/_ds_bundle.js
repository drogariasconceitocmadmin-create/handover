/* @ds-bundle: {"format":3,"namespace":"ConceitoIndicaDesignSystem_1bb735","components":[{"name":"AskAIBar","sourcePath":"components/brand/AskAIBar.jsx"},{"name":"ThemeToggle","sourcePath":"components/brand/ThemeToggle.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"StatusDot","sourcePath":"components/core/StatusDot.jsx"},{"name":"TrendPill","sourcePath":"components/core/TrendPill.jsx"},{"name":"AnimIcon","sourcePath":"components/icons/AnimIcon.jsx"},{"name":"NavRail","sourcePath":"components/navigation/NavRail.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"KpiCard","sourcePath":"components/surfaces/KpiCard.jsx"},{"name":"SegmentedControl","sourcePath":"components/surfaces/SegmentedControl.jsx"}],"sourceHashes":{"components/brand/AskAIBar.jsx":"4094d4bcb79f","components/brand/ThemeToggle.jsx":"c72d8dd0705b","components/core/Avatar.jsx":"02751ff31121","components/core/Badge.jsx":"162c84f87967","components/core/Button.jsx":"e7a725848ae7","components/core/Chip.jsx":"299a655980d1","components/core/StatusDot.jsx":"15be935472c0","components/core/TrendPill.jsx":"797203aec8fc","components/icons/AnimIcon.jsx":"aa6232f9a9c2","components/navigation/NavRail.jsx":"9187694dd1c1","components/surfaces/Card.jsx":"5fb815eb4167","components/surfaces/KpiCard.jsx":"6dc731b0a36c","components/surfaces/SegmentedControl.jsx":"31999c7fe06a","ui_kits/atendimento/Atendimento.jsx":"82c551d9d64b","ui_kits/relatorios/Chart.jsx":"83fc830b31be","ui_kits/relatorios/Relatorios.jsx":"e632afe61fda"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ConceitoIndicaDesignSystem_1bb735 = window.ConceitoIndicaDesignSystem_1bb735 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/AskAIBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — AskAIBar
   The signature brand element: a "Pergunte à IA" command/ask box. A glowing
   gradient orb (pulse ring + shimmer sweep), a small IA label, and a cycling
   line of suggested questions that rotate every few seconds. Drops into a
   topbar beside the screen title. */

const CI_ASK_CSS = `
.ci-ask{
  font-family: var(--font-sans);
  display: flex; align-items: center; gap: 11px;
  background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 7px 8px 7px 12px; position: relative; overflow: hidden;
  box-shadow: var(--shadow-xs); flex: 0 1 460px; min-width: 300px;
}
.ci-ask::before{
  content:""; position:absolute; inset:0; pointer-events:none;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--brand) 8%, transparent), transparent);
  transform: translateX(-100%); animation: ci-ask-shimmer 4.5s ease-in-out infinite;
}
@keyframes ci-ask-shimmer{ 0%{ transform:translateX(-100%);} 55%,100%{ transform:translateX(120%);} }
.ci-ask__orb{
  width: 30px; height: 30px; border-radius: 9px; flex: 0 0 30px; position: relative;
  display: grid; place-items: center; color: #fff;
  background: linear-gradient(135deg, var(--brand), #16b3a3);
}
.ci-ask__orb svg, .ci-ask__orb i{ width: 16px; height: 16px; }
.ci-ask__orb::after{
  content:""; position:absolute; inset:-3px; border-radius: 11px;
  border: 1.5px solid color-mix(in srgb, var(--brand) 40%, transparent);
  opacity: 0; animation: ci-ask-pulse 2.8s ease-out infinite;
}
@keyframes ci-ask-pulse{ 0%{ transform:scale(.85); opacity:.7;} 70%,100%{ transform:scale(1.25); opacity:0;} }
.ci-ask__mid{ flex: 1; min-width: 0; }
.ci-ask__top{ font-size: 11px; color: var(--ink-3); font-weight: 600; letter-spacing: .02em; display: flex; align-items: center; gap: 6px; }
.ci-ask__ia{ background: var(--brand-soft); color: var(--brand); border-radius: 5px; padding: 0 5px; font-size: 9.5px; font-weight: 700; letter-spacing: .04em; }
.ci-ask__rot{ height: 19px; overflow: hidden; position: relative; }
.ci-ask__q{ display: block; font-size: 13px; color: var(--ink); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; animation: ci-ask-rotin .55s var(--ease-out); }
.ci-ask__q--ph{ color: var(--ink-2); font-weight: 500; font-style: italic; }
@keyframes ci-ask-rotin{ from{ opacity:0; transform:translateY(14px);} to{ opacity:1; transform:none;} }
.ci-ask__send{ width: 32px; height: 32px; border-radius: 9px; background: var(--brand); color: var(--on-brand); display: grid; place-items: center; border: 0; cursor: pointer; flex: 0 0 32px; }
.ci-ask__send svg, .ci-ask__send i{ width: 15px; height: 15px; }
@media (prefers-reduced-motion: reduce){
  .ci-ask::before, .ci-ask__orb::after, .ci-ask__q{ animation: none; }
  .ci-ask::before{ display: none; }
}
`;
const CI_ARROW_UP = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 19V5M5 12l7-7 7 7"
}));
const CI_SPARKLES = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M19 4v3M20.5 5.5h-3"
}));
function ciEnsureAskStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-ask-css")) return;
  const s = document.createElement("style");
  s.id = "ci-ask-css";
  s.textContent = CI_ASK_CSS;
  document.head.appendChild(s);
}
function AskAIBar({
  label = "Pergunte à IA",
  suggestions = ["Qual foi meu faturamento?", "Quais produtos estão com estoque crítico?", "Onde estou perdendo margem?"],
  placeholderMode = false,
  interval = 2800,
  orb = null,
  onSend,
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureAskStyle, []);
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (!suggestions.length) return;
    const t = setInterval(() => setI(p => (p + 1) % suggestions.length), interval);
    return () => clearInterval(t);
  }, [suggestions, interval]);
  const cls = ["ci-ask", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "ci-ask__orb"
  }, orb || CI_SPARKLES), /*#__PURE__*/React.createElement("div", {
    className: "ci-ask__mid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ci-ask__top"
  }, label, " ", /*#__PURE__*/React.createElement("span", {
    className: "ci-ask__ia"
  }, "IA")), /*#__PURE__*/React.createElement("div", {
    className: "ci-ask__rot"
  }, placeholderMode ? /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "ci-ask__q ci-ask__q--ph"
  }, "ex.: ", suggestions[i]) : /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "ci-ask__q"
  }, suggestions[i]))), /*#__PURE__*/React.createElement("button", {
    className: "ci-ask__send",
    onClick: onSend,
    "aria-label": "Perguntar"
  }, CI_ARROW_UP));
}
Object.assign(__ds_scope, { AskAIBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/AskAIBar.jsx", error: String((e && e.message) || e) }); }

// components/brand/ThemeToggle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — ThemeToggle
   Flips the design between Day and Night. Three modes: auto (follows the OS),
   day, night — with the choice persisted. In auto it live-updates with the OS
   and shows a small "A" badge. By default it toggles the `.night` class on
   <html>; pass `target` (a selector or element) to scope it instead. */

const CI_TOG_CSS = `
.ci-theme-tog{
  width: 36px; height: 36px; border-radius: var(--radius-md); position: relative;
  border: 1px solid var(--line); background: var(--panel); color: var(--ink-2);
  display: grid; place-items: center; cursor: pointer;
  transition: transform var(--dur-3) var(--ease-spring), background var(--dur-3), color var(--dur-3);
}
.ci-theme-tog:hover{ transform: rotate(-18deg) scale(1.06); color: var(--ink); }
.ci-theme-tog svg{ width: 18px; height: 18px; }
.night .ci-theme-tog{ background: var(--raise); color: #e9c977; border-color: #3a3526; }
.ci-theme-tog__auto{
  position: absolute; right: -3px; bottom: -3px; min-width: 14px; height: 14px;
  padding: 0 2px; border-radius: 7px; background: var(--brand); color: #fff;
  font-size: 8.5px; font-weight: 800; line-height: 14px; text-align: center;
  border: 1.5px solid var(--bg); letter-spacing: .02em;
}
.night .ci-theme-tog__auto{ color: var(--on-brand); border-color: var(--bg); }
`;
function ciEnsureTogStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-theme-tog-css")) return;
  const s = document.createElement("style");
  s.id = "ci-theme-tog-css";
  s.textContent = CI_TOG_CSS;
  document.head.appendChild(s);
}
function ciOsDark() {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
const CI_MOON = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.9",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z"
}));
const CI_SUN = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.9",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "4.2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"
}));
function ThemeToggle({
  target,
  storageKey = "ci-theme-mode",
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureTogStyle, []);
  const [mode, setMode] = React.useState(() => {
    try {
      return localStorage.getItem(storageKey) || "auto";
    } catch (e) {
      return "auto";
    }
  });
  const isNight = mode === "night" || mode === "auto" && ciOsDark();
  const apply = React.useCallback(on => {
    if (typeof document === "undefined") return;
    let nodes;
    if (!target) nodes = [document.documentElement];else if (typeof target === "string") nodes = Array.from(document.querySelectorAll(target));else nodes = [target];
    nodes.forEach(el => el && el.classList.toggle("night", on));
  }, [target]);
  React.useEffect(() => {
    apply(isNight);
  }, [isNight, apply]);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (mode === "auto") apply(mq.matches);
    };
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange);
    };
  }, [mode, apply]);
  const cycle = () => {
    const next = mode === "auto" ? ciOsDark() ? "day" : "night" : mode === "night" ? "day" : "night";
    setMode(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch (e) {}
  };
  const resetAuto = e => {
    e.preventDefault();
    setMode("auto");
    try {
      localStorage.setItem(storageKey, "auto");
    } catch (e2) {}
  };
  const cls = ["ci-theme-tog", mode === "auto" ? "is-auto" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    onClick: cycle,
    onContextMenu: resetAuto,
    "aria-label": "Alternar tema"
  }, rest), isNight ? CI_MOON : CI_SUN, mode === "auto" && /*#__PURE__*/React.createElement("span", {
    className: "ci-theme-tog__auto"
  }, "A"));
}
Object.assign(__ds_scope, { ThemeToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/ThemeToggle.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — Avatar
   Initials avatar. Tone sets the fill: pink (operator/attendant — the
   brand's signature accent), brand (store), neutral (muted). Sizes sm/md/lg.
   On the dark rail a neutral avatar uses a warm grey chip. */

const CI_AVATAR_CSS = `
.ci-avatar{
  font-family: var(--font-sans); font-weight: 700; color: #fff;
  display: grid; place-items: center; border-radius: 50%;
  width: 34px; height: 34px; font-size: 12px; flex: 0 0 auto; line-height: 1;
}
.ci-avatar--sm{ width: 28px; height: 28px; font-size: 11px; }
.ci-avatar--lg{ width: 42px; height: 42px; font-size: 14px; }
.ci-avatar--square{ border-radius: 10px; }
.ci-avatar--pink{ background: var(--ci-pink); }
.ci-avatar--brand{ background: var(--brand); color: var(--on-brand); }
.ci-avatar--neutral{ background: var(--line); color: var(--ink-2); }
`;
function ciEnsureAvatarStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-avatar-css")) return;
  const s = document.createElement("style");
  s.id = "ci-avatar-css";
  s.textContent = CI_AVATAR_CSS;
  document.head.appendChild(s);
}
function Avatar({
  initials = "",
  tone = "pink",
  size = "md",
  square = false,
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureAvatarStyle, []);
  const cls = ["ci-avatar", `ci-avatar--${tone}`, size !== "md" ? `ci-avatar--${size}` : "", square ? "ci-avatar--square" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — Badge / Tag
   A small status label. Tone carries meaning: pos/warn/neg/brand/muted.
   Optional leading dot. Used in tables ("8 venc."), kit ribbons, counts. */

const CI_BADGE_CSS = `
.ci-badge{
  font-family: var(--font-sans); font-weight: 600; font-size: 12px; line-height: 1;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: var(--radius-xs); white-space: nowrap;
}
.ci-badge .ci-badge__dot{ width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: 0 0 6px; }
.ci-badge--brand{ background: var(--brand-soft); color: var(--brand); }
.ci-badge--pos{ background: var(--brand-soft); color: var(--pos); }
.ci-badge--warn{ background: var(--warn-soft); color: var(--warn); }
.ci-badge--neg{ background: var(--neg-soft); color: var(--neg); }
.ci-badge--muted{ background: var(--line-2); color: var(--ink-2); }
.ci-badge--solid{ background: var(--brand); color: var(--on-brand); text-transform: uppercase; letter-spacing: .04em; font-size: 10.5px; font-weight: 700; }
`;
function ciEnsureBadgeStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-badge-css")) return;
  const s = document.createElement("style");
  s.id = "ci-badge-css";
  s.textContent = CI_BADGE_CSS;
  document.head.appendChild(s);
}
function Badge({
  children,
  tone = "muted",
  dot = false,
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureBadgeStyle, []);
  const cls = ["ci-badge", `ci-badge--${tone}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "ci-badge__dot"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — Button
   Buttons are differentiated BY RISK, not by "everything is green":
   - primary   : neutral dark ink (the default confirm)
   - brand      : green — reserved for the money action (Finalizar venda)
   - secondary  : white + hairline (utility)
   - ghost      : transparent (low-emphasis)
   - destructive: red text/treatment (Venda perdida) */

const CI_BTN_CSS = `
.ci-btn{
  --_pad: 9px 16px; --_fs: 13.5px;
  font-family: var(--font-sans); font-weight: 600; font-size: var(--_fs);
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  padding: var(--_pad); border-radius: var(--radius-md); border: 1px solid transparent;
  cursor: pointer; white-space: nowrap; line-height: 1; user-select: none;
  transition: background var(--dur-2), color var(--dur-2), border-color var(--dur-2),
              box-shadow var(--dur-2), transform var(--dur-2) var(--ease-spring);
}
.ci-btn:focus-visible{ outline: none; box-shadow: var(--ring); }
.ci-btn svg, .ci-btn i{ width: 15px; height: 15px; flex: 0 0 auto; }
.ci-btn--sm{ --_pad: 8px 12px; --_fs: 12.5px; }
.ci-btn--lg{ --_pad: 13px 18px; --_fs: 14px; }
.ci-btn[disabled]{ cursor: not-allowed; opacity: 1; }

/* primary — neutral dark */
.ci-btn--primary{ background: var(--ink); color: #fff; }
.ci-btn--primary:hover{ transform: translateY(-1px); box-shadow: var(--shadow-sm); }
.ci-btn--primary:active{ transform: translateY(0); }

/* brand — green money action */
.ci-btn--brand{ background: var(--brand); color: var(--on-brand); }
.ci-btn--brand:hover{ transform: translateY(-1px); box-shadow: var(--shadow-md); }
.ci-btn--brand:active{ transform: translateY(0) scale(.98); }
.ci-btn--brand[disabled]{ background: var(--line-2); color: var(--ink-3); transform: none; box-shadow: none; }

/* secondary — utility */
.ci-btn--secondary{ background: var(--panel); color: var(--ink); border-color: var(--line); }
.ci-btn--secondary:hover{ background: var(--line-2); border-color: var(--line); }

/* ghost */
.ci-btn--ghost{ background: transparent; color: var(--ink-2); }
.ci-btn--ghost:hover{ background: var(--line-2); color: var(--ink); }

/* destructive */
.ci-btn--destructive{ background: var(--panel); color: var(--neg); border-color: var(--neg-soft); }
.ci-btn--destructive:hover{ background: var(--neg-soft); }

.ci-btn--block{ width: 100%; }
`;
function ciEnsureStyle(id, css) {
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  }
}
function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  icon = null,
  iconRight = null,
  disabled = false,
  type = "button",
  className = "",
  ...rest
}) {
  React.useEffect(() => ciEnsureStyle("ci-btn-css", CI_BTN_CSS), []);
  const cls = ["ci-btn", `ci-btn--${variant}`, size !== "md" ? `ci-btn--${size}` : "", block ? "ci-btn--block" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls,
    disabled: disabled
  }, rest), icon, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — Chip
   A compact, rounded suggestion/filter token. Used for AI-suggested
   search terms ("febre", "antitérmico") and complementary products.
   Variants: search (magnifier, neutral), complement (plus, brand),
   plain. Springy lift on hover. */

const CI_CHIP_CSS = `
.ci-chip{
  font-family: var(--font-sans); font-size: 12.5px; color: var(--ink);
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--panel); border: 1px solid var(--line);
  border-radius: var(--radius-pill); padding: 5px 11px; cursor: pointer;
  transition: transform var(--dur-2) var(--ease-spring), border-color var(--dur-2), background var(--dur-1);
}
.ci-chip:hover{ transform: translateY(-1px); border-color: var(--brand); }
.ci-chip:focus-visible{ outline: none; box-shadow: var(--ring); }
.ci-chip svg, .ci-chip i{ width: 13px; height: 13px; }
.ci-chip--search i, .ci-chip--search svg{ color: var(--ink-3); }
.ci-chip--complement i, .ci-chip--complement svg{ color: var(--brand); }
.ci-chip--on{ background: var(--brand); border-color: var(--brand); color: var(--on-brand); }
`;
function ciEnsureChipStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-chip-css")) return;
  const s = document.createElement("style");
  s.id = "ci-chip-css";
  s.textContent = CI_CHIP_CSS;
  document.head.appendChild(s);
}
function Chip({
  children,
  variant = "plain",
  active = false,
  icon = null,
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureChipStyle, []);
  const cls = ["ci-chip", variant !== "plain" ? `ci-chip--${variant}` : "", active ? "ci-chip--on" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusDot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — StatusDot
   The smallest signal: a single coloured dot. neg/warn/pos.
   Optional soft "halo" ring (used on dark rail section markers). */

const CI_DOT_CSS = `
.ci-dot{ display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex: 0 0 8px; }
.ci-dot--pos{ background: var(--pos); }
.ci-dot--warn{ background: var(--warn); }
.ci-dot--neg{ background: var(--neg); }
.ci-dot--halo{ box-shadow: 0 0 0 3px var(--brand-soft); }
`;
function ciEnsureDotStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-dot-css")) return;
  const s = document.createElement("style");
  s.id = "ci-dot-css";
  s.textContent = CI_DOT_CSS;
  document.head.appendChild(s);
}
function StatusDot({
  tone = "neg",
  halo = false,
  size,
  className = "",
  style = {},
  ...rest
}) {
  React.useEffect(ciEnsureDotStyle, []);
  const cls = ["ci-dot", `ci-dot--${tone}`, halo ? "ci-dot--halo" : "", className].filter(Boolean).join(" ");
  const st = size ? {
    ...style,
    width: size,
    height: size,
    flexBasis: size
  } : style;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: st
  }, rest));
}
Object.assign(__ds_scope, { StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusDot.jsx", error: String((e && e.message) || e) }); }

// components/core/TrendPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — TrendPill
   A delta indicator: direction arrow + value, tinted by direction.
   up = positive (green), down = negative (red), flat = warn (amber).
   The arrow is provided by the caller (Lucide) OR drawn as a glyph. */

const CI_TREND_CSS = `
.ci-trend{
  font-family: var(--font-sans); font-weight: 600; font-size: 11.5px; line-height: 1;
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 6px; border-radius: var(--radius-xs);
}
.ci-trend svg, .ci-trend i{ width: 11px; height: 11px; }
.ci-trend--up{ background: var(--brand-soft); color: var(--pos); }
.ci-trend--down{ background: var(--neg-soft); color: var(--neg); }
.ci-trend--flat{ background: var(--warn-soft); color: var(--warn); }
`;
const CI_TREND_GLYPH = {
  up: "↗",
  down: "↘",
  flat: "→"
};
function ciEnsureTrendStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-trend-css")) return;
  const s = document.createElement("style");
  s.id = "ci-trend-css";
  s.textContent = CI_TREND_CSS;
  document.head.appendChild(s);
}
function TrendPill({
  direction = "up",
  children,
  icon = null,
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureTrendStyle, []);
  const cls = ["ci-trend", `ci-trend--${direction}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), icon || /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, CI_TREND_GLYPH[direction]), children);
}
Object.assign(__ds_scope, { TrendPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TrendPill.jsx", error: String((e && e.message) || e) }); }

// components/icons/AnimIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — AnimIcon
   The brand's signature: bespoke "Flaticon / Lottie"-style line icons that
   play a single-shot micro-animation on hover (bars grow, carts roll, checks
   draw, clocks tick). A warm teal accent stroke marks the "active" part of
   each glyph. Names cover every product module + KPI.

   Self-contained: injects its own keyframes + hover triggers once. Size with
   the `size` prop (px). Set `play="always"` to loop, or trigger from a parent
   by adding the class `ci-icon-hovergroup` to an ancestor. */

const CI_TEAL = "var(--ci-teal)";
const CI_ICON_CSS = `
.ci-icon{ display:inline-flex; color:currentColor; line-height:0; }
.ci-icon svg{ display:block; }
.ci-icon [class^="ai-"]{ transform-box:fill-box; transform-origin:center; }
.ci-icon .ai-bar, .ci-icon .ai-col{ transform-origin:center bottom; }
.ci-icon .ai-check{ stroke-dasharray:1; }
.ci-icon .ai-clock{ transform-box:view-box; transform-origin:12px 12px; }

@keyframes ci-ai-grow{ from{ transform:scaleY(0); } to{ transform:scaleY(1); } }
@keyframes ci-ai-roll{ 0%,100%{ transform:translateX(0); } 30%{ transform:translateX(-1.6px); } 70%{ transform:translateX(1.6px); } }
@keyframes ci-ai-drop{ 0%{ transform:translateY(-1px); opacity:0; } 35%{ opacity:1; } 100%{ transform:translateY(7px); opacity:0; } }
@keyframes ci-ai-pop{ 0%,100%{ transform:translateY(0); } 40%{ transform:translateY(-2.6px); } }
@keyframes ci-ai-spin{ to{ transform:rotate(360deg); } }
@keyframes ci-ai-flip{ to{ transform:rotateY(360deg); } }
@keyframes ci-ai-bounce{ 0%,100%{ transform:translateY(0); } 30%{ transform:translateY(-3px); } 60%{ transform:translateY(0); } }
@keyframes ci-ai-pulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.14); } }
@keyframes ci-ai-dartfly{ 0%{ transform:translate(5px,-5px); opacity:0; } 55%{ opacity:1; } 100%{ transform:translate(0,0); opacity:1; } }
@keyframes ci-ai-checkdraw{ from{ stroke-dashoffset:1; } to{ stroke-dashoffset:0; } }

.ci-icon-trigger:hover .ai-bar, .ci-icon-trigger:hover .ai-col{ animation: ci-ai-grow .5s var(--ease-spring) both; }
.ci-icon-trigger:hover .ai-cart{ animation: ci-ai-roll .6s ease; }
.ci-icon-trigger:hover .ai-coin{ animation: ci-ai-drop .75s ease both; }
.ci-icon-trigger:hover .ai-arrow{ animation: ci-ai-pop .6s ease; }
.ci-icon-trigger:hover .ai-spin{ animation: ci-ai-spin .7s linear; }
.ci-icon-trigger:hover .ai-card{ animation: ci-ai-flip .7s ease; }
.ci-icon-trigger:hover .ai-bag{ animation: ci-ai-bounce .6s var(--ease-spring); }
.ci-icon-trigger:hover .ai-ring{ animation: ci-ai-pulse .7s ease; }
.ci-icon-trigger:hover .ai-dart{ animation: ci-ai-dartfly .6s var(--ease-spring) both; }
.ci-icon-trigger:hover .ai-check{ animation: ci-ai-checkdraw .55s ease both; }
.ci-icon-trigger:hover .ai-shield{ animation: ci-ai-pulse .7s ease; }
.ci-icon-trigger:hover .ai-clock{ animation: ci-ai-spin .9s ease; }

.ci-icon--always .ai-bar, .ci-icon--always .ai-col{ animation: ci-ai-grow 1.4s var(--ease-spring) infinite alternate; }
.ci-icon--always .ai-ring, .ci-icon--always .ai-shield{ animation: ci-ai-pulse 1.8s ease infinite; }
.ci-icon--always .ai-clock{ animation: ci-ai-spin 3s linear infinite; }

@media (prefers-reduced-motion: reduce){
  .ci-icon [class^="ai-"]{ animation: none !important; }
  .ci-icon .ai-check{ stroke-dasharray: none; }
}
`;
function ciEnsureIconStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-icon-css")) return;
  const s = document.createElement("style");
  s.id = "ci-icon-css";
  s.textContent = CI_ICON_CSS;
  document.head.appendChild(s);
}

// ---- icon path registry (name → SVG children) ----
const CI_ICONS = {
  // modules
  vendas: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 21h18"
  }), /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    x: "5",
    y: "11",
    width: "3.4",
    height: "9.4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    style: {
      animationDelay: ".1s"
    },
    x: "10.3",
    y: "7",
    width: "3.4",
    height: "13.4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    style: {
      animationDelay: ".2s"
    },
    x: "15.6",
    y: "3.6",
    width: "3.4",
    height: "16.8",
    rx: "1",
    stroke: CI_TEAL
  })),
  relatorios: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 21h18"
  }), /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    x: "5",
    y: "11",
    width: "3.4",
    height: "9.4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    style: {
      animationDelay: ".1s"
    },
    x: "10.3",
    y: "7",
    width: "3.4",
    height: "13.4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    style: {
      animationDelay: ".2s"
    },
    x: "15.6",
    y: "3.6",
    width: "3.4",
    height: "16.8",
    rx: "1",
    stroke: CI_TEAL
  })),
  compras: /*#__PURE__*/React.createElement("g", {
    className: "ai-cart"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 4h2l2.2 10.5h9.2l2-7.2H6.2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9.6",
    cy: "19.4",
    r: "1.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16.2",
    cy: "19.4",
    r: "1.5"
  })),
  financeiro: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "8",
    width: "18",
    height: "12",
    rx: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 14h3"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ai-coin",
    cx: "12",
    cy: "5",
    r: "2.6",
    stroke: CI_TEAL
  })),
  estoque: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "10",
    width: "16",
    height: "10",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 10l3.4-4h9.2L20 10"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-arrow",
    d: "M12 17.5V10.5M9.5 13L12 10.5 14.5 13",
    stroke: CI_TEAL
  })),
  entregas: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("g", {
    className: "ai-spin"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "18",
    r: "2.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 15.6V18"
  })), /*#__PURE__*/React.createElement("g", {
    className: "ai-spin"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "18",
    r: "2.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 15.6V18"
  })), /*#__PURE__*/React.createElement("path", {
    d: "M8.6 18H11.5L13.5 9.5H10.5M13.5 12.5H17.2L18.6 18"
  })),
  crediario: /*#__PURE__*/React.createElement("g", {
    className: "ai-card"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "6",
    width: "18",
    height: "12",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 10h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 14h4",
    stroke: CI_TEAL
  })),
  ecommerce: /*#__PURE__*/React.createElement("g", {
    className: "ai-bag"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5.5 8h13l-1 11.5H6.5L5.5 8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 8V6.2a3 3 0 0 1 6 0V8",
    stroke: CI_TEAL
  })),
  metas: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    className: "ai-ring",
    cx: "12",
    cy: "12",
    r: "8.2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4.4",
    stroke: CI_TEAL
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1.1",
    fill: "currentColor",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-dart",
    d: "M12 12l6-6M15.5 5h3v3",
    stroke: CI_TEAL
  })),
  recebiveis: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 9l9-5 9 5"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-col",
    d: "M5.5 9.5V19"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-col",
    style: {
      animationDelay: ".08s"
    },
    d: "M9.8 9.5V19"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-col",
    style: {
      animationDelay: ".16s"
    },
    d: "M14.2 9.5V19"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-col",
    style: {
      animationDelay: ".24s"
    },
    d: "M18.5 9.5V19"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 20.5h18"
  })),
  sngpc: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    className: "ai-shield",
    d: "M12 3l7 2.8v5.2c0 4.2-3 7.2-7 8.2-4-1-7-4-7-8.2V5.8L12 3z"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-check",
    pathLength: "1",
    d: "M8.8 12l2.2 2.2 4.2-4.4",
    stroke: CI_TEAL
  })),
  atendimento: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 13v-1a7 7 0 0 1 14 0v1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3.4",
    y: "12.5",
    width: "3.2",
    height: "6",
    rx: "1.6"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "17.4",
    y: "12.5",
    width: "3.2",
    height: "6",
    rx: "1.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 18.5v1.3a2.5 2.5 0 0 1-2.5 2.5H14"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ai-ring",
    cx: "12.5",
    cy: "22.3",
    r: "1.4",
    stroke: CI_TEAL
  })),
  orcamentos: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 3h8l4 4v14H6z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 3v4h4"
  }), /*#__PURE__*/React.createElement("line", {
    className: "ai-check",
    pathLength: "1",
    x1: "9",
    y1: "12",
    x2: "15",
    y2: "12",
    stroke: CI_TEAL
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "15.5",
    x2: "15",
    y2: "15.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "19",
    x2: "12.5",
    y2: "19"
  })),
  historico: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 12a8 8 0 1 1 2.4 5.7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6.4 17.7 4 18l.3-2.6"
  }), /*#__PURE__*/React.createElement("g", {
    className: "ai-clock"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "12",
    x2: "12",
    y2: "7.6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "12",
    x2: "15",
    y2: "13.5",
    stroke: CI_TEAL
  }))),
  campanhas: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 10v4l11 5V5L3 10z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 14h-.5v-4H3"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-ring",
    d: "M17 7a7 7 0 0 1 0 10",
    stroke: CI_TEAL
  })),
  fidelizacao: /*#__PURE__*/React.createElement("g", {
    className: "ai-bag"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "9.5",
    width: "16",
    height: "11",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 13.5h16M12 9.5v11"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9.5C12 7 9.5 5.5 8.2 7s1.8 2.5 3.8 2.5zM12 9.5c0-2.5 2.5-4 3.8-2.5s-1.8 2.5-3.8 2.5z",
    stroke: CI_TEAL
  })),
  treinamento: /*#__PURE__*/React.createElement("g", {
    className: "ai-bag"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 8.5 12 4.5l10 4-10 4-10-4z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 10.5v4c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 8.5v4.5",
    stroke: CI_TEAL
  })),
  dashboard: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    x: "3",
    y: "3",
    width: "7.5",
    height: "7.5",
    rx: "1.6"
  }), /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    style: {
      animationDelay: ".08s"
    },
    x: "13.5",
    y: "3",
    width: "7.5",
    height: "7.5",
    rx: "1.6",
    stroke: CI_TEAL
  }), /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    style: {
      animationDelay: ".16s"
    },
    x: "3",
    y: "13.5",
    width: "7.5",
    height: "7.5",
    rx: "1.6",
    stroke: CI_TEAL
  }), /*#__PURE__*/React.createElement("rect", {
    className: "ai-bar",
    style: {
      animationDelay: ".24s"
    },
    x: "13.5",
    y: "13.5",
    width: "7.5",
    height: "7.5",
    rx: "1.6"
  })),
  multiloja: /*#__PURE__*/React.createElement("g", {
    className: "ai-bag"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "8",
    width: "8",
    height: "13",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13",
    y: "4",
    width: "8",
    height: "17",
    rx: "1",
    stroke: CI_TEAL
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5.5 12h3M5.5 15.5h3M15.5 8h3M15.5 12h3M15.5 15.5h3"
  })),
  transferencias: /*#__PURE__*/React.createElement("g", {
    className: "ai-cart"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 9h13l-3.2-3.2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M20 15H7l3.2 3.2",
    stroke: CI_TEAL
  })),
  cadastros: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "4",
    width: "14",
    height: "17",
    rx: "2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "2.5",
    width: "6",
    height: "3.4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-check",
    pathLength: "1",
    d: "M8.5 13l2.5 2.5 4.5-5",
    stroke: CI_TEAL
  })),
  fiscal: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "8",
    x2: "16",
    y2: "8"
  }), /*#__PURE__*/React.createElement("line", {
    className: "ai-check",
    pathLength: "1",
    x1: "8",
    y1: "12",
    x2: "16",
    y2: "12",
    stroke: CI_TEAL
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "16",
    x2: "13",
    y2: "16"
  })),
  // KPIs
  fat: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2.5",
    y: "7",
    width: "19",
    height: "10",
    rx: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ai-ring",
    cx: "12",
    cy: "12",
    r: "2.6",
    stroke: CI_TEAL
  })),
  lucro: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 5h14l2.2 4L12 20 2.8 9z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2.8 9h18.4M8.5 5 6 9l6 11M15.5 5 18 9l-6 11"
  }), /*#__PURE__*/React.createElement("path", {
    className: "ai-ring",
    d: "M20 2.6v2.6M18.7 3.9h2.6",
    stroke: CI_TEAL
  })),
  margem: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    className: "ai-check",
    pathLength: "1",
    x1: "5.5",
    y1: "18.5",
    x2: "18.5",
    y2: "5.5",
    stroke: CI_TEAL
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7.5",
    cy: "7.5",
    r: "2.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16.5",
    cy: "16.5",
    r: "2.1"
  })),
  alert: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 4 22 20H2L12 4z"
  }), /*#__PURE__*/React.createElement("g", {
    className: "ai-ring"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "10",
    x2: "12",
    y2: "14"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "17",
    r: "0.7",
    fill: "currentColor",
    stroke: "none"
  }))),
  contas: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "8.5"
  }), /*#__PURE__*/React.createElement("g", {
    className: "ai-clock"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "12",
    x2: "12",
    y2: "7.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "12",
    x2: "15",
    y2: "13.5",
    stroke: CI_TEAL
  })))
};
function AnimIcon({
  name,
  size = 20,
  strokeWidth = 2,
  play = "hover",
  className = "",
  style = {},
  ...rest
}) {
  React.useEffect(ciEnsureIconStyle, []);
  const children = CI_ICONS[name];
  if (!children) return null;
  const cls = ["ci-icon", play === "hover" ? "ci-icon-trigger" : "", play === "always" ? "ci-icon--always" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: style
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, children));
}

/** Names available to <AnimIcon name="…" />. */
AnimIcon.names = Object.keys(CI_ICONS);
Object.assign(__ds_scope, { AnimIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/AnimIcon.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavRail.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — NavRail
   The product's left navigation rail. Always dark (warm near-black) in both
   themes — it's the app's anchor. Expanded shows a brand lockup, a ⌘K search
   row, grouped module items (AnimIcon + label + optional alert dot), and a user
   footer. Collapsed becomes a 64px icon rail with hover tooltips. Composes
   AnimIcon + Avatar from the system. */

const CI_RAIL_CSS = `
.ci-rail{
  --_fg: #b6b6ac; --_fg-2: #6f6f66; --_sec: #56564e;
  width: var(--rail-w); flex: 0 0 var(--rail-w); align-self: stretch;
  background: var(--rail); color: var(--_fg);
  display: flex; flex-direction: column; font-family: var(--font-sans);
}
.ci-rail__brand{ display: flex; align-items: center; gap: 11px; padding: 20px 18px 18px; }
.ci-rail__mark{ width: 34px; height: 34px; border-radius: 9px; background: var(--brand); display: grid; place-items: center; color: var(--on-brand); flex: 0 0 34px; }
.ci-rail__mark svg{ width: 18px; height: 18px; }
.ci-rail__brand b{ color: #fafafa; font-size: 15px; letter-spacing: -.01em; display: block; line-height: 1.1; }
.ci-rail__brand small{ font-size: 11px; color: var(--_fg-2); }
.ci-rail__search{ margin: 2px 14px 14px; display: flex; align-items: center; gap: 9px; background: #201f19; border: 1px solid #2c2b23; border-radius: 9px; padding: 9px 11px; cursor: text; }
.ci-rail__search svg{ width: 15px; height: 15px; color: var(--_fg-2); }
.ci-rail__search span{ font-size: 13px; color: var(--_fg-2); flex: 1; }
.ci-rail__search kbd{ font-size: 11px; color: #8a897f; background: #2c2b23; border-radius: 5px; padding: 2px 6px; font-family: inherit; }
.ci-rail__scroll{ flex: 1; min-height: 0; overflow-y: auto; padding-bottom: 6px; }
.ci-rail__scroll::-webkit-scrollbar{ width: 6px; }
.ci-rail__scroll::-webkit-scrollbar-thumb{ background: #2c2b22; border-radius: 3px; }
.ci-rail__sec{ font-size: 10.5px; letter-spacing: .13em; color: var(--_sec); padding: 12px 20px 6px; text-transform: uppercase; }
.ci-rail__i{ position: relative; display: flex; align-items: center; gap: 12px; padding: 8px 14px; margin: 1px 10px; border-radius: 9px; color: var(--_fg); cursor: pointer; border: 0; background: transparent; width: calc(100% - 20px); text-align: left; font-family: inherit; transition: color var(--dur-2), background var(--dur-3); }
.ci-rail__i span{ font-size: 13.5px; font-weight: 500; }
.ci-rail__i .ci-rail__dot{ margin-left: auto; width: 6px; height: 6px; border-radius: 50%; background: var(--neg); flex: 0 0 6px; }
.ci-rail__i:hover{ color: #fafafa; background: rgba(255,255,255,.045); }
.ci-rail__i.on{ background: #222119; color: #fff; box-shadow: 0 0 0 1px rgba(255,255,255,.05); }
.ci-rail__i.on .ci-icon{ color: var(--brand); }
.ci-rail__user{ margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-top: 1px solid #232219; }
.ci-rail__user b{ font-size: 13px; color: #eaeae4; display: block; line-height: 1.15; }
.ci-rail__user small{ font-size: 11px; color: var(--_fg-2); }

/* collapsed */
.ci-rail--mini{ width: var(--rail-w-mini); flex-basis: var(--rail-w-mini); align-items: center; padding: 16px 0 0; }
.ci-rail--mini .ci-rail__mark{ margin-bottom: 10px; }
.ci-rail--mini .ci-rail__scroll{ display: flex; flex-direction: column; align-items: center; width: 100%; overflow: visible; }
.ci-rail__msep{ width: 28px; height: 1px; background: #2a2920; margin: 6px 0; }
.ci-rail__mi{ position: relative; width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; color: var(--_fg); margin: 3px 0; border: 0; background: transparent; cursor: pointer; transition: transform var(--dur-3) var(--ease-spring), background var(--dur-2), color var(--dur-2); }
.ci-rail__mi:hover{ transform: scale(1.14); background: #262419; }
.ci-rail__mi.on{ background: #222119; color: #fff; }
.ci-rail__mi.on .ci-icon{ color: var(--brand); }
.ci-rail__mi .ci-rail__dot{ position: absolute; top: 8px; right: 8px; width: 6px; height: 6px; border-radius: 50%; background: var(--neg); }
.ci-rail__mi[data-tip]::after{ content: attr(data-tip); position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%); background: #222119; color: #f1f0ea; font-size: 12.5px; font-weight: 500; white-space: nowrap; padding: 6px 10px; border-radius: 7px; box-shadow: var(--shadow-lg); opacity: 0; pointer-events: none; transition: opacity var(--dur-1); z-index: 30; }
.ci-rail__mi:hover::after{ opacity: 1; }
.ci-rail--mini .ci-rail__user{ margin-top: auto; padding: 12px 0 16px; border-top: 0; }
`;
const CI_RAIL_SEARCH_ICON = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "8"
}), /*#__PURE__*/React.createElement("path", {
  d: "m21 21-4.3-4.3"
}));
const CI_RAIL_MARK = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M22 12h-4l-3 9L9 3l-3 9H2"
}));
function ciEnsureRailStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-rail-css")) return;
  const s = document.createElement("style");
  s.id = "ci-rail-css";
  s.textContent = CI_RAIL_CSS;
  document.head.appendChild(s);
}
function NavRail({
  brand = {
    name: "Conceito Indica",
    subtitle: "Venda Assistida"
  },
  sections = [],
  user = {
    initials: "MS",
    name: "Mariana Silva",
    role: "Atendente · Caixa",
    tone: "neutral"
  },
  active,
  collapsed = false,
  onSelect,
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureRailStyle, []);
  const NS = window.ConceitoIndicaDesignSystem_1bb735 || {};
  const AnimIcon = NS.AnimIcon || (() => null);
  const Avatar = NS.Avatar || (p => /*#__PURE__*/React.createElement("span", null, p.initials));
  const cls = ["ci-rail", collapsed ? "ci-rail--mini" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("aside", _extends({
    className: cls
  }, rest), collapsed ? /*#__PURE__*/React.createElement("div", {
    className: "ci-rail__mark"
  }, CI_RAIL_MARK) : /*#__PURE__*/React.createElement("div", {
    className: "ci-rail__brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ci-rail__mark"
  }, CI_RAIL_MARK), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, brand.name), /*#__PURE__*/React.createElement("small", null, brand.subtitle))), !collapsed && /*#__PURE__*/React.createElement("div", {
    className: "ci-rail__search"
  }, CI_RAIL_SEARCH_ICON, /*#__PURE__*/React.createElement("span", null, "Buscar ou perguntar\u2026"), /*#__PURE__*/React.createElement("kbd", null, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    className: "ci-rail__scroll"
  }, sections.map((sec, si) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: si
  }, collapsed ? si > 0 && /*#__PURE__*/React.createElement("div", {
    className: "ci-rail__msep"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "ci-rail__sec"
  }, sec.label), sec.items.map(it => {
    const on = active === it.id;
    return collapsed ? /*#__PURE__*/React.createElement("button", {
      key: it.id,
      className: "ci-rail__mi" + (on ? " on" : ""),
      "data-tip": it.label,
      onClick: () => onSelect && onSelect(it.id)
    }, /*#__PURE__*/React.createElement(AnimIcon, {
      name: it.icon,
      size: 21,
      play: "hover"
    }), it.dot && /*#__PURE__*/React.createElement("span", {
      className: "ci-rail__dot"
    })) : /*#__PURE__*/React.createElement("button", {
      key: it.id,
      className: "ci-rail__i" + (on ? " on" : ""),
      onClick: () => onSelect && onSelect(it.id)
    }, /*#__PURE__*/React.createElement(AnimIcon, {
      name: it.icon,
      size: 20,
      play: "hover"
    }), /*#__PURE__*/React.createElement("span", null, it.label), it.dot && /*#__PURE__*/React.createElement("span", {
      className: "ci-rail__dot"
    }));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "ci-rail__user"
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: user.initials,
    tone: user.tone || "neutral",
    size: collapsed ? "sm" : "md"
  }), !collapsed && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, user.name), /*#__PURE__*/React.createElement("small", null, user.role))));
}
Object.assign(__ds_scope, { NavRail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavRail.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — Card
   The base surface: warm panel, single 12px radius, hairline border,
   barely-there resting shadow. Optional header with a title and a
   trailing action link. Hierarchy comes from tone — keep cards flat. */

const CI_CARD_CSS = `
.ci-card{
  background: var(--panel); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 18px 20px;
  box-shadow: var(--shadow-xs);
  transition: box-shadow var(--dur-3) var(--ease-out), transform var(--dur-3) var(--ease-out);
}
.ci-card--pad-sm{ padding: 14px 16px; }
.ci-card--pad-lg{ padding: 22px 24px; }
.ci-card--hover:hover{ box-shadow: var(--shadow-md); }
.ci-card__h{ display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.ci-card__title{ font-size: var(--fs-md); font-weight: 700; letter-spacing: var(--ls-snug); color: var(--ink); }
.ci-card__sub{ font-size: 12.5px; color: var(--ink-3); margin-top: 2px; font-weight: 400; }
.ci-card__action{ font-size: 12.5px; color: var(--ink-2); display: inline-flex; align-items: center; gap: 4px; text-decoration: none; cursor: pointer; }
.ci-card__action:hover{ color: var(--ink); }
.ci-card__action svg, .ci-card__action i{ width: 13px; height: 13px; }
`;
function ciEnsureCardStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-card-css")) return;
  const s = document.createElement("style");
  s.id = "ci-card-css";
  s.textContent = CI_CARD_CSS;
  document.head.appendChild(s);
}
function Card({
  children,
  title,
  subtitle,
  action,
  onAction,
  pad = "md",
  hover = false,
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureCardStyle, []);
  const cls = ["ci-card", pad !== "md" ? `ci-card--pad-${pad}` : "", hover ? "ci-card--hover" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), (title || action) && /*#__PURE__*/React.createElement("div", {
    className: "ci-card__h"
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    className: "ci-card__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "ci-card__sub"
  }, subtitle)), action && /*#__PURE__*/React.createElement("a", {
    className: "ci-card__action",
    onClick: onAction
  }, action)), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/KpiCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — KpiCard
   A dense metric cell: small label + bespoke icon, a heavy tabular value,
   a direction-tinted delta, and an inline sparkline. The `alert` variant
   floods the cell with a soft-red gradient and reddens the value — this is
   how "the negative grita". Designed to sit inside a bordered KPI strip. */

const CI_KPI_CSS = `
.ci-kpi{
  position: relative; padding: 15px 17px; min-width: 0;
  background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius);
  font-family: var(--font-sans);
}
.ci-kpi--flush{ border: 0; border-radius: 0; }
.ci-kpi__l{ display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--ink-2); margin-bottom: 9px; font-weight: 500; }
.ci-kpi__l svg, .ci-kpi__l i{ width: 14px; height: 14px; color: var(--ink-3); flex: 0 0 auto; }
.ci-kpi__v{ font-size: var(--fs-2xl); font-weight: 800; letter-spacing: var(--ls-tight); line-height: 1; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ci-kpi__foot{ display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ci-kpi__trend{ display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: var(--radius-xs); font-size: 11.5px; font-weight: 600; }
.ci-kpi__trend--up{ background: var(--brand-soft); color: var(--pos); }
.ci-kpi__trend--down{ background: var(--neg-soft); color: var(--neg); }
.ci-kpi__trend--flat{ background: var(--warn-soft); color: var(--warn); }
.ci-kpi__spark{ flex: 0 0 auto; width: 46px; height: 20px; }
.ci-kpi__spark path{ stroke-dasharray: 1; }
.ci-kpi--alert{ background: linear-gradient(180deg, var(--neg-soft), var(--panel) 72%); }
.ci-kpi--alert .ci-kpi__v{ color: var(--neg); }
.ci-kpi--alert .ci-kpi__l svg, .ci-kpi--alert .ci-kpi__l i{ color: var(--neg); }
`;
const CI_KPI_GLYPH = {
  up: "↗",
  down: "↘",
  flat: "→"
};
function ciEnsureKpiStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-kpi-css")) return;
  const s = document.createElement("style");
  s.id = "ci-kpi-css";
  s.textContent = CI_KPI_CSS;
  document.head.appendChild(s);
}
function CiSparkline({
  pts = [],
  color = "var(--pos)"
}) {
  if (!pts.length) return null;
  const w = 46,
    h = 20,
    max = Math.max(...pts),
    min = Math.min(...pts);
  const d = pts.map((p, i) => {
    const x = i / (pts.length - 1) * w;
    const y = h - (p - min) / (max - min || 1) * (h - 2) - 1;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return /*#__PURE__*/React.createElement("svg", {
    className: "ci-kpi__spark",
    viewBox: `0 0 ${w} ${h}`,
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: d,
    stroke: color,
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    pathLength: "1"
  }));
}
function KpiCard({
  label,
  icon = null,
  value,
  delta,
  direction = "up",
  spark = [],
  sparkColor,
  alert = false,
  flush = false,
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureKpiStyle, []);
  const cls = ["ci-kpi", alert ? "ci-kpi--alert" : "", flush ? "ci-kpi--flush" : "", className].filter(Boolean).join(" ");
  const col = sparkColor || (direction === "down" ? "var(--neg)" : direction === "flat" ? "var(--warn)" : "var(--pos)");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "ci-kpi__l"
  }, icon, label), /*#__PURE__*/React.createElement("div", {
    className: "ci-kpi__v"
  }, value), /*#__PURE__*/React.createElement("div", {
    className: "ci-kpi__foot"
  }, delta != null && /*#__PURE__*/React.createElement("span", {
    className: `ci-kpi__trend ci-kpi__trend--${direction}`
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, CI_KPI_GLYPH[direction]), delta), /*#__PURE__*/React.createElement(CiSparkline, {
    pts: spark,
    color: col
  })));
}
Object.assign(__ds_scope, { KpiCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/KpiCard.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Conceito Indica — SegmentedControl
   A pill-track of options where one is active (white raised chip). Used for
   period (Hoje / 7 dias / 30 dias …) and chart-type toggles. Compact, with
   an optional icon-only mode. */

const CI_SEG_CSS = `
.ci-seg{ display: inline-flex; background: var(--line-2); border-radius: var(--radius-md); padding: 3px; gap: 2px; }
.ci-seg button{
  font-family: var(--font-sans); font-size: 13px; color: var(--ink-2);
  border: 0; background: transparent; padding: 6px 13px; border-radius: 7px;
  cursor: pointer; display: inline-flex; align-items: center; gap: 5px; line-height: 1;
  transition: background var(--dur-2), color var(--dur-2), box-shadow var(--dur-2);
}
.ci-seg button:hover{ color: var(--ink); }
.ci-seg button.on{ background: var(--panel); color: var(--ink); box-shadow: var(--shadow-sm); font-weight: 600; }
.ci-seg button svg, .ci-seg button i{ width: 13px; height: 13px; }
.ci-seg--sm button{ font-size: 12px; padding: 5px 10px; }
`;
function ciEnsureSegStyle() {
  if (typeof document === "undefined" || document.getElementById("ci-seg-css")) return;
  const s = document.createElement("style");
  s.id = "ci-seg-css";
  s.textContent = CI_SEG_CSS;
  document.head.appendChild(s);
}
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  className = "",
  ...rest
}) {
  React.useEffect(ciEnsureSegStyle, []);
  const cls = ["ci-seg", size === "sm" ? "ci-seg--sm" : "", className].filter(Boolean).join(" ");
  const norm = options.map(o => typeof o === "string" ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls,
    role: "tablist"
  }, rest), norm.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    className: value === o.value ? "on" : "",
    "aria-selected": value === o.value,
    onClick: () => onChange && onChange(o.value)
  }, o.icon, o.label)));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// ui_kits/atendimento/Atendimento.jsx
try { (() => {
/* global React */
/* Atendimento kit — assisted-sales workflow. window.Atendimento */
(function () {
  const {
    useState
  } = React;
  const NS = window.ConceitoIndicaDesignSystem_1bb735 || {};
  const {
    NavRail,
    AskAIBar,
    ThemeToggle,
    Card,
    Button,
    Chip,
    Badge,
    Avatar,
    AnimIcon
  } = NS;
  const SECTIONS = [{
    label: "OPERAÇÃO",
    items: [{
      id: "atendimento",
      label: "Atendimento",
      icon: "atendimento"
    }, {
      id: "orcamentos",
      label: "Orçamentos",
      icon: "orcamentos"
    }, {
      id: "ecommerce",
      label: "E-commerce / iFood",
      icon: "ecommerce"
    }, {
      id: "historico",
      label: "Histórico",
      icon: "historico"
    }, {
      id: "estoque",
      label: "Estoque",
      icon: "estoque",
      dot: true
    }, {
      id: "campanhas",
      label: "Campanhas",
      icon: "campanhas"
    }, {
      id: "fidelizacao",
      label: "Fidelização",
      icon: "fidelizacao"
    }, {
      id: "treinamento",
      label: "Treinamento",
      icon: "treinamento"
    }]
  }, {
    label: "BACKOFFICE",
    items: [{
      id: "dashboard",
      label: "Dashboard",
      icon: "dashboard"
    }, {
      id: "financeiro",
      label: "Financeiro",
      icon: "financeiro",
      dot: true
    }, {
      id: "relatorios",
      label: "Relatórios",
      icon: "relatorios"
    }]
  }];
  const CATS = [["Dor e Febre", "flame", true], ["Respiratório", "lung", false], ["Gastrointestinal", "stomach", false], ["Dermatológico", "derma", false], ["Feminino", "venus", false], ["Infantil", "baby", false]];
  const KITS = [{
    tier: "Recomendado",
    desc: "Melhor equilíbrio entre resultado e custo",
    price: 96.40,
    margin: 46,
    hero: true,
    items: [{
      n: "Paracetamol 750mg · cx 30",
      p: 64.27,
      q: 35
    }, {
      n: "Dipirona Monoidratada 1g",
      p: 32.13,
      q: 61
    }]
  }, {
    tier: "Essencial",
    desc: "Solução básica e acessível",
    price: 64.27,
    margin: 59,
    items: [{
      n: "Paracetamol 750mg · cx 30",
      p: 64.27,
      q: 35
    }]
  }, {
    tier: "Completo",
    desc: "Solução robusta de maior eficácia",
    price: 116.20,
    margin: 55,
    items: [{
      n: "Paracetamol 750mg · cx 30",
      p: 64.27,
      q: 35
    }, {
      n: "Dipirona Monoidratada 1g",
      p: 32.13,
      q: 61
    }, {
      n: "Dropropizina Xarope",
      p: 19.80,
      q: 120
    }]
  }];
  const COMBOS = [{
    t: "Febre + dor no corpo",
    s: "Paracetamol + Dipirona",
    p: 96.40,
    items: [{
      n: "Paracetamol 750mg · cx 30",
      p: 64.27
    }, {
      n: "Dipirona Monoidratada 1g",
      p: 32.13
    }]
  }, {
    t: "Reidratação",
    s: "Soro + Vitamina C",
    p: 28.90,
    items: [{
      n: "Soro reidratante",
      p: 12.90
    }, {
      n: "Vitamina C",
      p: 16.00
    }]
  }];
  const brl = n => "R$ " + n.toFixed(2).replace(".", ",");
  const CAT_ICONS = {
    flame: /*#__PURE__*/React.createElement("path", {
      d: "M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 .5 1 1.2 1.4 2 1.6C12 6 11 5 12 3z"
    }),
    lung: /*#__PURE__*/React.createElement("path", {
      d: "M12 3v8M8 11c0 5-2 6-3.5 8C3 19 3 13 5 11s3-1 3 0zM16 11c0 5 2 6 3.5 8 1.5-2 1.5-8-.5-10s-3-1-3 0z"
    }),
    stomach: /*#__PURE__*/React.createElement("path", {
      d: "M9 4v5a4 4 0 0 0 4 4h2a4 4 0 0 1 0 8c-4 0-7-3-7-7V8a4 4 0 0 1 4-4"
    }),
    derma: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "4",
      y: "4",
      width: "16",
      height: "16",
      rx: "4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "10",
      r: ".6"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "14",
      cy: "13",
      r: ".6"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "8",
      r: ".6"
    })),
    venus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "9",
      r: "5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 14v7M9 18h6"
    })),
    baby: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "7",
      r: "3.2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M7 21c0-3 2-5 5-5s5 2 5 5"
    }))
  };
  const CatIcon = ({
    t
  }) => /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, CAT_ICONS[t]);
  const Lc = (d, s = 16) => /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, d);
  const ICO = {
    user: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "8",
      r: "4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M6 21v-1a6 6 0 0 1 12 0v1"
    })),
    bell: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10.3 21a1.9 1.9 0 0 0 3.4 0"
    })),
    help: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 17h.01"
    })),
    quote: /*#__PURE__*/React.createElement("path", {
      d: "M10 11H6a1 1 0 0 1-1-1V8a3 3 0 0 1 3-3M19 11h-4a1 1 0 0 1-1-1V8a3 3 0 0 1 3-3"
    }),
    plus: /*#__PURE__*/React.createElement("path", {
      d: "M12 5v14M5 12h14"
    }),
    cart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "8",
      cy: "21",
      r: "1"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "19",
      cy: "21",
      r: "1"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M2 3h2l2.5 12.5a2 2 0 0 0 2 1.5h8.7a2 2 0 0 0 2-1.5L21 7H5.2"
    })),
    x: /*#__PURE__*/React.createElement("path", {
      d: "M18 6 6 18M6 6l12 12"
    }),
    check: /*#__PURE__*/React.createElement("path", {
      d: "M20 6 9 17l-5-5"
    }),
    shield: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 8v4M12 16h.01"
    })),
    phone: /*#__PURE__*/React.createElement("path", {
      d: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9z"
    }),
    sparkles: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M19 4v3M20.5 5.5h-3"
    }))
  };
  function Atendimento() {
    const [active, setActive] = useState("atendimento");
    const [cat, setCat] = useState(0);
    const [cart, setCart] = useState([]);
    const add = it => setCart(c => {
      const i = c.findIndex(x => x.n === it.n);
      if (i >= 0) {
        const cp = [...c];
        cp[i] = {
          ...cp[i],
          u: cp[i].u + 1
        };
        return cp;
      }
      return [...c, {
        n: it.n,
        p: it.p,
        u: 1
      }];
    });
    const addKit = k => k.items.forEach(add);
    const removeAt = i => setCart(c => c.filter((_, j) => j !== i));
    const subtotal = cart.reduce((s, x) => s + x.p * x.u, 0);
    const units = cart.reduce((s, x) => s + x.u, 0);
    return /*#__PURE__*/React.createElement("div", {
      className: "ci-atd screen"
    }, /*#__PURE__*/React.createElement(NavRail, {
      sections: SECTIONS,
      active: active,
      onSelect: setActive,
      user: {
        initials: "MS",
        name: "Mariana Silva",
        role: "Atendente · Caixa",
        tone: "neutral"
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd__main"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-top"
    }, /*#__PURE__*/React.createElement("h1", null, "Atendimento"), /*#__PURE__*/React.createElement(AskAIBar, {
      label: "Descreva o sintoma do cliente",
      placeholderMode: true,
      suggestions: ["febre", "coriza", "tosse seca", "dor de cabeça", "azia", "alergia na pele"],
      orb: Lc(ICO.sparkles, 16)
    }), /*#__PURE__*/React.createElement("div", {
      className: "ci-spacer"
    }), /*#__PURE__*/React.createElement(ThemeToggle, {
      target: ".ci-atd"
    }), /*#__PURE__*/React.createElement("button", {
      className: "ci-icbtn"
    }, Lc(ICO.bell, 17)), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-user"
    }, /*#__PURE__*/React.createElement(Avatar, {
      initials: "MS",
      tone: "pink"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Mariana Silva"), /*#__PURE__*/React.createElement("small", null, "Atendente \xB7 Caixa")))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-clientrow"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-client"
    }, Lc(ICO.user, 17), /*#__PURE__*/React.createElement("input", {
      readOnly: true,
      placeholder: "Identificar cliente \u2014 nome, telefone ou CPF"
    }), /*#__PURE__*/React.createElement("span", {
      className: "ci-atd-kbd"
    }, "+ Novo")), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-cats"
    }, CATS.map((c, i) => /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "ci-atd-cat" + (i === cat ? " on" : ""),
      onClick: () => setCat(i)
    }, /*#__PURE__*/React.createElement(CatIcon, {
      t: c[1]
    }), c[0])))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-grid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-col"
    }, /*#__PURE__*/React.createElement(Card, {
      pad: "sm",
      className: "ci-anim-up",
      style: {
        animationDelay: ".05s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-step"
    }, "Triagem \xB7 Dor e Febre \xB7 Febre"), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-interp"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-irow"
    }, /*#__PURE__*/React.createElement("span", null, "Confian\xE7a da IA"), /*#__PURE__*/React.createElement("div", {
      className: "ci-conf"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-conf-bar"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: "60%"
      }
    })), /*#__PURE__*/React.createElement("b", null, "m\xE9dia"))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-irow"
    }, /*#__PURE__*/React.createElement("span", null, "Sintomas"), /*#__PURE__*/React.createElement("b", null, "febre"))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-qh"
    }, Lc(ICO.help, 14), " Perguntas sugeridas"), /*#__PURE__*/React.createElement("button", {
      className: "ci-atd-qchip"
    }, "A dor \xE9 leve, moderada ou forte?"), /*#__PURE__*/React.createElement("button", {
      className: "ci-atd-qchip"
    }, "Tem outros sinais de alerta?"), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-tip"
    }, Lc(ICO.quote, 14), " \"Quer algo s\xF3 para a febre ou est\xE1 com dor no corpo tamb\xE9m?\""), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-suglabel"
    }, "Produtos sugeridos"), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-chips"
    }, ["febre", "antitérmico", "dipirona", "paracetamol"].map((s, i) => /*#__PURE__*/React.createElement(Chip, {
      key: i,
      variant: "search",
      icon: Lc(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
        cx: "11",
        cy: "11",
        r: "8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m21 21-4.3-4.3"
      })), 13)
    }, s))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-suglabel"
    }, "Complementares"), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-chips"
    }, ["vitamina C", "soro reidratante"].map((s, i) => /*#__PURE__*/React.createElement(Chip, {
      key: i,
      variant: "complement",
      icon: Lc(ICO.plus, 13)
    }, s))))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-col"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-kitshead"
    }, /*#__PURE__*/React.createElement("b", null, "Ofertas para ", /*#__PURE__*/React.createElement("span", {
      className: "hl"
    }, "febre")), /*#__PURE__*/React.createElement("span", {
      className: "ci-atd-kcount"
    }, /*#__PURE__*/React.createElement(AnimIcon, {
      name: "margem",
      size: 12,
      play: "none"
    }), " geradas pela IA \xB7 3 op\xE7\xF5es")), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-kits"
    }, KITS.map((k, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "ci-atd-kit" + (k.hero ? " hero" : "") + " ci-anim-up",
      style: {
        animationDelay: 0.08 + i * 0.06 + "s"
      }
    }, k.hero && /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-ribbon"
    }, Lc(ICO.sparkles, 12), " Melhor escolha"), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-kit-h"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ci-atd-tier"
    }, k.tier), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-kit-price"
    }, brl(k.price), /*#__PURE__*/React.createElement("span", {
      className: "ci-atd-kit-margin"
    }, k.margin, "% margem"))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-kit-desc"
    }, k.desc), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-kit-items"
    }, k.items.map((it, j) => /*#__PURE__*/React.createElement("div", {
      key: j,
      className: "ci-atd-prod"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-prod-tx"
    }, /*#__PURE__*/React.createElement("b", null, it.n), /*#__PURE__*/React.createElement("span", null, brl(it.p))), /*#__PURE__*/React.createElement("span", {
      className: "ci-atd-stock"
    }, /*#__PURE__*/React.createElement("i", null), it.q, " un"), /*#__PURE__*/React.createElement("button", {
      className: "ci-atd-add",
      onClick: () => add(it),
      title: "Adicionar"
    }, Lc(ICO.plus, 16))))), /*#__PURE__*/React.createElement(Button, {
      variant: k.hero ? "brand" : "secondary",
      size: "sm",
      block: true,
      icon: Lc(ICO.plus, 15),
      onClick: () => addKit(k)
    }, "Adicionar kit ", k.tier))))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-col"
    }, /*#__PURE__*/React.createElement(Card, {
      pad: "sm",
      className: "ci-anim-up",
      style: {
        animationDelay: ".1s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-cart-h"
    }, /*#__PURE__*/React.createElement("b", null, "Carrinho"), /*#__PURE__*/React.createElement("span", {
      className: "ci-atd-cart-n"
    }, units === 0 ? "vazio" : units + " itens")), cart.length === 0 ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-zero-hint"
    }, Lc(ICO.cart, 16), " Adicione um kit ou monte do zero"), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-combos-t"
    }, "Combos sugeridos pela IA"), COMBOS.map((cb, i) => /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "ci-atd-combo",
      onClick: () => cb.items.forEach(add)
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-combo-tx"
    }, /*#__PURE__*/React.createElement("b", null, cb.t), /*#__PURE__*/React.createElement("span", null, cb.s)), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-combo-r"
    }, /*#__PURE__*/React.createElement("b", null, brl(cb.p)), /*#__PURE__*/React.createElement("span", {
      className: "ci-atd-combo-add"
    }, Lc(ICO.plus, 14)))))) : /*#__PURE__*/React.createElement("div", null, cart.map((x, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "ci-atd-citem"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-citem-tx"
    }, /*#__PURE__*/React.createElement("b", null, x.n), /*#__PURE__*/React.createElement("span", null, x.u, " \xD7 ", brl(x.p))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-citem-r"
    }, /*#__PURE__*/React.createElement("b", null, brl(x.p * x.u)), /*#__PURE__*/React.createElement("button", {
      className: "ci-atd-rm",
      onClick: () => removeAt(i)
    }, Lc(ICO.x, 13)))))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-sum"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-srow"
    }, /*#__PURE__*/React.createElement("span", null, "Subtotal"), /*#__PURE__*/React.createElement("b", null, brl(subtotal))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-srow"
    }, /*#__PURE__*/React.createElement("span", null, "Desconto"), /*#__PURE__*/React.createElement("b", null, "\u2212 ", brl(0))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-srow total"
    }, /*#__PURE__*/React.createElement("span", null, "Total"), /*#__PURE__*/React.createElement("b", null, brl(subtotal))), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-srow muted"
    }, /*#__PURE__*/React.createElement("span", null, "Margem estimada"), /*#__PURE__*/React.createElement("b", null, subtotal > 0 ? "52%" : "—"))), /*#__PURE__*/React.createElement(Button, {
      variant: "brand",
      block: true,
      disabled: subtotal === 0,
      icon: Lc(ICO.check, 17)
    }, "Finalizar venda"), /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-actions2"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      block: true
    }, "Salvar or\xE7amento"), /*#__PURE__*/React.createElement(Button, {
      variant: "destructive",
      size: "sm",
      block: true
    }, "Venda perdida"))), /*#__PURE__*/React.createElement(Card, {
      pad: "sm",
      className: "ci-atd-safe ci-anim-up",
      style: {
        animationDelay: ".16s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-atd-safe-h"
    }, Lc(ICO.shield, 16), " Aten\xE7\xE3o necess\xE1ria"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, "Verifique alergias"), /*#__PURE__*/React.createElement("li", null, "Doen\xE7as cr\xF4nicas"), /*#__PURE__*/React.createElement("li", null, "Medicamentos cont\xEDnuos")), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      block: true,
      icon: Lc(ICO.phone, 14)
    }, "Chamar farmac\xEAutico")))))));
  }
  window.Atendimento = Atendimento;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/atendimento/Atendimento.jsx", error: String((e && e.message) || e) }); }

// ui_kits/relatorios/Chart.jsx
try { (() => {
/* global React */
/* Relatórios kit — interactive Faturamento × custo chart.
   Period drives the data; series toggles + hover crosshair tooltip.
   Uses DS SegmentedControl for the toggles. window.CIChart */
(function () {
  const {
    useState,
    useRef,
    useEffect
  } = React;
  const NS = window.ConceitoIndicaDesignSystem_1bb735 || {};
  const SegmentedControl = NS.SegmentedControl || (() => null);
  const Card = NS.Card || (p => /*#__PURE__*/React.createElement("div", p));
  const DATA = {
    hoje: {
      labels: ["08h", "10h", "12h", "14h", "16h", "18h", "20h"],
      receita: [18, 24, 16, 34, 28, 42, 36],
      custo: [22, 22, 24, 30, 32, 40, 44]
    },
    "7d": {
      labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
      receita: [120, 140, 110, 160, 150, 180, 120],
      custo: [130, 135, 125, 155, 150, 170, 140]
    },
    "30d": {
      labels: ["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23", "25", "27", "29"],
      receita: [120, 140, 130, 155, 150, 170, 160, 140, 175, 165, 190, 185, 205, 200, 210],
      custo: [128, 135, 138, 150, 148, 165, 162, 150, 170, 168, 185, 182, 198, 196, 205]
    },
    mes: {
      labels: ["S1", "S2", "S3", "S4", "S5"],
      receita: [480, 520, 500, 560, 540],
      custo: [500, 515, 510, 545, 548]
    }
  };
  const PERIODS = [{
    value: "hoje",
    label: "Hoje"
  }, {
    value: "7d",
    label: "7 dias"
  }, {
    value: "30d",
    label: "30 dias"
  }, {
    value: "mes",
    label: "Este mês"
  }];
  const SERIES = [{
    key: "receita",
    label: "Receita",
    color: "#0c8f5f"
  }, {
    key: "custo",
    label: "Custo + despesa",
    color: "#a8a69c"
  }, {
    key: "lucro",
    label: "Lucro operacional",
    color: "#3b6ef0"
  }];
  const fmt = v => "R$ " + Math.round(v).toLocaleString("pt-BR");
  function CIChart({
    period,
    setPeriod
  }) {
    const [type, setType] = useState("area");
    const [vis, setVis] = useState({
      receita: true,
      custo: true,
      lucro: false
    });
    const [hover, setHover] = useState(null);
    const wrapRef = useRef(null);
    const [w, setW] = useState(640);
    const [H, setHt] = useState(260);
    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const measure = () => {
        setW(el.clientWidth);
        setHt(Math.max(el.clientHeight, 180));
      };
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      measure();
      return () => ro.disconnect();
    }, []);
    const ds = DATA[period];
    const N = ds.labels.length;
    const lucro = ds.receita.map((r, i) => r - ds.custo[i]);
    const valuesOf = k => k === "lucro" ? lucro : ds[k];
    const active = SERIES.filter(s => vis[s.key]);
    const allVals = active.flatMap(s => valuesOf(s.key)).concat([0]);
    let max = Math.max(...allVals),
      min = Math.min(...allVals);
    const range = max - min || 1;
    max += range * 0.1;
    min -= range * 0.1;
    const padL = 10,
      padR = 10,
      padT = 14,
      padB = 26;
    const X = i => padL + i / (N - 1) * (w - padL - padR);
    const Y = v => padT + (max - v) / (max - min) * (H - padT - padB);
    const zeroY = Y(0);
    const linePath = arr => arr.map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
    const areaPath = arr => `${linePath(arr)} L${X(N - 1).toFixed(1)},${zeroY.toFixed(1)} L${X(0).toFixed(1)},${zeroY.toFixed(1)} Z`;
    const onMove = e => {
      const r = wrapRef.current.getBoundingClientRect();
      let idx = Math.round((e.clientX - r.left - padL) / (w - padL - padR) * (N - 1));
      setHover(Math.max(0, Math.min(N - 1, idx)));
    };
    const barGroupW = (w - padL - padR) / N * 0.62;
    const barW = active.length ? barGroupW / active.length : barGroupW;
    const Ic = n => /*#__PURE__*/React.createElement("i", {
      "data-lucide": n
    });
    return /*#__PURE__*/React.createElement(Card, {
      className: "ci-chartcard ci-anim-up",
      style: {
        animationDelay: ".28s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-chead"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "-.01em",
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, "Faturamento \xD7 custo operacional"), /*#__PURE__*/React.createElement("div", {
      className: "ci-csub"
    }, "Evolu\xE7\xE3o \xB7 ", PERIODS.find(p => p.value === period).label.toLowerCase())), /*#__PURE__*/React.createElement("div", {
      className: "ci-ctools"
    }, /*#__PURE__*/React.createElement(SegmentedControl, {
      size: "sm",
      value: period,
      onChange: setPeriod,
      options: PERIODS
    }), /*#__PURE__*/React.createElement(SegmentedControl, {
      size: "sm",
      value: type,
      onChange: setType,
      options: [{
        value: "area",
        icon: Ic("activity")
      }, {
        value: "line",
        icon: Ic("trending-up")
      }, {
        value: "bars",
        icon: Ic("bar-chart-3")
      }]
    }))), /*#__PURE__*/React.createElement("div", {
      className: "ci-legend"
    }, SERIES.map(s => {
      const tot = valuesOf(s.key).reduce((a, b) => a + b, 0);
      return /*#__PURE__*/React.createElement("div", {
        key: s.key,
        className: "ci-lg" + (vis[s.key] ? "" : " off"),
        onClick: () => setVis(v => ({
          ...v,
          [s.key]: !v[s.key]
        }))
      }, /*#__PURE__*/React.createElement("span", {
        className: "ci-sw",
        style: {
          background: s.color
        }
      }), s.label, /*#__PURE__*/React.createElement("span", {
        className: "ci-val",
        style: {
          color: s.key === "lucro" && tot < 0 ? "var(--neg)" : undefined
        }
      }, fmt(tot)));
    })), /*#__PURE__*/React.createElement("div", {
      className: "ci-chartwrap",
      ref: wrapRef,
      onMouseMove: onMove,
      onMouseLeave: () => setHover(null)
    }, /*#__PURE__*/React.createElement("svg", {
      key: period + "-" + type,
      width: w,
      height: H,
      viewBox: `0 0 ${w} ${H}`,
      fill: "none"
    }, /*#__PURE__*/React.createElement("defs", null, active.map(s => /*#__PURE__*/React.createElement("linearGradient", {
      key: s.key,
      id: `cig-${s.key}`,
      x1: "0",
      x2: "0",
      y1: "0",
      y2: "1"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: s.color,
      stopOpacity: "0.18"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: s.color,
      stopOpacity: "0.01"
    })))), [0, 1, 2, 3].map(g => {
      const yy = padT + g / 3 * (H - padT - padB);
      return /*#__PURE__*/React.createElement("line", {
        key: g,
        x1: padL,
        x2: w - padR,
        y1: yy,
        y2: yy,
        stroke: "var(--line)",
        strokeWidth: "1"
      });
    }), min < 0 && /*#__PURE__*/React.createElement("line", {
      x1: padL,
      x2: w - padR,
      y1: zeroY,
      y2: zeroY,
      stroke: "var(--ink-3)",
      strokeWidth: "1.2",
      strokeDasharray: "3 3"
    }), ds.labels.map((l, i) => (N <= 12 || i % 2 === 0) && /*#__PURE__*/React.createElement("text", {
      key: i,
      x: X(i),
      y: H - 8,
      fontSize: "10.5",
      fill: "var(--ink-3)",
      textAnchor: "middle",
      fontFamily: "Hanken Grotesk, sans-serif"
    }, l)), type === "bars" ? active.map((s, si) => valuesOf(s.key).map((v, i) => {
      const x0 = X(i) - barGroupW / 2 + si * barW;
      const top = Math.min(Y(v), zeroY),
        hh = Math.abs(Y(v) - zeroY);
      return /*#__PURE__*/React.createElement("rect", {
        key: s.key + i,
        x: x0,
        y: top,
        width: Math.max(1, barW - 2),
        height: Math.max(1, hh),
        rx: "2",
        fill: s.color,
        opacity: v < 0 ? 0.85 : 1
      });
    })) : active.map((s, si) => /*#__PURE__*/React.createElement("g", {
      key: s.key
    }, type === "area" && /*#__PURE__*/React.createElement("path", {
      className: "ci-rd-area",
      d: areaPath(valuesOf(s.key)),
      fill: `url(#cig-${s.key})`
    }), /*#__PURE__*/React.createElement("path", {
      className: "ci-rd-line",
      pathLength: "1",
      style: {
        animationDelay: si * 0.12 + "s"
      },
      d: linePath(valuesOf(s.key)),
      stroke: s.color,
      strokeWidth: "2.4",
      strokeLinejoin: "round",
      strokeLinecap: "round"
    }))), hover != null && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
      x1: X(hover),
      x2: X(hover),
      y1: padT,
      y2: H - padB,
      stroke: "var(--ink-3)",
      strokeWidth: "1"
    }), active.map(s => /*#__PURE__*/React.createElement("circle", {
      key: s.key,
      cx: X(hover),
      cy: Y(valuesOf(s.key)[hover]),
      r: "4",
      fill: "var(--panel)",
      stroke: s.color,
      strokeWidth: "2.2"
    })))), hover != null && /*#__PURE__*/React.createElement("div", {
      className: "ci-tip",
      style: {
        left: `${Math.min(Math.max(X(hover) / w * 100, 12), 88)}%`
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-tl"
    }, ds.labels[hover]), active.map(s => /*#__PURE__*/React.createElement("div", {
      key: s.key,
      className: "ci-tr"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ci-lab"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ci-sw",
      style: {
        background: s.color
      }
    }), s.label), /*#__PURE__*/React.createElement("b", {
      style: {
        color: s.key === "lucro" && valuesOf(s.key)[hover] < 0 ? "var(--neg)" : "var(--ink)"
      }
    }, fmt(valuesOf(s.key)[hover])))))));
  }
  window.CIChart = CIChart;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/relatorios/Chart.jsx", error: String((e && e.message) || e) }); }

// ui_kits/relatorios/Relatorios.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Relatórios kit — full reports/dashboard screen. window.Relatorios */
(function () {
  const {
    useState
  } = React;
  const NS = window.ConceitoIndicaDesignSystem_1bb735 || {};
  const {
    NavRail,
    AskAIBar,
    ThemeToggle,
    KpiCard,
    AnimIcon,
    Button,
    Card,
    Badge,
    StatusDot
  } = NS;
  const SECTIONS = [{
    label: "OPERAÇÃO",
    items: [{
      id: "atendimento",
      label: "Atendimento",
      icon: "atendimento"
    }, {
      id: "orcamentos",
      label: "Orçamentos",
      icon: "orcamentos"
    }, {
      id: "ecommerce",
      label: "E-commerce / iFood",
      icon: "ecommerce"
    }, {
      id: "historico",
      label: "Histórico",
      icon: "historico"
    }, {
      id: "estoque",
      label: "Estoque",
      icon: "estoque",
      dot: true
    }, {
      id: "campanhas",
      label: "Campanhas",
      icon: "campanhas"
    }, {
      id: "fidelizacao",
      label: "Fidelização",
      icon: "fidelizacao"
    }, {
      id: "treinamento",
      label: "Treinamento",
      icon: "treinamento"
    }]
  }, {
    label: "BACKOFFICE",
    items: [{
      id: "dashboard",
      label: "Dashboard",
      icon: "dashboard"
    }, {
      id: "multiloja",
      label: "Multi-loja",
      icon: "multiloja"
    }, {
      id: "transferencias",
      label: "Transferências",
      icon: "transferencias"
    }, {
      id: "metas",
      label: "Metas",
      icon: "metas"
    }, {
      id: "cadastros",
      label: "Cadastros",
      icon: "cadastros"
    }, {
      id: "compras",
      label: "Compras",
      icon: "compras"
    }, {
      id: "financeiro",
      label: "Financeiro",
      icon: "financeiro",
      dot: true
    }, {
      id: "fiscal",
      label: "Fiscal",
      icon: "fiscal"
    }, {
      id: "sngpc",
      label: "SNGPC",
      icon: "sngpc"
    }, {
      id: "relatorios",
      label: "Relatórios",
      icon: "relatorios"
    }]
  }];
  const KPI = {
    "30d": [{
      label: "Faturamento",
      icon: "fat",
      value: "R$ 2.166,79",
      delta: "+12,4%",
      direction: "up",
      spark: [4, 5, 4, 6, 7, 6, 8, 9]
    }, {
      label: "Lucro bruto",
      icon: "lucro",
      value: "R$ 1.723,78",
      delta: "+9,1%",
      direction: "up",
      spark: [3, 4, 4, 5, 5, 6, 7, 7]
    }, {
      label: "Margem bruta",
      icon: "margem",
      value: "81,2%",
      delta: "−0,3pp",
      direction: "flat",
      spark: [7, 7, 8, 7, 8, 7, 8, 8]
    }, {
      label: "Lucro líq. gerencial",
      icon: "alert",
      value: "−R$ 30.527",
      delta: "−14× receita",
      direction: "down",
      alert: true,
      spark: [6, 5, 4, 3, 2, 2, 1, 1]
    }, {
      label: "Contas em aberto",
      icon: "contas",
      value: "R$ 9.261,92",
      delta: "8 vencidas",
      direction: "down",
      spark: [3, 4, 5, 5, 6, 7, 7, 8]
    }, {
      label: "Estoque crítico",
      icon: "estoque",
      value: "11 itens",
      delta: "+3 hoje",
      direction: "down",
      spark: [2, 3, 3, 4, 5, 6, 8, 11]
    }],
    hoje: [{
      label: "Faturamento",
      icon: "fat",
      value: "R$ 198,40",
      delta: "+4,1%",
      direction: "up",
      spark: [1, 2, 1, 3, 2, 3, 4]
    }, {
      label: "Lucro bruto",
      icon: "lucro",
      value: "R$ 162,30",
      delta: "+3,0%",
      direction: "up",
      spark: [1, 2, 2, 3, 3, 3, 4]
    }, {
      label: "Margem bruta",
      icon: "margem",
      value: "81,8%",
      delta: "−0,1pp",
      direction: "flat",
      spark: [7, 7, 8, 7, 8, 8, 8]
    }, {
      label: "Lucro líq. gerencial",
      icon: "alert",
      value: "−R$ 1.870",
      delta: "−9× receita",
      direction: "down",
      alert: true,
      spark: [5, 4, 3, 3, 2, 1, 1]
    }, {
      label: "Contas em aberto",
      icon: "contas",
      value: "R$ 9.261,92",
      delta: "8 vencidas",
      direction: "down",
      spark: [3, 4, 5, 6, 7, 7, 8]
    }, {
      label: "Estoque crítico",
      icon: "estoque",
      value: "11 itens",
      delta: "+3 hoje",
      direction: "down",
      spark: [2, 3, 4, 5, 6, 8, 11]
    }],
    "7d": [{
      label: "Faturamento",
      icon: "fat",
      value: "R$ 980,50",
      delta: "+7,8%",
      direction: "up",
      spark: [2, 3, 3, 4, 5, 6, 7]
    }, {
      label: "Lucro bruto",
      icon: "lucro",
      value: "R$ 786,10",
      delta: "+6,2%",
      direction: "up",
      spark: [2, 3, 4, 4, 5, 6, 7]
    }, {
      label: "Margem bruta",
      icon: "margem",
      value: "80,2%",
      delta: "−0,4pp",
      direction: "flat",
      spark: [8, 7, 8, 7, 8, 7, 8]
    }, {
      label: "Lucro líq. gerencial",
      icon: "alert",
      value: "−R$ 9.210",
      delta: "−9× receita",
      direction: "down",
      alert: true,
      spark: [6, 5, 4, 3, 3, 2, 1]
    }, {
      label: "Contas em aberto",
      icon: "contas",
      value: "R$ 9.261,92",
      delta: "8 vencidas",
      direction: "down",
      spark: [3, 4, 5, 5, 6, 7, 8]
    }, {
      label: "Estoque crítico",
      icon: "estoque",
      value: "11 itens",
      delta: "+3 hoje",
      direction: "down",
      spark: [2, 3, 3, 5, 6, 8, 11]
    }],
    mes: [{
      label: "Faturamento",
      icon: "fat",
      value: "R$ 2.840,00",
      delta: "+6,1%",
      direction: "up",
      spark: [4, 5, 5, 6, 6, 7, 8, 8]
    }, {
      label: "Lucro bruto",
      icon: "lucro",
      value: "R$ 2.255,00",
      delta: "+5,2%",
      direction: "up",
      spark: [4, 4, 5, 6, 6, 7, 7, 8]
    }, {
      label: "Margem bruta",
      icon: "margem",
      value: "79,4%",
      delta: "−1,1pp",
      direction: "down",
      spark: [8, 8, 7, 8, 7, 7, 6, 7]
    }, {
      label: "Lucro líq. gerencial",
      icon: "alert",
      value: "−R$ 31.040",
      delta: "−11× receita",
      direction: "down",
      alert: true,
      spark: [6, 5, 5, 4, 3, 2, 2, 1]
    }, {
      label: "Contas em aberto",
      icon: "contas",
      value: "R$ 9.261,92",
      delta: "8 vencidas",
      direction: "down",
      spark: [3, 4, 5, 6, 6, 7, 7, 8]
    }, {
      label: "Estoque crítico",
      icon: "estoque",
      value: "11 itens",
      delta: "+3 mês",
      direction: "down",
      spark: [2, 3, 4, 5, 6, 7, 9, 11]
    }]
  };
  const REPORTS = [["vendas", "Vendas", "32 registros", null], ["compras", "Compras / NF Entrada", "25 registros", "warn"], ["financeiro", "Financeiro / Boletos", "16 registros", "warn"], ["estoque", "Estoque", "2.065 registros", "neg"], ["entregas", "Entregas", "12 registros", null], ["recebiveis", "Recebíveis & Tesouraria", "18 registros", null], ["sngpc", "SNGPC / Receituário", "7 registros", null]];
  const SIGNALS = [["neg", "Itens críticos / zerados", "Priorizar reposição", "11"], ["warn", "Pendências vencidas", "Cobrar ou regularizar", "18"], ["warn", "Itens pendentes", "Acompanhar fechamento", "18"], ["pos", "Vendas no período", "Ritmo acima da meta", "+12%"]];
  const RECENTS = [["Vendas", "32 registros · há 2 min", null, "—"], ["Compras / NF Entrada", "25 registros · há 1 h", "warn", "7 pend."], ["Financeiro / Boletos", "16 registros · hoje", "warn", "8 venc."], ["Estoque", "2.065 registros · hoje", "neg", "11 crít."]];
  const Chev = () => /*#__PURE__*/React.createElement("span", {
    className: "ci-chev"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })));
  function RightMenu() {
    const [tab, setTab] = useState("rel");
    return /*#__PURE__*/React.createElement("div", {
      className: "ci-menu ci-anim-up",
      style: {
        animationDelay: ".36s"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-menu-tabs"
    }, /*#__PURE__*/React.createElement("button", {
      className: tab === "rel" ? "on" : "",
      onClick: () => setTab("rel")
    }, "Relat\xF3rios ", /*#__PURE__*/React.createElement("span", {
      className: "ci-cnt"
    }, "7")), /*#__PURE__*/React.createElement("button", {
      className: tab === "sig" ? "on" : "",
      onClick: () => setTab("sig")
    }, "Sinais ", /*#__PURE__*/React.createElement("span", {
      className: "ci-cnt"
    }, "4")), /*#__PURE__*/React.createElement("button", {
      className: tab === "rec" ? "on" : "",
      onClick: () => setTab("rec")
    }, "Recentes")), /*#__PURE__*/React.createElement("div", {
      className: "ci-menu-body"
    }, tab === "rel" && REPORTS.map((r, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "ci-mrow"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-mi"
    }, /*#__PURE__*/React.createElement(AnimIcon, {
      name: r[0],
      size: 16
    })), /*#__PURE__*/React.createElement("div", {
      className: "ci-mtx"
    }, /*#__PURE__*/React.createElement("b", null, r[1]), /*#__PURE__*/React.createElement("span", null, r[2])), /*#__PURE__*/React.createElement("div", {
      className: "ci-mend"
    }, r[3] && /*#__PURE__*/React.createElement(StatusDot, {
      tone: r[3]
    }), /*#__PURE__*/React.createElement(Chev, null)))), tab === "sig" && SIGNALS.map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "ci-mrow"
    }, /*#__PURE__*/React.createElement(StatusDot, {
      tone: s[0]
    }), /*#__PURE__*/React.createElement("div", {
      className: "ci-mtx",
      style: {
        marginLeft: 4
      }
    }, /*#__PURE__*/React.createElement("b", null, s[1]), /*#__PURE__*/React.createElement("span", null, s[2])), /*#__PURE__*/React.createElement("div", {
      className: "ci-mend"
    }, /*#__PURE__*/React.createElement("b", {
      className: "ci-num",
      style: {
        fontSize: 13,
        fontVariantNumeric: "tabular-nums"
      }
    }, s[3]), /*#__PURE__*/React.createElement(Chev, null)))), tab === "rec" && RECENTS.map((r, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "ci-mrow"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-mi"
    }, /*#__PURE__*/React.createElement(AnimIcon, {
      name: "orcamentos",
      size: 16,
      play: "none"
    })), /*#__PURE__*/React.createElement("div", {
      className: "ci-mtx"
    }, /*#__PURE__*/React.createElement("b", null, r[0]), /*#__PURE__*/React.createElement("span", null, r[1])), /*#__PURE__*/React.createElement("div", {
      className: "ci-mend"
    }, r[2] && /*#__PURE__*/React.createElement(Badge, {
      tone: r[2]
    }, r[3]), /*#__PURE__*/React.createElement(Chev, null))))), /*#__PURE__*/React.createElement("div", {
      className: "ci-menu-foot"
    }, /*#__PURE__*/React.createElement("a", null, tab === "rel" ? "Ver todos os relatórios" : tab === "sig" ? "Abrir central de sinais" : "Histórico completo", " \u2192")));
  }
  function Relatorios() {
    const [period, setPeriod] = useState("30d");
    const [active, setActive] = useState("relatorios");
    const kpis = KPI[period];
    const Ic = n => /*#__PURE__*/React.createElement("i", {
      "data-lucide": n
    });
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "ci-app screen"
    }, /*#__PURE__*/React.createElement(NavRail, {
      sections: SECTIONS,
      active: active,
      onSelect: setActive,
      user: {
        initials: "MS",
        name: "Dr. Marcelo Santos",
        role: "Farmacêutico RT · CRF 12345"
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "ci-app__main"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-top"
    }, /*#__PURE__*/React.createElement("h1", null, /*#__PURE__*/React.createElement(AnimIcon, {
      name: "relatorios",
      size: 26,
      play: "hover"
    }), " Relat\xF3rios"), /*#__PURE__*/React.createElement(AskAIBar, {
      suggestions: ["Qual foi meu faturamento no período?", "Quais produtos estão com estoque crítico?", "Onde estou perdendo margem?", "Quanto tenho a receber este mês?"]
    }), /*#__PURE__*/React.createElement("div", {
      className: "ci-spacer"
    }), /*#__PURE__*/React.createElement(ThemeToggle, {
      target: ".ci-app"
    }), /*#__PURE__*/React.createElement("button", {
      className: "ci-icbtn"
    }, Ic("download")), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: Ic("plus")
    }, "Novo relat\xF3rio")), /*#__PURE__*/React.createElement("div", {
      className: "ci-body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ci-kstrip"
    }, kpis.map((k, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "ci-anim-up",
      style: {
        animationDelay: i * 0.05 + "s"
      }
    }, /*#__PURE__*/React.createElement(KpiCard, _extends({
      flush: true
    }, k, {
      icon: /*#__PURE__*/React.createElement(AnimIcon, {
        name: k.icon,
        size: 14,
        play: "none"
      })
    }))))), /*#__PURE__*/React.createElement("div", {
      className: "ci-dash"
    }, /*#__PURE__*/React.createElement(window.CIChart, {
      period: period,
      setPeriod: setPeriod
    }), /*#__PURE__*/React.createElement(RightMenu, null)))));
  }
  window.Relatorios = Relatorios;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/relatorios/Relatorios.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AskAIBar = __ds_scope.AskAIBar;

__ds_ns.ThemeToggle = __ds_scope.ThemeToggle;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.TrendPill = __ds_scope.TrendPill;

__ds_ns.AnimIcon = __ds_scope.AnimIcon;

__ds_ns.NavRail = __ds_scope.NavRail;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.KpiCard = __ds_scope.KpiCard;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

})();
