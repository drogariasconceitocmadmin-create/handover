/* global React */
/* Liquid Glass — SF Symbol-style icon replacement.
   Patches window.ConceitoIndicaDesignSystem_1bb735.AnimIcon so every
   AnimIcon call in the app gets a thin-stroke Lucide icon instead.
   Must load AFTER _ds_bundle.js but BEFORE handover-views/app. */
(function () {

  /* DS AnimIcon name → Lucide icon name */
  var ICON_MAP = {
    orcamentos:  "clipboard-list",
    entregas:    "package",
    estoque:     "layers",
    margem:      "list-checks",
    historico:   "history",
    recebiveis:  "shopping-bag",
    alert:       "alert-triangle",
    contas:      "credit-card",
    fat:         "trending-up",
    lucro:       "arrow-up-right",
    vendas:      "bar-chart-2",
    metas:       "target",
    relatorios:  "bar-chart-2",
    atendimento: "headphones",
    fiscal:      "file-text",
    nf:          "file-check",
    devolucao:   "rotate-ccw",
    sangria:     "minus-circle",
    suprimento:  "plus-circle",
    abertura:    "unlock",
    fechamento:  "lock",
    clientes:    "users",
    fidelidade:  "heart",
    comissao:    "percent",
    caixa:       "banknote",
    financeiro:  "landmark",
  };

  /* SF Symbol–style SVG paths (24×24 viewBox, stroke 1.6, rounded) */
  var SVG_PATHS = {
    "clipboard-list":
      "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" +
      " M8 2h8v4H8z M12 11h4 M12 16h4 M8.5 11h.01 M8.5 16h.01",
    "package":
      "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V10z" +
      " M3.27 6.96 12 12.01l8.73-5.05 M12 22.08V12",
    "layers":
      "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" +
      " m-11.5 9 8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9" +
      " m-11.5 5 8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9",
    "list-checks":
      "M3 5h2 M3 12h2 M3 19h2 M7 5h14 M7 12h14 M7 19h14",
    "history":
      "M3 3v5h5 M3.05 13A9 9 0 1 0 6 5.3L3 8",
    "shopping-bag":
      "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" +
      " M3 6h18 M16 10a4 4 0 0 1-8 0",
    "alert-triangle":
      "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" +
      " M12 9v4 M12 17h.01",
    "credit-card":
      "rect x=2 y=5 width=20 height=14 rx=2" +
      " M2 10h20",
    "trending-up":
      "M22 7 13.5 15.5 8.5 10.5 2 17 M22 7h-5 M22 7v5",
    "arrow-up-right":
      "M7 17 17 7 M7 7h10v10",
    "bar-chart-2":
      "M18 20V10 M12 20V4 M6 20v-6",
    "target":
      "circle cx=12 cy=12 r=10 circle cx=12 cy=12 r=6 circle cx=12 cy=12 r=2",
  };

  /* Build an SVG element from a path string */
  function makeSvg(name, size) {
    var raw = SVG_PATHS[name] || "";
    /* Parse mixed "path + rect + circle" shorthand */
    var inner = raw
      .replace(/rect ([^/]+)/g, function(_, attrs) { return '<rect fill="none" ' + attrs + '/>'; })
      .replace(/circle ([^/]+)/g, function(_, attrs) { return '<circle fill="none" ' + attrs + '/>'; })
      .split(" M ").filter(Boolean).map(function(p, i) {
        return '<path d="' + (i === 0 ? p : "M " + p) + '"/>';
      }).join("") + raw.replace(/rect [^/]+/g,'').replace(/circle [^/]+/g,'');

    /* Clean up: remove leftover path wrapping */
    inner = raw
      .split(/(rect [A-Za-z0-9 =".]+|circle [A-Za-z0-9 =".]+)/)
      .map(function(part) {
        if (/^rect /.test(part))   return '<rect fill="none" stroke="currentColor" ' + part.replace(/^rect /,'') + '/>';
        if (/^circle /.test(part)) return '<circle fill="none" stroke="currentColor" ' + part.replace(/^circle /,'') + '/>';
        var trimmed = part.trim();
        if (!trimmed) return '';
        return '<path d="' + trimmed + '"/>';
      }).join("");

    var svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox","0 0 24 24");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("fill","none");
    svg.setAttribute("stroke","currentColor");
    svg.setAttribute("stroke-width","1.6");
    svg.setAttribute("stroke-linecap","round");
    svg.setAttribute("stroke-linejoin","round");
    svg.innerHTML = inner;
    return svg;
  }

  /* GlassIcon — drop-in replacement for AnimIcon */
  function GlassIcon(props) {
    var name     = props.name    || "circle";
    var size     = props.size    || 20;
    var cls      = props.className || "";
    var lucide   = ICON_MAP[name] || name;

    /* Render a <span class="ci-icon lg-icon"> with a <i data-lucide> inside.
       The app already runs lucide.createIcons() on an interval, which will
       convert <i data-lucide="…"> to <svg> automatically. */
    return React.createElement("span",
      { className: "ci-icon lg-icon " + cls, "data-glass-icon": name },
      React.createElement("i", {
        "data-lucide": lucide,
        style: { width: size, height: size, display: "flex", flexShrink: 0 },
      })
    );
  }

  /* Patch the DS namespace — must run before handover-views/app destructure AnimIcon */
  var NS = window.ConceitoIndicaDesignSystem_1bb735;
  if (NS) NS.AnimIcon = GlassIcon;
  window.GlassIcon = GlassIcon;

  /* GlassIcon emits <i data-lucide="…">; lucide.createIcons() turns those into
     <svg>. The app's view icons render SVG directly, so nothing else runs
     createIcons — provide it here. Debounced MutationObserver + brief startup
     interval covers React's multi-pass renders without thrashing. */
  (function () {
    function run() { try { if (window.lucide) window.lucide.createIcons(); } catch (e) {} }
    var pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; run(); });
    }
    if (document.body) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].addedNodes && muts[i].addedNodes.length) { schedule(); return; }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
    var iv = setInterval(run, 250);
    setTimeout(function () { clearInterval(iv); }, 9000);
    run();
  })();

})();
