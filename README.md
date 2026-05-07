# SVG → border-shape

A live playground for the experimental CSS [`border-shape`](https://una.im/border-shape) property (Chrome 147+ / Canary 146+ behind the experimental web-platform features flag).

Drop in any SVG frame and the page emits:

1. A `border-shape: path("…") border-box` value that reshapes the card's box geometry — background, border, and shadow all follow the new outline.
2. Two `shape-outside: polygon(…)` values that flow text along the inner contour, wrapping around the same shape from both sides.

## Why

`border-shape` redefines the box, but doesn't reflow inner content. Combining it with two floated `shape-outside` polygons (one per half) produces a card whose border *and* text both follow the same SVG outline — without `clip-path`, masks, or hand-tuned padding.

## Features

- **SVG import** — file upload or one of the bundled presets (shield, folder, octagon, bookmark, heart, cog, badge).
- **Live geometry** — width, height, and aspect-lock controls; the polygons regenerate on every change.
- **Text padding** — slider that insets the contour without touching `border-shape`, so text gets a uniform breathing room while the visible border stays put.
- **Shape overlay panel** — DevTools-style preview of the path + both exclusion polygons, color-coded to match the snippet cards.
- **Three copy-ready snippets** — `border-shape`, `.shape--l { shape-outside }`, `.shape--r { shape-outside }`. One click copies the declaration to the clipboard.
- **dat.GUI panel** — live tweaking for text content, font size/family, line-height, letter-spacing, alignment, padding, color, card background, and border.
- **`@supports` detection** — green/red pill under the title tells visitors whether their browser will render anything.

## How it works

```
SVG d="…"   ──►  parse + scale to (cardW, cardH)        ──►  border-shape
            ──►  parse + scale to (cardW − 2·pad, …)
                 + translate by (pad, pad)
                 ──►  sample with getPointAtLength
                      ──►  longest run with x ≤ halfW    ──►  shape-outside (left)
                      ──►  longest run with x  > halfW   ──►  shape-outside (right)
```

- The **full-size path** drives `border-shape`, so the visible outline never shrinks.
- A separate **inset path** drives the polygons, so text padding shrinks only the exclusion zones.
- Each polygon is built from real path samples (no row-binning), with full-width top/bottom strips when padding is engaged so empty rows above and below the contour are excluded too.

## Tech

- **Vite** (vanilla template) — zero framework, single `src/` tree.
- **dat.GUI** — loaded via CDN.
- **CSS `@layer`** — eleven cascade layers (`tokens` → `credits`), one per page region, for fast orientation.
- **No build-time CSS tooling** — hand-written CSS, `color-mix()`, `clamp()`, `@supports`, `@property`-style behavior via direct CSS variables.

## Layout

```
.
├── index.html              # main playground
├── tab.html                # standalone folder-tab demo (animated --tab-x)
├── src/
│   ├── main.js             # GUI wiring, render loop, snippet rendering
│   ├── svg-to-shape.js     # SVG path parsing, scaling, polygon construction
│   └── style.css           # @layer-organized stylesheet
└── package.json
```

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints — the page boots with the shield preset already loaded, so you'll see a working card on the first paint.

To produce a static build:

```bash
npm run build
npm run preview
```

## Browser support

`border-shape` is shipping in Chrome 147+ and behind `chrome://flags/#enable-experimental-web-platform-features` in Canary 146+. The CSS uses `@supports (border-shape: shape(from 0 0, close))` to swap a green "supported" / red "not supported" badge under the subtitle so visitors immediately know if the demo will render.

`shape-outside` is widely supported in all modern engines — it relies on `polygon()`, not `path()` (which is part of CSS Shapes 2 and not yet shipped).

## Reference

- [Una Kravets — *Drawing CSS borders with `border-shape`*](https://una.im/border-shape)
- CSS Borders and Box Decorations Module Level 4 (Interop 2026)
- CSS Shapes Module Level 1 (`shape-outside: polygon()`)

## License

MIT — do whatever you'd like. Credit appreciated but not required.

— made by Pavel T.
