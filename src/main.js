import { svgToBorderShape } from './svg-to-shape.js';

// Preloaded sample frame — a shield outline. Lets the page render
// something useful before the user uploads their own SVG.
const SAMPLE_SVG = `<svg fill="#000000" width="800px" height="800px" viewBox="0 0 50 50" version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" overflow="inherit"><path d="M42.56 17.108c.278-3.306 1.275-6.341 3.03-9.124l-6.734-6.484c-2.127 1.763-4.551 2.74-7.295 2.912-2.516.219-4.9-.241-7.144-1.383-2.306 1.104-4.681 1.567-7.156 1.383-2.562-.22-4.873-1.095-6.943-2.644l-6.751 6.482c1.661 2.822 2.586 5.775 2.767 8.858.086 1.419-.334 3.375-1.279 5.9-.494 1.4-.867 2.615-1.123 3.63-.236 1.009-.383 1.827-.433 2.442-.034 2.691.75 5.121 2.358 7.282 1.257 1.577 3.33 3.319 6.208 5.224 3.148 1.543 5.585 2.544 7.292 2.971l1.416.635c.445.204.922.405 1.419.623 1.075.62 1.828 1.291 2.225 1.984.488-.751 1.259-1.404 2.283-1.984.722-.304 1.335-.565 1.826-.797l1.069-.46c.365-.173.842-.373 1.422-.594.582-.221 1.305-.491 2.164-.791 1.663-.566 2.874-1.103 3.643-1.587 2.792-1.904 4.833-3.619 6.132-5.15 1.665-2.168 2.475-4.61 2.438-7.354-.099-1.23-.64-3.196-1.622-5.875-.934-2.611-1.347-4.637-1.212-6.099z"/></svg>`;

const PRESETS = [
  {
    name: 'Shield',
    svg: SAMPLE_SVG,
  },
  {
    name: 'Folder',
    svg: `<svg fill="#000000" width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="icon line-color"><path d="M21,8V19a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V5A1,1,0,0,1,4,4H9.59a1,1,0,0,1,.7.29l2.42,2.42a1,1,0,0,0,.7.29H20A1,1,0,0,1,21,8Z" style="fill: none; stroke: rgb(0, 0, 0); stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path></svg>`,
  },
  {
    name: 'Octagon',
    svg: `<svg width="800px" height="800px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><polygon points="5.25 1.75,10.75 1.75,14.25 5.25,14.25 10.75,10.75 14.25,5.25 14.25,1.75 10.75,1.75 5.25"/></svg>`,
  },
  {
    name: 'Bookmark',
    svg: `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 458.001 458.001" xml:space="preserve"><g><g><path d="M308.497,0H149.504c-8.284,0-15,6.716-15,15v428.001c0,5.601,3.12,10.735,8.092,13.314c4.971,2.579,10.966,2.175,15.545-1.051l70.859-49.9l70.859,49.9c4.584,3.228,10.577,3.628,15.545,1.051c4.972-2.579,8.092-7.714,8.092-13.314V15C323.497,6.716,316.781,0,308.497,0z"/></g></g></svg>`,
  },
  {
    name: 'Heart',
    svg: `<svg width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path style="fill:none;stroke:#020202;stroke-miterlimit:10;stroke-width:1.91px;" d="M16.77,3.41A5.73,5.73,0,0,0,12,6,5.73,5.73,0,0,0,1.5,9.14C1.5,17.73,12,20.59,12,20.59S22.5,17.73,22.5,9.14A5.72,5.72,0,0,0,16.77,3.41Z"/></svg>`,
  },
  {
    name: 'Cog',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48"><path fill="currentColor" d="M26.86 2.507c-1.693-1.397-4.027-1.396-5.72 0c-1.013.835-2.449 2.084-4.416 3.925c-2.692.089-4.591.221-5.898.347c-2.186.21-3.836 1.86-4.046 4.046c-.125 1.306-.257 3.205-.347 5.898c-1.84 1.967-3.09 3.404-3.925 4.416c-1.397 1.694-1.397 4.028 0 5.722c.835 1.012 2.085 2.449 3.926 4.416c.089 2.691.221 4.59.346 5.896c.21 2.186 1.86 3.836 4.046 4.046c1.306.125 3.205.258 5.896.347c1.968 1.841 3.404 3.09 4.417 3.926c1.694 1.397 4.028 1.397 5.722 0c1.013-.835 2.45-2.085 4.417-3.926c2.692-.09 4.591-.222 5.897-.347c2.186-.21 3.836-1.86 4.046-4.045c.125-1.306.258-3.206.347-5.898c1.84-1.967 3.09-3.403 3.924-4.415c1.397-1.694 1.397-4.028 0-5.721c-.834-1.013-2.083-2.45-3.924-4.416c-.09-2.694-.222-4.593-.347-5.9c-.21-2.185-1.86-3.835-4.046-4.045c-1.306-.126-3.206-.258-5.9-.347c-1.966-1.84-3.402-3.09-4.415-3.925"/></svg>`,
  },
  {
    name: 'Badge',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 141.7 48.2"><path d="m137.8 8.6c-0.7 0-1.3-0.4-1.3-1.2 0-2.7-1.8-5-4.5-5h-70.8v0.7c0 0.3-0.2 0.7-0.6 0.7-0.3 0-0.6-0.3-0.6-0.6v-0.8h-39.7c-1.1 0.1-2.1 0.6-2.7 1.3l-1.6 1.7c-0.8 0.9-2 1.5-3.2 1.6h-6.7c-2.3 0.1-3.8 2-3.8 4.3v29.4c0 2.3 1.4 4.3 3.9 4.4h23.5c1.3 0 2.5-0.6 3.5-1.5l0.6-0.6c0.7-0.7 1.8-1.1 2.9-1.1h23.2v-0.9c0-0.3 0.3-0.7 0.6-0.7 0.4 0 0.7 0.3 0.7 0.7v0.9h14.2c1.5 0 2.9-0.7 3.6-2l8-13.5c0.8-1.4 2.1-2.3 3.9-2.3h41.4c2.5 0 4-2.2 4-4.5v-3.8c0-0.8 0.6-1.5 1.4-1.5h0.1c0.8 0 1.4-0.6 1.4-1.4v-2.8c0-0.9-0.6-1.5-1.4-1.5z"/></svg>`,
  },
];

const fileInput = document.getElementById('svg-file');
const wInput = document.getElementById('card-w');
const hInput = document.getElementById('card-h');
const lockInput = document.getElementById('lock-ratio');
const card = document.getElementById('card');
const out = document.getElementById('out');
const vizStage = document.getElementById('viz-stage');

let lastSvgText = null;
let aspect = null;        // viewBox width / height of the loaded SVG
let syncing = false;      // guard against feedback loops when programmatically setting inputs

function setMessage(msg) {
  out.replaceChildren();
  const note = document.createElement('p');
  note.className = 'snippets-note';
  note.textContent = msg;
  out.appendChild(note);
  vizStage.replaceChildren();
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/*
 * Render a DevTools-style overlay: card outline (white stroke) + the two
 * exclusion polygons tinted with the same accents used by the snippet
 * cards. Polygon coordinates are emitted in card-space, so the right
 * polygon's local x is offset back by +halfW.
 */
function renderViz({ d, w, h, leftPoints, rightPoints, pad = 0 }) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('class', 'viz-svg');

  // Card outline — drawn first so the polygons paint on top.
  const outline = document.createElementNS(SVG_NS, 'path');
  outline.setAttribute('d', d);
  outline.setAttribute('class', 'viz-outline');
  svg.appendChild(outline);

  // Build a closed polygon ring for each side, in card coords. With pad>0
  // the polygon also picks up full-width top/bottom strips that mirror
  // what the actual shape-outside polygon does — text gets pushed away
  // from the top and bottom edges by `pad`, not just left/right.
  const halfW = w / 2;

  const leftFirst = leftPoints[0]                       || [0, pad];
  const leftLast  = leftPoints[leftPoints.length - 1]   || [0, h - pad];
  const leftPolyPts = pad > 0
    ? [
        [0, 0],
        [halfW, 0],
        [halfW, pad],
        [leftFirst[0], pad],
        ...leftPoints,
        [leftLast[0], h - pad],
        [halfW, h - pad],
        [halfW, h],
        [0, h],
      ]
    : [
        [0, 0],
        [leftFirst[0], 0],
        ...leftPoints,
        [leftLast[0], h],
        [0, h],
      ];
  const leftPoly = document.createElementNS(SVG_NS, 'polygon');
  leftPoly.setAttribute('points', leftPolyPts.map(([x, y]) => `${x},${y}`).join(' '));
  leftPoly.setAttribute('class', 'viz-poly viz-poly--left');
  svg.appendChild(leftPoly);

  // rightPoints are already in card-space (per svg-to-shape.js).
  const rightFirst = rightPoints[0]                      || [w, pad];
  const rightLast  = rightPoints[rightPoints.length - 1] || [w, h - pad];
  const rightPolyPts = pad > 0
    ? [
        [w, 0],
        [halfW, 0],
        [halfW, pad],
        [rightFirst[0], pad],
        ...rightPoints,
        [rightLast[0], h - pad],
        [halfW, h - pad],
        [halfW, h],
        [w, h],
      ]
    : [
        [w, 0],
        [rightFirst[0], 0],
        ...rightPoints,
        [rightLast[0], h],
        [w, h],
      ];
  const rightPoly = document.createElementNS(SVG_NS, 'polygon');
  rightPoly.setAttribute('points', rightPolyPts.map(([x, y]) => `${x},${y}`).join(' '));
  rightPoly.setAttribute('class', 'viz-poly viz-poly--right');
  svg.appendChild(rightPoly);

  // Midline guide so the user can see where halfW falls.
  const mid = document.createElementNS(SVG_NS, 'line');
  mid.setAttribute('x1', halfW);
  mid.setAttribute('x2', halfW);
  mid.setAttribute('y1', 0);
  mid.setAttribute('y2', h);
  mid.setAttribute('class', 'viz-mid');
  svg.appendChild(mid);

  vizStage.replaceChildren(svg);
}

/*
 * Build one snippet card. The whole card is clickable — clicking copies the
 * raw declaration to the clipboard and flashes a "copied" state.
 */
function makeSnippet({ tag, selector, prop, value }) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = `snippet snippet--${tag}`;
  card.dataset.copy = `${prop}: ${value};`;

  const head = document.createElement('header');
  const sel = document.createElement('span');
  sel.className = 'snippet__sel';
  sel.textContent = selector;
  const status = document.createElement('span');
  status.className = 'snippet__status';
  status.textContent = 'click to copy';
  head.append(sel, status);

  const body = document.createElement('pre');
  body.className = 'snippet__code';
  body.innerHTML =
    `<span class="tok-prop">${prop}</span>: ` +
    `<span class="tok-val">${escapeHtml(value)}</span>;`;

  card.append(head, body);

  card.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(card.dataset.copy);
      card.classList.add('is-copied');
      status.textContent = 'copied ✓';
      setTimeout(() => {
        card.classList.remove('is-copied');
        status.textContent = 'click to copy';
      }, 1200);
    } catch {
      status.textContent = 'copy failed';
    }
  });

  return card;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function render() {
  const w = parseFloat(wInput.value) || 0;
  const h = parseFloat(hInput.value) || 0;
  card.style.width = `${w}px`;
  card.style.height = `${h}px`;

  if (!lastSvgText) {
    card.style.borderShape = '';
    card.dataset.empty = 'true';
    vizStage.replaceChildren();
    setMessage('Upload an SVG to generate a border-shape.');
    return;
  }

  try {
    const result = svgToBorderShape(lastSvgText, w, h, params.textPadding);
    const { value, d, viewBox, shapeLeft, shapeRight, leftPoints, rightPoints } = result;
    aspect = viewBox.w / viewBox.h;
    // border-shape redefines the box geometry; shape-outside on the two
    // pseudos makes the text flow along the inner contour.
    card.style.borderShape = `${value} border-box`;
    card.style.setProperty('--shape-left', shapeLeft);
    card.style.setProperty('--shape-right', shapeRight);
    delete card.dataset.empty;

    out.replaceChildren(
      makeSnippet({
        tag: 'border',
        selector: '.card',
        prop: 'border-shape',
        value: `path("${d}") border-box`,
      }),
      makeSnippet({
        tag: 'left',
        selector: '.shape--l',
        prop: 'shape-outside',
        value: shapeLeft,
      }),
      makeSnippet({
        tag: 'right',
        selector: '.shape--r',
        prop: 'shape-outside',
        value: shapeRight,
      }),
    );

    renderViz({ d, w, h, leftPoints, rightPoints, pad: params.textPadding });
  } catch (err) {
    card.style.borderShape = '';
    card.style.removeProperty('--shape-left');
    card.style.removeProperty('--shape-right');
    setMessage(err.message);
  }
}

function setValue(input, value) {
  syncing = true;
  input.value = Math.round(value);
  syncing = false;
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  lastSvgText = await file.text();
  render();
  if (lockInput.checked && aspect) {
    setValue(hInput, parseFloat(wInput.value) / aspect);
    render();
  }
});

wInput.addEventListener('input', () => {
  if (syncing) return;
  if (lockInput.checked && aspect) {
    setValue(hInput, parseFloat(wInput.value) / aspect);
  }
  render();
});

hInput.addEventListener('input', () => {
  if (syncing) return;
  if (lockInput.checked && aspect) {
    setValue(wInput, parseFloat(hInput.value) * aspect);
  }
  render();
});

lockInput.addEventListener('change', () => {
  if (lockInput.checked && aspect) {
    setValue(hInput, parseFloat(wInput.value) / aspect);
    render();
  }
});

// ─── dat.GUI live-tweaking panel ─────────────────────────────────────────
//
// Drives a handful of CSS variables on .card / .card-text so the user can
// poke text styling without leaving the page. Variables resolve via the
// var(--name, fallback) pattern in style.css.

const TEXT_PRESETS = {
  Lorem: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias aliquam atque delectus eius eveniet, ex exercitationem iure necessitatibus pariatur perferendis quas, soluta tempora veritatis!',
  Short: 'Text wraps along the card outline via two floated shape-outside exclusions.',
  Pangram: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
  Numbers: '0123456789 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30',
};

const params = {
  text: 'Lorem',
  fontSize: 14,
  lineHeight: 1.5,
  letterSpacing: 0,
  fontFamily: 'sans-serif',
  textAlign: 'justify',
  textColor: '#d4d4d8',
  textPadding: 0,
  cardBg: '#0a0a0a',
  borderColor: '#e4e4e7',
  borderWidth: 3,
};

const FONT_STACKS = {
  'sans-serif': 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace',
};

const cardTextEl = card.querySelector('.card-text');

function applyParams() {
  card.style.setProperty('--card-bg', params.cardBg);
  card.style.setProperty('--border-color', params.borderColor);
  card.style.setProperty('--border-width', `${params.borderWidth}px`);
  cardTextEl.style.setProperty('--text-color', params.textColor);
  cardTextEl.style.setProperty('--text-size', `${params.fontSize}px`);
  cardTextEl.style.setProperty('--text-line-height', String(params.lineHeight));
  cardTextEl.style.setProperty('--text-spacing', `${params.letterSpacing}px`);
  cardTextEl.style.setProperty('--text-family', FONT_STACKS[params.fontFamily]);
  cardTextEl.style.setProperty('--text-align', params.textAlign);

  // Text content: preserve the leading <span> shape carriers, replace the
  // trailing text node so the dat.GUI text picker drives the copy live.
  const carriers = cardTextEl.querySelectorAll('.shape');
  cardTextEl.replaceChildren(...carriers, document.createTextNode(' ' + TEXT_PRESETS[params.text]));
}

const gui = new dat.GUI({ width: 280 });

const fText = gui.addFolder('Text');
fText.add(params, 'text', Object.keys(TEXT_PRESETS)).onChange(applyParams);
fText.add(params, 'fontFamily', Object.keys(FONT_STACKS)).onChange(applyParams);
fText.add(params, 'fontSize', 10, 28, 1).onChange(applyParams);
fText.add(params, 'lineHeight', 1, 2.4, 0.05).onChange(applyParams);
fText.add(params, 'letterSpacing', -1, 4, 0.1).onChange(applyParams);
fText.add(params, 'textAlign', ['left', 'center', 'right', 'justify']).onChange(applyParams);
// padding is baked into the polygons themselves — needs a full re-render,
// not just a CSS variable swap.
fText.add(params, 'textPadding', 0, 60, 1).name('padding').onChange(render);
fText.addColor(params, 'textColor').onChange(applyParams);
fText.open();

const fCard = gui.addFolder('Card');
fCard.addColor(params, 'cardBg').name('background').onChange(applyParams);
fCard.addColor(params, 'borderColor').name('border').onChange(applyParams);
fCard.add(params, 'borderWidth', 0, 8, 1).name('border width').onChange(applyParams);
fCard.open();

// ─── Preset picker ───────────────────────────────────────────────────────
// One small button per preset. Click to load its SVG, just like dropping a
// file — re-renders the card and snippets, then snaps the height to the
// preset's aspect if the lock is on.
const presetsEl = document.getElementById('presets');

function applyPreset(svg, btn) {
  presetsEl.querySelectorAll('.preset').forEach(b => b.classList.remove('is-active'));
  if (btn) btn.classList.add('is-active');
  lastSvgText = svg;
  render();
  if (lockInput.checked && aspect) {
    setValue(hInput, parseFloat(wInput.value) / aspect);
    render();
  }
}

PRESETS.forEach(({ name, svg }, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'preset';
  btn.title = name;
  btn.setAttribute('aria-label', name);
  btn.innerHTML = svg;
  if (i === 0) btn.classList.add('is-active');
  btn.addEventListener('click', () => applyPreset(svg, btn));
  presetsEl.appendChild(btn);
});

// Bootstrap with the first preset so the page is alive on first paint.
lastSvgText = PRESETS[0].svg;
// Square viewBox → square card by default; aspect-lock then keeps it in sync.
wInput.value = 240;
hInput.value = 240;
render();
applyParams();
