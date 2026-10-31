'use strict';
/*
 * Bloop the pixel cat: an original sprite drawn from small ASCII grids.
 * 1 SVG unit = 1 "pixel" of pixel art (rendered at 5 screen px each).
 * Only the LEFT half of the head/body is drawn; it is mirrored automatically.
 *   K = outline   F = fur   L = light fur (muzzle, belly)   P = inner ear
 */
(function (root) {
  const FX = root.FX || (typeof require === 'function' ? require('./fx.js') : null);
  const SMOOTH = root.SMOOTH || (typeof require === 'function' ? require('./smooth.js') : null);
  const BASE_LEFT = [
    '............', // 0
    '....KK......', // 1  ear tip
    '....KFK.....', // 2
    '...KFPFK....', // 3
    '...KFPFFKKKK', // 4  head top
    '..KFFFFFFFFF', // 5
    '.KFFFFFFFFFF', // 6
    '.KFFFFFFFFFF', // 7  eyes
    '.KFFFFFFFFFF', // 8
    '.KFFFFFFFFFF', // 9
    '.KFFFFFFFLLL', // 10 nose
    '.KFFFFFFFLLL', // 11 mouth
    '.KFFFFFFFLLL', // 12
    '..KKKKKKKKKK', // 13 chin
    '.....KFFFFFF', // 14 body
    '.....KFFFLLL', // 15
    '.....KFFFLLL', // 16
    '.....KFFFLLL', // 17
    '.....KFFFFFF', // 18
    '.....KFFFFFF', // 19
    '.....KKKKKKK', // 20
  ];
  const mirror = (s) => s + s.split('').reverse().join('');
  const BASE_ROWS = BASE_LEFT.map(mirror);
  const PAW_ROWS = ['KFFFFK', 'KFFFFK', 'KKKKKK'];

  const TAIL_A = { F: [[19, 19], [20, 19], [21, 19], [21, 18], [21, 17]], L: [[21, 16], [21, 15]] };
  const TAIL_B = { F: [[19, 19], [20, 19], [21, 19], [22, 18], [22, 17]], L: [[22, 16], [22, 15]] };

  const EYES = [[6, 7], [7, 7], [6, 8], [7, 8], [16, 7], [17, 7], [16, 8], [17, 8]];
  const LIDS = [[6, 8], [7, 8], [16, 8], [17, 8]];
  const NOSE = [[11, 10], [12, 10]];
  const SMILE = [[10, 11], [11, 12], [12, 12], [13, 11]];
  const MOUTH_OPEN = [[11, 11], [12, 11], [11, 12], [12, 12]];

  const HEART = [[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3]];
  const Z = [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]];
  const PUFF = [[1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1]];
  const NOTE = [[2, 0], [3, 0], [2, 1], [4, 1], [2, 2], [2, 3], [0, 4], [1, 4], [2, 4], [0, 5], [1, 5], [2, 5]];

  // ----------------------------------------------------------------- looks
  const FUR = {
    white:  { fur: '#f4f4f2', furL: '#ffffff', ear: '#cfcfcf', stripe: '#9a9a98' },
    black:  { fur: '#3a3a3e', furL: '#58585e', ear: '#77777d', stripe: '#1c1c1e' },
    orange: { fur: '#e8923a', furL: '#f6d3a5', ear: '#f2b3a5', stripe: '#b9651c' },
    gray:   { fur: '#9aa0a6', furL: '#d5d8db', ear: '#d9b8bf', stripe: '#6d737a' },
    cream:  { fur: '#f0dcb8', furL: '#fff4dc', ear: '#e8b9ae', stripe: '#c9a46a' },
  };

  const PATTERNS = {
    solid: { fn: () => null },
    tabby: {
      fn: (c, r, g) => {
        const m = Math.min(c, 23 - c);
        if (g === 'base') {
          if (r === 5 && [7, 9, 11].includes(m)) return 'A';
          if (r === 6 && [8, 10].includes(m)) return 'A';
          if ((r === 8 || r === 10) && m <= 3) return 'A';
          if ([15, 17, 19].includes(r) && (m === 6 || m === 7)) return 'A';
        }
        if (g === 'tail' && (r === 18 || (r === 19 && c === 20))) return 'A';
        return null;
      },
      A: (name, col) => col.stripe,
    },
    calico: {
      fn: (c, r, g) => {
        if (g === 'base') {
          if (c >= 5 && c <= 10 && r >= 5 && r <= 8) return 'A';
          if (c >= 15 && c <= 21 && r >= 3 && r <= 7) return 'B';
          if (c >= 6 && c <= 8 && r >= 14 && r <= 17) return 'A';
          if (c >= 15 && c <= 17 && r >= 16 && r <= 19) return 'B';
        }
        if (g === 'tail') return 'B';
        return null;
      },
      A: (name) => (name === 'orange' ? '#f4f4f2' : '#e8923a'),
      B: (name) => (name === 'black' ? '#e8923a' : '#3a3a3e'),
    },
    tuxedo: {
      base: { fur: '#f4f4f2', furL: '#ffffff', ear: '#cfcfcf' },
      fn: (c, r, g) => {
        const m = Math.min(c, 23 - c);
        if (g === 'base') {
          if (r <= 9) return 'A';
          if (r >= 10 && r <= 12 && m <= 6) return 'A';
          if (r >= 14 && r <= 19 && m <= 8) return 'A';
        }
        if (g === 'tail') return 'A';
        return null;
      },
      A: (name, col) => (name === 'white' ? '#3a3a3e' : col.fur),
    },
    points: {
      fn: (c, r, g) => {
        const m = Math.min(c, 23 - c);
        if (g === 'base') {
          if (r <= 4) return 'A';
          if (r === 8 && m >= 8) return 'A';
          if (r === 9 && m >= 6) return 'A';
          if (r >= 10 && r <= 12 && m === 8) return 'A';
        }
        if (g === 'paw' || g === 'tail') return 'A';
        return null;
      },
      A: () => '#5a4636',
    },
  };

  // ---- custom colours: derive a whole palette from one hex
  const HEX = /^#[0-9a-f]{6}$/i;
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mixc = (a, b, t) => { const A = rgb(a), B = rgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const derive = (h) => ({ fur: h, furL: mixc(h, '#ffffff', 0.55), ear: mixc(h, '#ff9fb0', 0.55), stripe: mixc(h, '#000000', 0.35) });

  const FUR_NAMES = Object.keys(FUR);
  const PATTERN_NAMES = Object.keys(PATTERNS);

  // --------------------------------------------------------------- helpers
  const key = (c, r) => c + ',' + r;
  const DOT = 0.45; // dot radius in "pixels": a dot-matrix cat
  let SHAPE = 'dots'; // 'dots' (round, dot-matrix) or 'pixel' (square, pixelated)
  const dPath = (cells, d = DOT) => (SHAPE === 'pixel'
    ? cells.map(([c, r]) => { const h = d >= 0.4 ? 0.5 : d; return `M${c + 0.5 - h} ${r + 0.5 - h}h${2 * h}v${2 * h}h${-2 * h}z`; })
    : cells.map(([c, r]) => `M${c + 0.5 - d} ${r + 0.5}a${d} ${d} 0 1 0 ${2 * d} 0a${d} ${d} 0 1 0 ${-2 * d} 0z`)).join('');
  const pathEl = (cells, fill, d) => (cells.length ? `<path d="${dPath(cells, d)}" style="fill:${fill}"/>` : '');

  function ringOf(cells) {
    const set = new Set(cells.map(([c, r]) => key(c, r)));
    const ring = new Map();
    cells.forEach(([c, r]) => {
      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (!dc && !dr) continue;
          const a = c + dc, b = r + dr;
          if (!set.has(key(a, b))) ring.set(key(a, b), [a, b]);
        }
      }
    });
    return [...ring.values()];
  }

  // the scroll reaction: a long strip of paper with printed dots, pulled out to the left
  function paperMarkup() {
    const cells = [];
    const printed = [];
    for (let x = -13; x <= 3; x++) {
      cells.push([x, 21], [x, 22]);
      if (x % 2 === 0 && x < 2) printed.push([x, 21]);
      if (x % 3 === 0 && x < 2) printed.push([x, 22]);
    }
    return `<g class="strip">${pathEl(ringOf(cells), 'var(--ink)')}${pathEl(cells, '#ffffff')}${pathEl(printed, '#8a8a8a', 0.3)}</g>`;
  }

  function groupFromRows(rows, ox, oy) {
    const g = { K: [], F: [], L: [], P: [] };
    rows.forEach((row, r) => [...row].forEach((ch, c) => { if (g[ch]) g[ch].push([c + ox, r + oy]); }));
    return g;
  }

  function tailGroup(t) {
    const g = { K: [], F: t.F.slice(), L: t.L.slice(), P: [] };
    g.K = ringOf(g.F.concat(g.L));
    return g;
  }

  const shift = (cells, dx, dy) => cells.map(([c, r]) => [c + dx, r + dy]);

  const PIXEL_STYLES = ['cat', 'mono', 'eyes'];
  const STYLES = PIXEL_STYLES.concat(SMOOTH.NAMES);

  function varsFor(look) {
    const lit = HEX.test(look.lit || '') ? look.lit : '#ffffff';
    if (look.style === 'mono') {
      // pure dot-matrix: lit dots are white (or your chosen colour), "off" dots are near-black
      return { ink: lit, fur: '#1c1c1c', furL: '#2e2e2e', ear: lit, pA: '#1c1c1c', pB: '#1c1c1c',
               halo: '#000000', screen: '#050505', lit };
    }
    const furName = FUR[look.fur] ? look.fur : 'white';
    const custom = HEX.test(look.furColor || '');
    const col = custom ? derive(look.furColor) : FUR[furName];
    const key = custom ? 'custom' : furName;
    const pat = PATTERNS[look.pattern] || PATTERNS.solid;
    const f = Object.assign({}, col, pat.base || {});
    return {
      ink: '#111111', fur: f.fur, furL: f.furL, ear: f.ear,
      pA: pat.A ? pat.A(key, col) : f.stripe, pB: pat.B ? pat.B(key, col) : f.stripe,
      halo: '#ffffff', screen: '#050505', lit,
    };
  }

  function cssVars(look) {
    let v;
    if (SMOOTH.isSmooth(look.style)) {
      const px = varsFor({ style: 'cat', fur: look.fur, pattern: look.pattern, furColor: look.furColor });
      v = Object.assign(SMOOTH.paletteFor(look.style, look, px), { lit: '#ffffff' });
    } else v = varsFor(look);
    return '#pet{' + Object.keys(v).map((k) => `--${k}:${v[k]}`).join(';') + '}';
  }

  function markupCat(look) {
    const pat = look.style === 'mono' ? PATTERNS.solid : (PATTERNS[look.pattern] || PATTERNS.solid);
    const base = groupFromRows(BASE_ROWS, 0, 0);
    const pawL = groupFromRows(PAW_ROWS, 5, 20);
    const pawR = groupFromRows(PAW_ROWS, 13, 20);
    const tailA = tailGroup(TAIL_A);
    const tailB = tailGroup(TAIL_B);

    const union = [];
    [base, pawL, pawR, tailA, tailB].forEach((g) => ['K', 'F', 'L', 'P'].forEach((t) => union.push(...g[t])));
    const halo = ringOf(union);

    const paint = (g, name) => {
      const A = [], B = [];
      g.F.forEach(([c, r]) => {
        const v = pat.fn(c, r, name);
        if (v === 'A') A.push([c, r]); else if (v === 'B') B.push([c, r]);
      });
      return pathEl(g.K, 'var(--ink)') + pathEl(g.F, 'var(--fur)') + pathEl(g.L, 'var(--furL)') +
             pathEl(g.P, 'var(--ear)') + pathEl(A, 'var(--pA)') + pathEl(B, 'var(--pB)');
    };

    const withHalo = (cells, fill) => pathEl(ringOf(cells), 'var(--halo)') + pathEl(cells, fill);

    const hearts = withHalo(shift(HEART, -3, -3).concat(shift(HEART, 21, -4)), 'var(--red)');
    const zs = withHalo(shift(Z, 19, 2).concat(shift(Z, 22, -2)), 'var(--ink)');
    const puffCells = shift(PUFF, 4, -3).concat(shift(PUFF, 17, -4));
    const steam = pathEl(ringOf(puffCells), 'var(--ink)') + pathEl(puffCells, '#ffffff');
    const dot = (x) => withHalo([[x, -3]], 'var(--ink)');
    const dots = `<g class="d1">${dot(9)}</g><g class="d2">${dot(11)}</g><g class="d3">${dot(13)}</g>`;

    const paper = paperMarkup();
    const notes = withHalo(shift(NOTE, -3, -3).concat(shift(NOTE, 22, -5)), 'var(--ink)');

    const shadowCells = [];
    for (let x = 5; x <= 18; x++) shadowCells.push([x, 23]);

    return [
      '<g class="shadow" style="opacity:.22">', pathEl(shadowCells, '#000'), '</g>',
      '<g class="body-g">',
        '<g class="halo">', pathEl(halo, 'var(--halo)'), '</g>',
        '<g class="tail tail-a">', paint(tailA, 'tail'), '</g>',
        '<g class="tail tail-b" opacity="0">', paint(tailB, 'tail'), '</g>',
        '<g class="base">', paint(base, 'base'), '</g>',
        '<g class="paw paw-l">', paint(pawL, 'paw'), '</g>',
        '<g class="paw paw-r">', paint(pawR, 'paw'), '</g>',
        '<g class="look">',
          '<g class="eyes">', pathEl(EYES, 'var(--ink)'), '</g>',
          '<g class="lids" opacity="0">', pathEl(LIDS, 'var(--ink)'), '</g>',
        '</g>',
        '<g class="nose">', pathEl(NOSE, 'var(--nose)'), '</g>',
        '<g class="m-smile">', pathEl(SMILE, 'var(--ink)'), '</g>',
        '<g class="m-open" opacity="0">', pathEl(MOUTH_OPEN, 'var(--ink)'), '</g>',
        '<g class="acc">', look.acc ? FX.pixelAcc(look.acc, look.style === 'mono' ? 'mono' : 'cat') : '', '</g>',
      '</g>',
      '<g class="fx hearts" opacity="0">', hearts, '</g>',
      '<g class="fx steam" opacity="0">', steam, '</g>',
      '<g class="fx dots" opacity="0">', dots, '</g>',
      '<g class="fx zzz" opacity="0">', zs, '</g>',
      '<g class="fx paper" opacity="0">', paper, '</g>',
      '<g class="fx notes" opacity="0">', notes, '</g>',
      FX.propsMarkup('pixel', look.style === 'mono'),
    ].join('');
  }

  // ---------------------------------------------------------------- OLED eyes
  // A small device with a black dot-matrix screen: two eyes and a mouth.
  // Screen = a 20 x 14 grid of dots at (2, 6). Everything below is in GRID coordinates, so the layout is
  // symmetric: 3 dots of margin left and right, 2 above the eyes and 2 below the mouth.
  const GX = 2, GY = 6, GW = 20, GH = 14;
  const EW = 5, EH = 7, EY = 2;               // eye size and top row
  const EYE_X = [3, 12];                        // left edge of each eye
  function eyeCells(x0, kind, side) {
    const out = [];
    const add = (c, r) => out.push([x0 + c, EY + r]);
    if (kind === 'happy') { [[2, 2], [1, 3], [3, 3], [0, 4], [4, 4]].forEach(([c, r]) => add(c, r)); return out; }
    if (kind === 'line') { [[0, 3], [4, 3], [1, 4], [2, 4], [3, 4]].forEach(([c, r]) => add(c, r)); return out; }
    if (kind === 'heart') { ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'].forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'X') add(c, r + 1); })); return out; }
    for (let r = 0; r < EH; r++) {
      for (let c = 0; c < EW; c++) {
        if ((r === 0 || r === EH - 1) && (c === 0 || c === EW - 1)) continue; // rounded corners
        const inner = side === 'l' ? c : EW - 1 - c; // 0 = outer edge, 4 = inner edge
        if (kind === 'angry' && r < Math.round(inner * 0.75)) continue;       // brow slants down to the middle
        if (kind === 'sad' && r < Math.round((EW - 1 - inner) * 0.75)) continue; // brow slants down to the outside
        add(c, r);
      }
    }
    return out;
  }
  const MOUTH_SMILE = [[7, 10], [12, 10], [8, 11], [9, 11], [10, 11], [11, 11]];
  const MOUTH_SAD = [[8, 10], [9, 10], [10, 10], [11, 10], [7, 11], [12, 11]];
  const MOUTH_FLAT = [[8, 11], [9, 11], [10, 11], [11, 11]];
  const MOUTH_BIG = [[8, 10], [9, 10], [10, 10], [11, 10], [8, 11], [9, 11], [10, 11], [11, 11]];
  const MOUTH_O = [[9, 10], [10, 10], [9, 11], [10, 11]];
  const BLUSH = [[2, 9], [3, 9], [16, 9], [17, 9]];

  function markupEyes(look) {
    const mono = false;
    const sc = (cells) => shift(cells, GX, GY);
    const unlit = [];
    for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) unlit.push([GX + c, GY + r]);
    const lit = (cells, fill) => pathEl(sc(cells), fill || 'var(--lit)');
    const both = (kind) => eyeCells(EYE_X[0], kind, 'l').concat(eyeCells(EYE_X[1], kind, 'r'));

    const withHalo = (cells, fill) => pathEl(ringOf(cells), 'var(--halo)') + pathEl(cells, fill);
    const hearts = withHalo(shift(HEART, -3, 0).concat(shift(HEART, 21, -1)), 'var(--red)');
    const zs = withHalo(shift(Z, 20, 1).concat(shift(Z, 22, -3)), 'var(--ink)');
    const puffCells = shift(PUFF, 3, 0).concat(shift(PUFF, 18, -1));
    const steam = pathEl(ringOf(puffCells), 'var(--ink)') + pathEl(puffCells, '#ffffff');
    const dot = (x) => withHalo([[x, 1]], 'var(--ink)');
    const dots = `<g class="d1">${dot(9)}</g><g class="d2">${dot(11)}</g><g class="d3">${dot(13)}</g>`;
    const paper = paperMarkup();
    const notes = withHalo(shift(NOTE, -3, -1).concat(shift(NOTE, 22, -2)), 'var(--ink)');
    const shadowCells = [];
    for (let x = 5; x <= 18; x++) shadowCells.push([x, 23]);

    const acc = look && look.acc ? FX.pixelAcc(look.acc, 'eyes') : '';

    return [
      '<g class="shadow" style="opacity:.22">', pathEl(shadowCells, '#000'), '</g>',
      '<g class="body-g">',
        // little feet peek out from under the casing
        '<rect class="paw paw-l" x="5.2" y="20.6" width="5.2" height="3" rx="1.5" style="fill:var(--ink)"/>',
        '<rect class="paw paw-r" x="13.6" y="20.6" width="5.2" height="3" rx="1.5" style="fill:var(--ink)"/>',
        // casing: one soft outline, a lighter top edge, then the recessed screen
        '<rect x="-.35" y="3.65" width="24.7" height="18.7" rx="4.6" style="fill:none;stroke:var(--halo);stroke-width:.5;opacity:.55"/>',
        '<rect class="casing" x="0" y="4" width="24" height="18" rx="4.2" style="fill:var(--fur);stroke:var(--ink);stroke-width:.55"/>',
        '<rect x=".9" y="4.9" width="22.2" height="7" rx="3.4" style="fill:#fff;opacity:.28"/>',
        '<rect x="1.45" y="5.45" width="21.1" height="15.1" rx="2.7" style="fill:#000;opacity:.2"/>',
        '<rect class="screen" x="1.75" y="5.75" width="20.5" height="14.5" rx="2.35" style="fill:var(--screen);stroke:#000;stroke-width:.35"/>',
        SHAPE === 'pixel' ? '' : pathEl(unlit, 'var(--lit)', 0.17).replace('<path ', '<path class="grid" opacity="0.12" '),
        '<g class="glass">',
        '<g class="look">',
          '<g class="eyes">', lit(both('open')), '</g>',
          '<g class="lids" opacity="0">', lit(both('line')), '</g>',
          '<g class="e-happy">', lit(both('happy')), '</g>',
          '<g class="e-angry">', lit(both('angry')), '</g>',
          '<g class="e-sad">', lit(both('sad')), '</g>',
          '<g class="e-heart">', lit(both('heart'), 'var(--red)'), '</g>',
        '</g>',
        '<g class="blush">', lit(BLUSH, 'var(--red)'), '</g>',
        '<g class="m-smile">', lit(MOUTH_SMILE), '</g>',
        '<g class="m-flat">', lit(MOUTH_FLAT), '</g>',
        '<g class="m-sad">', lit(MOUTH_SAD), '</g>',
        '<g class="m-o">', lit(MOUTH_O), '</g>',
        '<g class="m-open" opacity="0">', lit(MOUTH_BIG), '</g>',
        '</g>',
        // a faint glass reflection and a tiny status LED on the chin
        '<path d="M3.4 6.9Q3.6 6.3 4.3 6.3H9.5L6.2 9.6H3.4z" style="fill:#fff;opacity:.07"/>',
        '<circle class="led" cx="20.3" cy="21.05" r=".42" style="fill:var(--red)"/>',
        acc ? `<g class="acc">${acc}</g>` : '<g class="acc"></g>',
      '</g>',
      '<g class="fx hearts" opacity="0">', hearts, '</g>',
      '<g class="fx steam" opacity="0">', steam, '</g>',
      '<g class="fx dots" opacity="0">', dots, '</g>',
      '<g class="fx zzz" opacity="0">', zs, '</g>',
      '<g class="fx paper" opacity="0">', paper, '</g>',
      '<g class="fx notes" opacity="0">', notes, '</g>',
      FX.propsMarkup('pixel', false),
    ].join('');
  }

  // which ways a look can be drawn: the old pets are dots or pixels; the new smooth pets can also stay smooth
  const RENDERS = ['smooth', 'pixel', 'dots'];
  function renderOf(look) {
    const sm = SMOOTH.isSmooth(look.style);
    const r = RENDERS.includes(look.render) ? look.render : '';
    if (sm) return r || 'smooth';
    return r === 'pixel' ? 'pixel' : 'dots';
  }
  const renderChoices = (style) => (SMOOTH.isSmooth(style) ? RENDERS : ['pixel', 'dots']);

  function markup(look) {
    const render = renderOf(look);
    SHAPE = render === 'pixel' ? 'pixel' : 'dots';
    FX.setShape(SHAPE);
    look = Object.assign({}, look, { render });
    if (SMOOTH.isSmooth(look.style)) return SMOOTH.markup(look);
    return look.style === 'eyes' ? markupEyes(look) : markupCat(look);
  }

  function build(svg, look) {
    const style = STYLES.includes(look.style) ? look.style : 'cat';
    svg.setAttribute('data-style', style);
    svg.setAttribute('data-fam', SMOOTH.isSmooth(style) ? 'smooth' : 'pixel');
    svg.setAttribute('data-render', renderOf(look));
    svg.setAttribute('data-rich', style === 'eyes' || SMOOTH.isSmooth(style) ? '1' : '0');
    svg.innerHTML = markup(Object.assign({}, look, { style }));
    if (HEX.test(look.lit || '') && !SMOOTH.isSmooth(look.style)) {
      svg.style.setProperty('--lit', look.lit);
      if (look.style === 'mono') { svg.style.setProperty('--ink', look.lit); svg.style.setProperty('--ear', look.lit); }
      else { svg.style.removeProperty('--ink'); svg.style.removeProperty('--ear'); }
    } else {
      ['--lit', '--ink', '--ear'].forEach((p) => svg.style.removeProperty(p));
    }
    let st = document.getElementById('cat-vars');
    if (!st) { st = document.createElement('style'); st.id = 'cat-vars'; document.head.appendChild(st); }
    st.textContent = cssVars(Object.assign({}, look, { style }));
  }

  const LOOK_LABELS = Object.assign({ cat: 'Cat', mono: 'Mono cat', eyes: 'OLED eyes' }, SMOOTH.LABELS);
  const api = {
    build, markup, varsFor, HEX, derive, cssVars, FUR, PATTERNS, FUR_NAMES, PATTERN_NAMES, STYLES, BASE_LEFT,
    renderOf, renderChoices, RENDERS,
    PIXEL_STYLES, SMOOTH_STYLES: SMOOTH.NAMES, LOOK_LABELS, isSmooth: SMOOTH.isSmooth,
    ACC_NAMES: FX.ACC_NAMES, PROP_NAMES: FX.PROP_NAMES, SPECIES: SMOOTH.SPECIES,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CAT = api;
})(typeof window !== 'undefined' ? window : globalThis);
