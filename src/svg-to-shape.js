/*
 * Convert an SVG frame into a CSS `border-shape: path("…")` value, with all
 * coordinates rescaled from the SVG viewBox into the target card box.
 *
 * Pipeline:
 *   1. Pick the first usable element (path | polygon | polyline | rect | circle | ellipse | line).
 *   2. Convert non-path elements into path data.
 *   3. Tokenize the path data into commands.
 *   4. Apply scale (cardW / vbW, cardH / vbH) and translate (-vbMinX, -vbMinY).
 *   5. Re-serialize.
 *
 * Caveat: non-uniform scaling (sx ≠ sy) on rotated elliptical arcs is not
 * mathematically representable as a single arc — radii are scaled, but rotated
 * arcs may distort. Axis-aligned arcs (the common case for card frames) are exact.
 */

const NUM_RE = /-?\d*\.?\d+(?:[eE][+-]?\d+)?/g;
const TOKEN_RE = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:[eE][+-]?\d+)?)/g;

function parsePath(d) {
  const cmds = [];
  let cur = null;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(d))) {
    if (m[1]) {
      if (cur) cmds.push(cur);
      cur = { cmd: m[1], args: [] };
    } else if (cur) {
      cur.args.push(parseFloat(m[2]));
    }
  }
  if (cur) cmds.push(cur);
  return cmds;
}

// Scale one command. `tx`/`ty` apply only to absolute (uppercase) commands.
function scaleCmd({ cmd, args }, sx, sy, tx, ty) {
  const out = args.slice();
  const abs = cmd === cmd.toUpperCase();
  const ox = abs ? tx : 0;
  const oy = abs ? ty : 0;

  switch (cmd) {
    case 'M': case 'm':
    case 'L': case 'l':
    case 'T': case 't':
      for (let i = 0; i < out.length; i += 2) {
        out[i]     = out[i]     * sx + ox;
        out[i + 1] = out[i + 1] * sy + oy;
      }
      break;
    case 'H': case 'h':
      for (let i = 0; i < out.length; i++) out[i] = out[i] * sx + ox;
      break;
    case 'V': case 'v':
      for (let i = 0; i < out.length; i++) out[i] = out[i] * sy + oy;
      break;
    case 'C': case 'c':
      for (let i = 0; i < out.length; i += 2) {
        out[i]     = out[i]     * sx + ox;
        out[i + 1] = out[i + 1] * sy + oy;
      }
      break;
    case 'S': case 's':
    case 'Q': case 'q':
      for (let i = 0; i < out.length; i += 2) {
        out[i]     = out[i]     * sx + ox;
        out[i + 1] = out[i + 1] * sy + oy;
      }
      break;
    case 'A': case 'a':
      // rx ry x-axis-rotation large-arc sweep x y
      for (let i = 0; i < out.length; i += 7) {
        out[i]     = out[i]     * sx;          // rx
        out[i + 1] = out[i + 1] * sy;          // ry
        // out[i + 2] rotation (degrees) — left as-is
        // out[i + 3] large-arc flag
        // out[i + 4] sweep flag
        out[i + 5] = out[i + 5] * sx + ox;     // x
        out[i + 6] = out[i + 6] * sy + oy;     // y
      }
      break;
    case 'Z': case 'z':
      break;
  }
  return { cmd, args: out };
}

function fmt(n) {
  // strip trailing zeros, cap precision
  return (+n.toFixed(4)).toString();
}

function serializePath(cmds) {
  return cmds
    .map(({ cmd, args }) => (args.length ? cmd + args.map(fmt).join(' ') : cmd))
    .join(' ');
}

// --- shape → path conversions ---

const num = (el, name, dflt = 0) => {
  const v = el.getAttribute(name);
  return v == null ? dflt : parseFloat(v);
};

function rectToPath(el) {
  const x = num(el, 'x'), y = num(el, 'y');
  const w = num(el, 'width'), h = num(el, 'height');
  let rx = num(el, 'rx', NaN), ry = num(el, 'ry', NaN);
  if (isNaN(rx) && isNaN(ry)) rx = ry = 0;
  else if (isNaN(rx)) rx = ry;
  else if (isNaN(ry)) ry = rx;
  rx = Math.min(rx, w / 2);
  ry = Math.min(ry, h / 2);
  if (!rx && !ry) {
    return `M${x} ${y}h${w}v${h}h${-w}z`;
  }
  return (
    `M${x + rx} ${y}` +
    `h${w - 2 * rx}` +
    `a${rx} ${ry} 0 0 1 ${rx} ${ry}` +
    `v${h - 2 * ry}` +
    `a${rx} ${ry} 0 0 1 ${-rx} ${ry}` +
    `h${-(w - 2 * rx)}` +
    `a${rx} ${ry} 0 0 1 ${-rx} ${-ry}` +
    `v${-(h - 2 * ry)}` +
    `a${rx} ${ry} 0 0 1 ${rx} ${-ry}z`
  );
}

function circleToPath(el) {
  const cx = num(el, 'cx'), cy = num(el, 'cy'), r = num(el, 'r');
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
}

function ellipseToPath(el) {
  const cx = num(el, 'cx'), cy = num(el, 'cy');
  const rx = num(el, 'rx'), ry = num(el, 'ry');
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
}

function pointsToPath(el, close) {
  const pts = (el.getAttribute('points') || '').match(NUM_RE) || [];
  if (pts.length < 4) return '';
  let d = `M${pts[0]} ${pts[1]}`;
  for (let i = 2; i < pts.length; i += 2) d += `L${pts[i]} ${pts[i + 1]}`;
  return close ? d + 'z' : d;
}

function lineToPath(el) {
  return `M${num(el, 'x1')} ${num(el, 'y1')}L${num(el, 'x2')} ${num(el, 'y2')}`;
}

function extractPathData(svg) {
  const order = ['path', 'polygon', 'polyline', 'rect', 'circle', 'ellipse', 'line'];
  for (const tag of order) {
    const el = svg.querySelector(tag);
    if (!el) continue;
    switch (tag) {
      case 'path':     return el.getAttribute('d') || '';
      case 'polygon':  return pointsToPath(el, true);
      case 'polyline': return pointsToPath(el, false);
      case 'rect':     return rectToPath(el);
      case 'circle':   return circleToPath(el);
      case 'ellipse':  return ellipseToPath(el);
      case 'line':     return lineToPath(el);
    }
  }
  return '';
}

function readViewBox(svg) {
  const vb = svg.getAttribute('viewBox');
  if (vb) {
    const [x, y, w, h] = vb.trim().split(/[\s,]+/).map(parseFloat);
    return { x, y, w, h };
  }
  const w = parseFloat(svg.getAttribute('width'))  || 0;
  const h = parseFloat(svg.getAttribute('height')) || 0;
  return { x: 0, y: 0, w, h };
}

/*
 * Sample the actual SVG path and return its points in traversal order.
 * Used to build polygon exclusions for shape-outside (which doesn't
 * accept path() — that's CSS Shapes 2, still draft).
 */
function samplePathPoints(d, samples = 4000) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden');
  const pathEl = document.createElementNS(ns, 'path');
  pathEl.setAttribute('d', d);
  svg.appendChild(pathEl);
  document.body.appendChild(svg);

  const total = pathEl.getTotalLength();
  const out = new Array(samples + 1);
  for (let i = 0; i <= samples; i++) {
    const p = pathEl.getPointAtLength((total * i) / samples);
    out[i] = { x: p.x, y: p.y };
  }
  svg.remove();
  return out;
}

// Pull out the longest run of consecutive samples that satisfy `pred`.
// Wraps around start↔end so a run that straddles the path's seam joins up.
function longestRun(points, pred) {
  const n = points.length;
  const flags = points.map(pred);
  // If everything matches, return all.
  if (flags.every(Boolean)) return points.slice();
  // Find every run; track the longest, allowing wraparound.
  const runs = [];
  let i = 0;
  while (i < n) {
    if (!flags[i]) { i++; continue; }
    const start = i;
    while (i < n && flags[i]) i++;
    runs.push({ start, end: i - 1 });
  }
  if (runs.length === 0) return [];
  // Wraparound merge: if first sample and last sample both match, glue runs.
  if (flags[0] && flags[n - 1] && runs.length > 1) {
    const head = runs.shift();
    const tail = runs.pop();
    runs.push({ start: tail.start, end: head.end + n });
  }
  let best = runs[0];
  for (const r of runs) if ((r.end - r.start) > (best.end - best.start)) best = r;
  const result = [];
  for (let k = best.start; k <= best.end; k++) result.push(points[k % n]);
  return result;
}

function ensureTopToBottom(seg) {
  if (seg.length > 1 && seg[0].y > seg[seg.length - 1].y) seg.reverse();
}

/*
 * Build two half-width exclusion polygons. Each polygon's coordinates are
 * in its pseudo's local space (0…cardW/2). Direct path traversal — the
 * contour points come straight from the SVG path samples, so the polygon
 * edge matches the path point-for-point (no binning artifacts).
 *
 * LEFT  pseudo: extracts the longest run of samples with x ≤ halfW,
 *               orients it top-to-bottom, then closes with bridges through
 *               (halfW, 0), (halfW, cardH), (0, cardH), (0, 0).
 * RIGHT pseudo: same with x > halfW, oriented bottom-to-top (so the
 *               polygon traces clockwise once x is shifted by -halfW).
 */
function buildExclusionPolygons(d, cardW, cardH, padding = 0) {
  const halfW = cardW / 2;
  const pad = Math.max(0, padding);
  const points = samplePathPoints(d);

  const leftRun  = longestRun(points, p => p.x <= halfW);
  const rightRun = longestRun(points, p => p.x >  halfW);

  ensureTopToBottom(leftRun);
  ensureTopToBottom(rightRun);

  const clampX = (x, max) => Math.max(0, Math.min(max, x));
  const clampY = y => Math.max(0, Math.min(cardH, y));
  const fmtPt = (x, y) => `${fmt(x)}px ${fmt(y)}px`;

  // The card-outline path is already rescaled + translated by `pad` in
  // svgToBorderShape, so the contour points are themselves inset on every
  // side. The polygon just traces them as-is and adds full-width top /
  // bottom strips to exclude the empty rows above and below the contour.

  // ─────────── LEFT polygon ───────────
  const leftPts = [];
  if (pad > 0) {
    leftPts.push(`0 0`, `${fmt(halfW)}px 0`, `${fmt(halfW)}px ${fmt(pad)}px`);
  } else {
    leftPts.push(`0 0`);
  }
  if (leftRun.length) {
    const first = leftRun[0];
    const last  = leftRun[leftRun.length - 1];
    const yTop  = pad > 0 ? pad        : 0;
    const yBot  = pad > 0 ? cardH - pad : cardH;
    leftPts.push(fmtPt(clampX(first.x, halfW), yTop));
    for (const p of leftRun) {
      leftPts.push(fmtPt(clampX(p.x, halfW), clampY(p.y)));
    }
    leftPts.push(fmtPt(clampX(last.x, halfW), yBot));
  } else if (pad === 0) {
    leftPts.push(`${fmt(halfW)}px 0`, `${fmt(halfW)}px ${fmt(cardH)}px`);
  }
  if (pad > 0) {
    leftPts.push(`${fmt(halfW)}px ${fmt(cardH - pad)}px`, `${fmt(halfW)}px ${fmt(cardH)}px`);
  }
  leftPts.push(`0 ${fmt(cardH)}px`);

  // ─────────── RIGHT polygon ───────────
  const rxLocal = x => clampX(x - halfW, halfW);
  const rightPts = [`${fmt(halfW)}px 0`, `${fmt(halfW)}px ${fmt(cardH)}px`];
  if (pad > 0) {
    rightPts.push(`0 ${fmt(cardH)}px`, `0 ${fmt(cardH - pad)}px`);
  }
  if (rightRun.length) {
    const top    = rightRun[0];
    const bottom = rightRun[rightRun.length - 1];
    const yTop   = pad > 0 ? pad        : 0;
    const yBot   = pad > 0 ? cardH - pad : cardH;
    rightPts.push(fmtPt(rxLocal(bottom.x), yBot));
    for (let i = rightRun.length - 1; i >= 0; i--) {
      const p = rightRun[i];
      rightPts.push(fmtPt(rxLocal(p.x), clampY(p.y)));
    }
    rightPts.push(fmtPt(rxLocal(top.x), yTop));
  } else if (pad === 0) {
    rightPts.push(`${fmt(halfW)}px ${fmt(cardH)}px`);
  }
  if (pad > 0) {
    rightPts.push(`0 ${fmt(pad)}px`, `0 0`);
  }

  return {
    shapeLeft:  `polygon(${leftPts.join(', ')})`,
    shapeRight: `polygon(${rightPts.join(', ')})`,
    leftPoints:  leftRun.map(p => [clampX(p.x, halfW), clampY(p.y)]),
    rightPoints: rightRun.map(p => [clampX(p.x, cardW), clampY(p.y)]),
  };
}

/**
 * Convert an SVG document string into:
 *   - `value`      → the `border-shape` / `clip-path` value (`path("…")`)
 *   - `shapeLeft`  → `shape-outside` value for a left-floated pseudo
 *   - `shapeRight` → `shape-outside` value for a right-floated pseudo
 *
 * The two shape-outside values are evenodd combinations of the pseudo's
 * half-rectangle and the card outline. The half-rect fills the pseudo's
 * box; the outline punches out the card interior; what's left (the card's
 * exterior on that half) becomes the float exclusion. Text wraps around
 * the exclusion = into the card interior.
 *
 * For the right pseudo, the card outline is translated by -cardW/2 so its
 * coordinates land inside the pseudo's own (0,0)–(cardW/2, cardH) box.
 */
export function svgToBorderShape(svgText, cardW, cardH, padding = 0) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const err = doc.querySelector('parsererror');
  if (err) throw new Error('Invalid SVG');
  const svg = doc.querySelector('svg');
  if (!svg) throw new Error('No <svg> root');

  const vb = readViewBox(svg);
  if (!vb.w || !vb.h) throw new Error('SVG viewBox or width/height required');

  const d = extractPathData(svg);
  if (!d) throw new Error('No drawable element found');

  // FULL-SIZE path — drives `border-shape`. Always covers the entire card,
  // independent of padding, so the visual outline never shrinks.
  const sxFull = cardW / vb.w;
  const syFull = cardH / vb.h;
  const txFull = -vb.x * sxFull;
  const tyFull = -vb.y * syFull;
  const cmds   = parsePath(d);
  const dOut   = serializePath(cmds.map(c => scaleCmd(c, sxFull, syFull, txFull, tyFull)));

  // INSET path — drives only the shape-outside polygons. Scaled into the
  // (cardW − 2·pad, cardH − 2·pad) box and translated by pad, so the
  // contour itself is uniformly inset. The polygons trace this smaller
  // path; the border outline stays at full size.
  const pad    = Math.max(0, padding);
  const innerW = Math.max(1, cardW - 2 * pad);
  const innerH = Math.max(1, cardH - 2 * pad);
  const sxIn   = innerW / vb.w;
  const syIn   = innerH / vb.h;
  const txIn   = -vb.x * sxIn + pad;
  const tyIn   = -vb.y * syIn + pad;
  const dInset = serializePath(cmds.map(c => scaleCmd(c, sxIn, syIn, txIn, tyIn)));

  const { shapeLeft, shapeRight, leftPoints, rightPoints } =
    buildExclusionPolygons(dInset, cardW, cardH, pad);

  return {
    value: `path("${dOut}")`,
    d: dOut,
    viewBox: vb,
    shapeLeft,
    shapeRight,
    leftPoints,
    rightPoints,
  };
}
