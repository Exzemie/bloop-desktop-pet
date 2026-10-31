'use strict';
/*
 * Props (things Bloop plays with) and accessories (hats, shades, a bow) for BOTH families of looks:
 *   - "pixel" looks (cat, mono, eyes) get dot-matrix versions drawn from tiny ASCII grids
 *   - "smooth" looks get soft vector versions
 * Everything shares one coordinate system: 1 unit = 1 pixel-art cell, the pet is ~24 wide, feet at y = 21.
 *
 * Grid legend:  K ink  R accent  W white  Y yellow  B blue  O orange  G green  P pink  C light grey  . empty
 */
(function (root) {
  const COLORS = { K: 'var(--ink)', R: 'var(--red)', W: '#ffffff', Y: '#ffd23f', B: '#4aa3ff', O: '#ff9d3c', G: '#5ccf6d', P: '#ff8fb0', C: '#cfcfcf' };
  const DOT = 0.45;
  let SHAPE = 'dots'; // 'dots' = round dot-matrix, 'pixel' = square pixels
  const setShape = (s) => { SHAPE = s === 'pixel' ? 'pixel' : 'dots'; };
  const key = (c, r) => c + ',' + r;
  const dPath = (cells, d = DOT) => (SHAPE === 'pixel'
    ? cells.map(([c, r]) => { const h = d >= 0.4 ? 0.5 : d; return `M${c + 0.5 - h} ${r + 0.5 - h}h${2 * h}v${2 * h}h${-2 * h}z`; })
    : cells.map(([c, r]) => `M${c + 0.5 - d} ${r + 0.5}a${d} ${d} 0 1 0 ${2 * d} 0a${d} ${d} 0 1 0 ${-2 * d} 0z`)).join('');
  const pathEl = (cells, fill, d) => (cells.length ? `<path d="${dPath(cells, d)}" style="fill:${fill}"/>` : '');

  function ringOf(cells) {
    const set = new Set(cells.map(([c, r]) => key(c, r)));
    const ring = new Map();
    cells.forEach(([c, r]) => {
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
        if (!dc && !dr) continue;
        const a = c + dc, b = r + dr;
        if (!set.has(key(a, b))) ring.set(key(a, b), [a, b]);
      }
    });
    return [...ring.values()];
  }

  // grid + origin -> { colorChar: cells[] }
  function cellsOf(rows, ox, oy) {
    const g = {};
    rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.' && ch !== ' ') (g[ch] = g[ch] || []).push([c + ox, r + oy]); }));
    return g;
  }
  // render a coloured grid. mono = everything in the single lit colour.
  function pixelGrid(rows, ox, oy, o = {}) {
    const g = cellsOf(rows, ox, oy);
    const all = [].concat(...Object.values(g));
    const out = [];
    if (o.halo !== false) out.push(pathEl(ringOf(all), 'var(--halo)'));
    Object.keys(g).forEach((ch) => out.push(pathEl(g[ch], o.mono ? 'var(--lit)' : (COLORS[ch] || 'var(--ink)'))));
    return out.join('');
  }

  // ------------------------------------------------------------------ props
  // pixel: [rows, ox, oy]   smooth: SVG using absolute coordinates (class .pp wrapper is animated)
  const P = {
    ball: {
      px: [['.RR.', 'RWRR', 'RRRR', '.RR.'], 18, 17],
      sm: '<circle cx="20" cy="19" r="2" style="fill:var(--red);stroke:var(--edge,#222);stroke-width:.35"/><path d="M18.2 18.2q1.8 1 3.6 0" style="fill:none;stroke:#fff;stroke-width:.45;stroke-linecap:round"/><circle cx="19.4" cy="18.2" r=".45" style="fill:#fff"/>',
    },
    fish: {
      px: [['..OOO..O', 'OOOKOOOO', '..OOO..O'], 8, 17],
      sm: '<path d="M8.4 18.6c1.6-2 4.4-2 6 0c-1.6 2-4.4 2-6 0z" style="fill:#ffa24a;stroke:var(--edge,#222);stroke-width:.35"/><path d="M8.6 18.6L6.8 17.2v2.8z" style="fill:#ffa24a;stroke:var(--edge,#222);stroke-width:.35;stroke-linejoin:round"/><circle cx="13" cy="18.1" r=".4" style="fill:#222"/>',
    },
    crumbs: {
      px: [['.O..O.', '..O...', 'O...O.'], 8, 14],
      sm: '<circle cx="9" cy="16" r=".5" style="fill:#e0a060"/><circle cx="15.2" cy="15.4" r=".45" style="fill:#e0a060"/><circle cx="12" cy="14.2" r=".4" style="fill:#e0a060"/><circle cx="17" cy="17" r=".4" style="fill:#e0a060"/>',
    },
    butterfly: {
      px: [['B..B', 'BBBB', 'BKKB', 'B..B'], 10, -4],
      sm: '<path d="M12 -2.4c-1.6-2.4-4.2-2.6-4.2-.8c0 1.4 2 1.8 4.2.8z" style="fill:#8fb8ff;stroke:var(--edge,#222);stroke-width:.3"/><path d="M12 -2.4c1.6-2.4 4.2-2.6 4.2-.8c0 1.4-2 1.8-4.2.8z" style="fill:#8fb8ff;stroke:var(--edge,#222);stroke-width:.3"/><path d="M12 -2.2c-1.2 1.4-3 2-3.4 .8c-.2-.8 1.4-1.2 3.4-.8z" style="fill:#ff9fd0;stroke:var(--edge,#222);stroke-width:.3"/><path d="M12 -2.2c1.2 1.4 3 2 3.4 .8c.2-.8-1.4-1.2-3.4-.8z" style="fill:#ff9fd0;stroke:var(--edge,#222);stroke-width:.3"/><path d="M12 -3.4v2.6" style="stroke:#222;stroke-width:.5;stroke-linecap:round"/>',
    },
    book: {
      px: [['KKKKKKKKKK', 'KWWWKKWWWK', 'KCCWKKWCCK', 'KWWWKKWWWK', 'KKKKKKKKKK'], 7, 15],
      sm: '<path d="M6.4 14.8q2.6-1 5.6.4v6q-3-1.4-5.6-.4z" style="fill:#fff;stroke:var(--edge,#222);stroke-width:.4;stroke-linejoin:round"/><path d="M17.6 14.8q-2.6-1-5.6.4v6q3-1.4 5.6-.4z" style="fill:#f4f4ee;stroke:var(--edge,#222);stroke-width:.4;stroke-linejoin:round"/><path d="M7.4 16.4q1.8-.5 3.6 .1M7.4 17.9q1.8-.5 3.6 .1M13 16.5q1.8-.6 3.6-.1M13 18q1.8-.6 3.6-.1" style="fill:none;stroke:#b9b9b0;stroke-width:.3;stroke-linecap:round"/>',
    },
    cup: {
      px: [['OOOO.', 'OOOOO', 'OOOO.', '.OO..'], 17, 14],
      sm: '<path d="M17.2 14.6h3.6v2.2q0 1.6-1.8 1.6t-1.8-1.6z" style="fill:#fff;stroke:var(--edge,#222);stroke-width:.4;stroke-linejoin:round"/><path d="M20.8 15.2q1.4 0 1.2 1.1t-1.4 .9" style="fill:none;stroke:var(--edge,#222);stroke-width:.4"/><path d="M17.4 14.9h3.2" style="stroke:#8a5a35;stroke-width:.6;stroke-linecap:round"/>',
    },
    excl: {
      px: [['RR', 'RR', 'RR', 'RR', '..', 'RR'], 11, -7],
      sm: '<path d="M12 -6.2v3.2" style="fill:none;stroke:var(--red);stroke-width:1.3;stroke-linecap:round"/><circle cx="12" cy="-.9" r=".8" style="fill:var(--red)"/>',
    },
    quest: {
      px: [['.RRR.', 'RR.RR', '...RR', '..RR.', '..R..', '.....', '..R..'], 10, -8],
      sm: '<path d="M10.4 -5.6q.2-1.6 1.7-1.6t1.6 1.4q0 1-1.2 1.6q-.5 .3-.5 1" style="fill:none;stroke:var(--red);stroke-width:1.1;stroke-linecap:round"/><circle cx="12" cy="-1.5" r=".7" style="fill:var(--red)"/>',
    },
    tear: {
      px: [['B', 'B'], 7, 10],
      sm: '<path d="M7.6 11.6q-.9 1.1-.9 1.7a.9 .9 0 0 0 1.8 0q0-.6-.9-1.7z" style="fill:#8fd0ff;stroke:#4aa3ff;stroke-width:.25"/>',
    },
    spark: {
      px: [['.Y.', 'YYY', '.Y.'], -3, 3],
      sm: '<path d="M-1.8 4.4l.5 1.5l1.5 .5l-1.5 .5l-.5 1.5l-.5-1.5l-1.5-.5l1.5-.5z" style="fill:#ffd23f"/><path d="M24.6 2l.4 1.2l1.2 .4l-1.2 .4l-.4 1.2l-.4-1.2l-1.2-.4l1.2-.4z" style="fill:#ffd23f"/><path d="M22.6 12l.35 1l1 .35l-1 .35l-.35 1l-.35-1l-1-.35l1-.35z" style="fill:#fff2a8"/>',
      extra: ['.Y.', 'YYY', '.Y.'],
    },
    dizzy: {
      px: [['.Y.', 'YYY', '.Y.'], 6, -4],
      extra: [['.Y.', 'YYY', '.Y.'], 11, -6, ['.Y.', 'YYY', '.Y.'], 16, -4],
      sm: [6.5, -2.5, 12, -4.5, 17.5, -2.5].reduce((a, v, i, arr) => (i % 2 ? a : a + `<path d="M${v} ${arr[i + 1] - 1.6}l.6 1.3l1.4 .2l-1 1l.3 1.4l-1.3-.7l-1.3 .7l.3-1.4l-1-1l1.4-.2z" style="fill:#ffd23f;stroke:#d9a400;stroke-width:.25;stroke-linejoin:round"/>`), ''),
    },
  };
  // the smooth spark prop also needs pixel partners on the opposite side
  function pixelProp(name, mono) {
    const p = P[name];
    let s = pixelGrid(p.px[0], p.px[1], p.px[2], { mono });
    if (name === 'spark') s += pixelGrid(p.extra, 22, 1, { mono }) + pixelGrid(p.extra, 21, 12, { mono });
    if (name === 'dizzy') s += pixelGrid(p.extra[0], p.extra[1], p.extra[2], { mono }) + pixelGrid(p.extra[3], p.extra[4], p.extra[5], { mono });
    return s;
  }
  const PROP_NAMES = Object.keys(P);

  function propsMarkup(family, mono) {
    return PROP_NAMES.map((n) => {
      const inner = family === 'smooth' ? P[n].sm : pixelProp(n, mono);
      return `<g class="fx p-${n}" opacity="0"><g class="pp"><g class="pq">${inner}</g></g></g>`;
    }).join('');
  }

  // -------------------------------------------------------- accessories
  const ACC_NAMES = ['party', 'crown', 'wizard', 'bow', 'shades', 'halo'];
  const PIX = {
    party: { rows: ['WW', 'RR', 'RRRR', 'YYYY', 'RRRRRR', 'YYYYYY'], w: 6, base: true },
    crown: { rows: ['Y..YY..Y', 'YYYYYYYY', 'YRYYYYRY'], w: 8, base: true },
    wizard: { rows: ['....BB....', '...BBBB...', '...BBYB...', '..BBBBBB..', 'BBBBBBBBBB'], w: 10, base: true },
    halo: { rows: ['.YYYY.', 'Y....Y', '.YYYY.'], w: 6, base: true, lift: 1 },
  };
  // anchors for the pixel looks (cell coordinates)
  const PIXEL_ANCHOR = {
    cat: { top: 4, bow: [15, 3], lens: [[5, 7], [14, 7]], bridge: [10, 7, 4] },
    mono: { top: 4, bow: [15, 3], lens: [[5, 7], [14, 7]], bridge: [10, 7, 4] },
    eyes: { top: 5, bow: [1, 3], lens: null },
  };

  function pixelAcc(name, style) {
    const a = PIXEL_ANCHOR[style] || PIXEL_ANCHOR.cat;
    const mono = style === 'mono';
    if (PIX[name]) {
      const p = PIX[name];
      const x0 = Math.round(12 - p.w / 2);
      const y0 = a.top - p.rows.length - (p.lift || 0);
      return pixelGrid(p.rows, x0, y0, { mono });
    }
    if (name === 'bow') return pixelGrid(['RR.RR', 'RRYRR', 'RR.RR'], a.bow[0], a.bow[1], { mono });
    if (name === 'shades') {
      if (!a.lens) { // OLED: two dark lenses over the eyes, rimmed in the screen colour
        const lens = (x) => `<rect x="${x}" y="8.4" width="6.4" height="5.6" rx="1.7" style="fill:#000;stroke:var(--lit);stroke-width:.4"/><path d="M${x + 1} 9.6l1.8 0" style="stroke:var(--lit);stroke-width:.4;stroke-linecap:round;opacity:.8"/>`;
        return lens(4.3) + lens(13.3) + '<path d="M10.7 9.8Q12 9.1 13.3 9.8" style="fill:none;stroke:var(--lit);stroke-width:.4"/>';
      }
      const cells = [];
      a.lens.forEach(([x, y]) => { for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) cells.push([x + c, y + r]); });
      for (let c = 0; c < a.bridge[2]; c++) cells.push([a.bridge[0] + c, a.bridge[1]]);
      cells.push([3, 7], [4, 7], [19, 7], [20, 7]);
      const glint = [[a.lens[0][0], 7], [a.lens[1][0], 7]];
      return pathEl(ringOf(cells), 'var(--halo)') + pathEl(cells, mono ? 'var(--lit)' : 'var(--ink)') + pathEl(glint, mono ? '#000' : '#ffffff');
    }
    return '';
  }

  // smooth accessories use the species anchor: { cx, top, eyes:[[x,y],[x,y]], bow:[x,y] }
  function smoothAcc(name, a) {
    const cx = a.cx, t = a.top;
    const E = 'stroke:var(--edge,#222);stroke-width:.4;stroke-linejoin:round';
    switch (name) {
      case 'party':
        return `<g transform="rotate(-8 ${cx} ${t})"><path d="M${cx - 3.6} ${t + .6}L${cx} ${t - 7.4}L${cx + 3.6} ${t + .6}z" style="fill:#ff7a9c;${E}"/><path d="M${cx - 2.4} ${t - 1.4}l4.8 0M${cx - 1.3} ${t - 3.6}l2.6 0" style="stroke:#fff3a0;stroke-width:.7;stroke-linecap:round"/><circle cx="${cx}" cy="${t - 7.6}" r="1" style="fill:#fff3a0;${E}"/></g>`;
      case 'crown':
        return `<path d="M${cx - 3.8} ${t + .5}L${cx - 4.4} ${t - 3.6}L${cx - 2} ${t - 1.6}L${cx} ${t - 4.4}L${cx + 2} ${t - 1.6}L${cx + 4.4} ${t - 3.6}L${cx + 3.8} ${t + .5}z" style="fill:#ffd23f;${E}"/><circle cx="${cx}" cy="${t - 1}" r=".7" style="fill:var(--red)"/><circle cx="${cx - 2.4}" cy="${t - .2}" r=".45" style="fill:#4aa3ff"/><circle cx="${cx + 2.4}" cy="${t - .2}" r=".45" style="fill:#4aa3ff"/>`;
      case 'wizard':
        return `<path d="M${cx - 3.2} ${t + .4}Q${cx - 2} ${t - 5} ${cx + 3.6} ${t - 8.2}Q${cx + 2.6} ${t - 3.4} ${cx + 3.2} ${t + .4}z" style="fill:#5b5bd6;${E}"/><ellipse cx="${cx}" cy="${t + .5}" rx="5.6" ry="1.1" style="fill:#4646b8;${E}"/><path d="M${cx - .2} ${t - 3.4}l.4 .9l1 .1l-.8 .7l.2 1l-.8-.5l-.8 .5l.2-1l-.8-.7l1-.1z" style="fill:#ffd23f"/>`;
      case 'halo':
        return `<ellipse cx="${cx}" cy="${t - 1.8}" rx="3.6" ry="1.1" style="fill:none;stroke:#ffd23f;stroke-width:.8"/>`;
      case 'bow': {
        const [x, y] = a.bow;
        return `<path d="M${x} ${y}L${x - 3} ${y - 1.8}L${x - 3} ${y + 1.8}z" style="fill:var(--red);${E}"/><path d="M${x} ${y}L${x + 3} ${y - 1.8}L${x + 3} ${y + 1.8}z" style="fill:var(--red);${E}"/><circle cx="${x}" cy="${y}" r=".9" style="fill:#ffd23f;${E}"/>`;
      }
      case 'shades': {
        const [[x1, y1], [x2, y2]] = a.eyes;
        const w = a.lens || 2.9, h = w * .78;
        const lens = (x, y) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h * .42}" style="fill:#16161a;stroke:#000;stroke-width:.3"/><path d="M${x - w / 2 + .5} ${y - h / 2 + .6}l.9 -.0" style="stroke:#fff;stroke-width:.4;stroke-linecap:round;opacity:.7"/>`;
        return lens(x1, y1) + lens(x2, y2) + `<path d="M${x1 + w / 2} ${y1}Q12 ${y1 - .8} ${x2 - w / 2} ${y2}" style="fill:none;stroke:#16161a;stroke-width:.5"/>`;
      }
      default: return '';
    }
  }

  const api = { setShape, COLORS, PROP_NAMES, ACC_NAMES, propsMarkup, pixelAcc, smoothAcc, pixelGrid, ringOf, pathEl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FX = api;
})(typeof window !== 'undefined' ? window : globalThis);
