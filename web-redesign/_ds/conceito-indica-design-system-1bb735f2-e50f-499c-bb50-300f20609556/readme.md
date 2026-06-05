# Conceito Indica — Design System

A design system for **Conceito Indica**, a Brazilian SaaS platform branded the **"Motor de Venda Assistida"** (Assisted Sales Engine) for pharmacies. The product helps pharmacy attendants and cashiers triage a customer's symptom and recommend medication **kits**, then runs the whole back-office: orders, inventory, finance, fiscal/SNGPC compliance, loyalty, e-commerce/iFood, multi-store, and analytics.

This system codifies the product's **redesign** direction — a calm, dense, "Stripe / Linear-level" language — into tokens, components, and full-screen UI kits so new work ships on-brand.

> **pt-BR product.** All copy is Brazilian Portuguese. Currency is `R$` (BRL) with comma decimals (`R$ 1.723,78`).

---

## Sources

- **Codebase:** `Conceito Indica/` (mounted, read-only) — a design-exploration repo comparing the **current** product (`.atual`) against the **redesign** (`.redesign` / `.redesign.night`). Key files: `styles.css`, `atendimento.css`, `night.css`, `redesign.jsx` (Relatórios), `atendimento-redesign.jsx`, `anim-icons.jsx`, `theme-toggle.jsx`, `legenda.jsx` (the 8 redesign principles), and product screenshots under `uploads/`.
- This system is built from the **redesign** language (the intended brand direction), not the legacy `.atual` admin template.
- **Fonts:** Hanken Grotesk pulled from Google Fonts (latin subset, self-hosted in `fonts/`).

---

## The 8 redesign principles (the brand's design thesis)

From `legenda.jsx`, the decisions that define the look:
1. **Color is meaning** — no saturated icon squares; colour only marks state (green ok, amber attention, red critical).
2. **The negative grita** — bad numbers get red fill + alert icon + context ("−14× receita").
3. **Dense KPIs + trend** — half the padding, tabular numerals, sparkline + delta on every card.
4. **No redundant nav** — duplicated "access" panels become real charts.
5. **Tabs → ⌘K** — overflowing tab carousels become a command palette; scales to 25+ modules.
6. **Hierarchy by tone** — ~70% of borders removed, one radius, consistent warm grey.
7. **Buttons by risk** — neutral-dark primary, red destructive, discreet utility. Not everything green.
8. **Product polish** — skeletons, visible focus, smooth collapse, R$ aligned by tabular-nums.

---

## CONTENT FUNDAMENTALS

**Language & voice.** Brazilian Portuguese, professional but warm and plain-spoken — written for a busy balcony attendant, not an analyst. Sentences are short and action-led.

- **Casing:** Sentence case for body and buttons (*Novo relatório*, *Finalizar venda*, *Salvar orçamento*). UPPERCASE only for tiny tracked eyebrows / rail section headers (*OPERAÇÃO*, *BACKOFFICE*, *RESUMO DA VENDA*).
- **Person:** Addresses the operator directly and reassuringly — *"Você pode prosseguir com as sugestões."* The AI speaks in suggestions, never commands.
- **Numbers & money:** Always `R$` with comma decimals and thousands dots (`R$ 2.166,79`). Percentages with comma (`81,2%`, `−0,3pp`). Deltas carry a sign and often a comparison (`+12,4%`, `−14× receita`, `8 vencidas`).
- **Tone of AI:** Helpful co-pilot. Labels its output with a small **IA** tag; phrases prompts as questions (*"Quer algo só para a febre ou está com dor no corpo também?"*).
- **Domain vocabulary:** *Atendimento, Orçamento, Triagem, Kit (Essencial / Recomendado / Completo), Margem, Combo, Estoque crítico, Venda perdida, Farmacêutico RT, SNGPC, Receituário.*
- **Microcopy is concrete, never generic:** empty states tell you what to do (*"Carrinho vazio — adicione produtos ou um kit"*); safety prompts list real checks (*Verifique alergias · Doenças crônicas · Medicamentos contínuos*).
- **No emoji** in the redesign UI. Iconography carries visual warmth instead.

---

## VISUAL FOUNDATIONS

**Typeface.** A single family — **Hanken Grotesk** — a warm humanist grotesque. Headings track tight (`-0.02em`); hero numbers go heavy (800). Numbers are **always** tabular (`font-variant-numeric: tabular-nums`) so currency columns align. The `ss01` stylistic set is on.

**Colour.** Surfaces are **warm** near-white (day) / near-black (night) neutrals — never pure black, never cool/blue grey. The one saturated hue is **brand green `#0c8f5f`**. Saturated colour is reserved for *state*: green ok, amber attention (`#b7791f`), red critical (`#d33b34`), each with a soft tint. A **pink `#e7398e`** marks the operator avatar; a **teal `#1fb9b3`** accents the "active" stroke inside line icons. Avoid blue/purple gradients entirely.

**Themes.** Day (default `:root`) and **Night** (`.night` scope) — warm near-black surfaces (`#131210`/`#1c1b16`), brighter brand (`#1fae77`), with dark-green ink on brand fills. The navigation rail stays dark in *both* themes — it is the app's anchor.

**Backgrounds.** Flat warm paper. No photographic backgrounds, no full-bleed imagery, no repeating textures, no decorative gradients. The only gradients are functional: the KPI **alert** soft-red wash and the AskAI shimmer/orb.

**Shape & depth.** One radius does ~90% of the work — **12px** for cards/panels (smaller for chips 6px, inputs/rows 8px, buttons 9px). Borders are warm **hairlines** (`#ecebe7`), not black. Shadows are soft and low-spread; hierarchy comes from **tone first, elevation second**. Cards are flat at rest (`shadow-xs`) and only lift on hover.

**Layout.** A fixed dark **rail** (232px expanded / 64px collapsed) + fluid main column with a sticky translucent topbar. Dense grids (6-up KPI strips, 3-col atendimento). Content is productivity-grade — generous data, tight padding.

**Motion** (the "Jitter / Flaticon" feel). Two easings carry everything: **spring** `cubic-bezier(.34,1.56,.64,1)` for overshoot (pops, scale-ins, +button rotate) and **ease-out** `cubic-bezier(.22,1,.36,1)` for settles (fade-ups, chart draw-in). Entrances are springy fade-ups (stagger by ~50ms). Charts draw their line in; KPI values swap with a small rise. Icons play a **single-shot** micro-animation on hover (bars grow, carts roll, checks draw, clocks tick) — never infinite decorative loops on content. All motion respects `prefers-reduced-motion`.

**Interaction states.**
- *Hover:* subtle lift (`translateY(-1px)`) on buttons/cards; warm fill on rows/ghost buttons; the `+` add-button scales and rotates 90°.
- *Press:* brand button shrinks slightly (`scale(.98)`).
- *Active/selected:* brand fill (chips, categories, segmented control's raised white chip) or a quiet inset ring on rail items.
- *Focus:* visible ring (`--ring` = brand outline + soft halo).
- *Disabled:* greyed (`--line-2` fill, `--ink-3` text) — explicitly inert, e.g. *Finalizar venda* until the cart has items.

**Transparency & blur.** Used sparingly — only the topbar's translucent paper backdrop and faint white overlays on the dark rail. No heavy glassmorphism.

---

## ICONOGRAPHY

Two complementary sets:

1. **Bespoke animated line icons — the brand signature** (`AnimIcon`). Hand-built 24×24 line glyphs (2px stroke, round caps), one per product module and KPI (*atendimento, estoque, financeiro, relatorios, metas, fat, lucro, margem, alert, contas, …*). Each plays a **single-shot animation on hover** with a warm **teal** accent stroke on its "active" part. Use these for navigation, KPI labels, and report rows. Ported faithfully from the codebase's `anim-icons.jsx`. Source preserved at `_src/anim-icons.jsx`.
2. **Lucide** (CDN, `lucide@0.460.0`) for generic UI glyphs — search, plus, bell, chevrons, arrows, check, x, phone, download, shield. 1.8–2px stroke, rounded — visually consistent with the bespoke set. The category icons (flame/lung/stomach/…) in Atendimento are small custom line glyphs in the same idiom.

**No emoji. No unicode icon hacks.** (Glyph arrows `↗ ↘ →` are used only inside trend pills as compact deltas.) When you need a module/metric icon, reach for `AnimIcon`; for everything else, Lucide. The brand mark is the green rounded-square "activity / pulse" line glyph used in the rail and favicons — kept as code, not a raster asset.

---

## INDEX — what's in this system

**Entry & tokens**
- `styles.css` — the import manifest consumers link (imports only).
- `tokens/colors.css` — palette, surfaces, semantic state, day + `.night` themes.
- `tokens/typography.css` — family, scale, weights, tracking, tabular-nums.
- `tokens/spacing.css` — spacing, radius, borders, elevation, focus ring, rail widths.
- `tokens/motion.css` — easings, durations, canonical keyframes.
- `fonts/` — Hanken Grotesk `.woff2` (400–800) + `fonts.css` `@font-face`.

**Foundations (Design System tab cards)** — `guidelines/`
- Colors: brand, state, neutrals, night. Type: display, body, numerals. Spacing: radius, scale, elevation.

**Components** — `components/`
- `core/` — **Button, Badge, TrendPill, StatusDot, Chip, Avatar**
- `surfaces/` — **Card, KpiCard, SegmentedControl**
- `icons/` — **AnimIcon** (the animated brand icon set)
- `navigation/` — **NavRail** (dark module rail, expanded + collapsed)
- `brand/` — **AskAIBar** (the *Pergunte à IA* box), **ThemeToggle** (Day/Night/Auto)
- Each directory ships `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, and one `@dsCard` HTML.

**UI kits** — `ui_kits/`
- `relatorios/` — backoffice **Relatórios** dashboard (KPI strip, interactive chart, signals menu).
- `atendimento/` — operator **Atendimento** (triage → recommended kits → cart with safety checks).
- Each: `index.html` (interactive), `kit.css`, screen JSX, and a `README.md`.

**Other**
- `SKILL.md` — makes this system usable as a downloadable Agent Skill.
- `_src/` — preserved originals (`anim-icons.jsx`, `theme-toggle.jsx`) for reference.

**Namespace.** Component cards/kits read components from `window.ConceitoIndicaDesignSystem_1bb735` after loading `_ds_bundle.js` (auto-generated).
