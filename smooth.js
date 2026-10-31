'use strict';
/*
 * Smooth pets: soft vector characters, NOT dot-matrix. Same rig as the pixel looks, so every
 * behaviour in style.css animates them too:
 *   .shadow  .body-g > ( .tail .ear-l .ear-r .base .paw-l .paw-r .look(.eyes .lids .e-happy .e-angry .e-sad) face .acc )
 * Coordinates: pet is ~24 wide (x 0..24), feet at y ~ 21.5, same viewBox as the pixel looks.
 *
 * Colours are CSS variables so themes, the overheat tint and custom colours all work:
 *   --fur --furL --ear(inner ear / blush) --dark --edge --eyec --cheek --mouth --ink(fx) --pA --pB(patterns)
 */
(function (root) {
  const FX = root.FX || (typeof require === 'function' ? require('./fx.js') : null);
  const HEX = /^#[0-9a-f]{6}$/i;
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mixc = (a, b, t) => { const A = rgb(a), B = rgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };

  const mirror = (svg) => `<g transform="translate(24 0) scale(-1 1)">${svg}</g>`;
  const ST = (fill, w = 0.5, stroke = 'var(--edge)') => `fill:${fill};stroke:${stroke};stroke-width:${w};stroke-linejoin:round;stroke-linecap:round`;
  const NS = (fill) => `fill:${fill};stroke:none`;
  const LN = (c = 'var(--ink)', w = 0.5) => `fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round`;

  // ---------------------------------------------------------------- face
  // f = { eyes:[[x,y],[x,y]], rx, ry, eyec, lidc, sclera, cover, mouth:{x,y,w,h,kind}, nose, cheeks:[[x,y,rx,ry]], extra }
  function faceParts(f) {
    const [L, R] = f.eyes;
    const eyec = f.eyec || 'var(--eyec)';
    const lidc = f.lidc || 'var(--ink)';
    const each = (fn) => fn(L, 1) + fn(R, -1);
    const ball = ([x, y]) => (f.sclera
      ? `<ellipse cx="${x}" cy="${y}" rx="${f.rx}" ry="${f.ry}" style="${NS(eyec)}"/><circle cx="${x + 0.05}" cy="${y + 0.1}" r="${f.rx * 0.62}" style="${NS(f.pupil || '#2a2530')}"/><circle cx="${x - f.rx * 0.28}" cy="${y - f.ry * 0.32}" r="${f.rx * 0.28}" style="${NS('#fff')}"/>`
      : `<ellipse cx="${x}" cy="${y}" rx="${f.rx}" ry="${f.ry}" style="${NS(eyec)}"/><circle cx="${x - f.rx * 0.32}" cy="${y - f.ry * 0.36}" r="${f.rx * 0.36}" style="${NS('#fff')}"/><circle cx="${x + f.rx * 0.38}" cy="${y + f.ry * 0.42}" r="${f.rx * 0.17}" style="${NS('#fff')};opacity:.85"/>`);
    const cover = ([x, y]) => (f.cover ? `<circle cx="${x}" cy="${y}" r="${f.cover}" style="${NS('var(--fur)')}"/>` : '');
    const w = f.rx * 1.25;
    const closed = ([x, y]) => `${cover([x, y])}<path d="M${x - w} ${y} Q${x} ${y + f.ry * 0.95} ${x + w} ${y}" style="${LN(lidc, 0.55)}"/>`;
    const happy = ([x, y]) => `${cover([x, y])}<path d="M${x - w} ${y + f.ry * 0.45} Q${x} ${y - f.ry * 1.05} ${x + w} ${y + f.ry * 0.45}" style="${LN(lidc, 0.6)}"/>`;
    const angry = ([x, y], s) => `${ball([x, y])}<path d="M${x - w * 1.3 * s} ${y - f.ry * 1.55} L${x + w * 1.1 * s} ${y - f.ry * 0.75}" style="${LN('var(--ink)', 0.7)}"/>`;
    const sad = ([x, y], s) => `${ball([x, y])}<path d="M${x - w * 1.2 * s} ${y - f.ry * 0.85} L${x + w * 1.1 * s} ${y - f.ry * 1.7}" style="${LN('var(--ink)', 0.5)}"/>`;

    const m = f.mouth;
    const k = m.kind || 'w';
    const sm = k === 'u'
      ? `<path d="M${m.x - m.w} ${m.y} Q${m.x} ${m.y + m.h * 1.9} ${m.x + m.w} ${m.y}" style="${LN('var(--ink)', 0.5)}"/>`
      : `<path d="M${m.x} ${m.y} Q${m.x - m.w * 0.5} ${m.y + m.h * 1.25} ${m.x - m.w} ${m.y - m.h * 0.1} M${m.x} ${m.y} Q${m.x + m.w * 0.5} ${m.y + m.h * 1.25} ${m.x + m.w} ${m.y - m.h * 0.1}" style="${LN('var(--ink)', 0.5)}"/>`;
    const op = f.openMouth || `<ellipse cx="${m.x}" cy="${m.y + m.h * 0.9}" rx="${m.w * 0.75}" ry="${m.h * 1.35}" style="${ST('var(--mouth)', 0.4, 'var(--ink)')}"/><ellipse cx="${m.x}" cy="${m.y + m.h * 1.65}" rx="${m.w * 0.42}" ry="${m.h * 0.55}" style="${NS('#ff8fa3')}"/>`;
    const flat = `<path d="M${m.x - m.w * 0.55} ${m.y + m.h * 0.5} L${m.x + m.w * 0.55} ${m.y + m.h * 0.5}" style="${LN('var(--ink)', 0.5)}"/>`;
    const oo = `<ellipse cx="${m.x}" cy="${m.y + m.h * 0.9}" rx="${m.w * 0.36}" ry="${m.h * 0.95}" style="${ST('var(--mouth)', 0.4, 'var(--ink)')}"/>`;

    const sadM = `<path d="M${m.x - m.w * 0.8} ${m.y + m.h * 1.3} Q${m.x} ${m.y - m.h * 0.7} ${m.x + m.w * 0.8} ${m.y + m.h * 1.3}" style="${LN('var(--ink)', 0.5)}"/>`;
    const heartEye = ([x, y]) => { const s = f.rx * 0.95; return `<path d="M${x} ${y + 1.3 * s}C${x - 2.5 * s} ${y - 0.1 * s} ${x - 1.4 * s} ${y - 1.9 * s} ${x} ${y - 0.6 * s}C${x + 1.4 * s} ${y - 1.9 * s} ${x + 2.5 * s} ${y - 0.1 * s} ${x} ${y + 1.3 * s}z" style="${NS('var(--red)')}"/>`; };
    const cheeks = (f.cheeks || []).map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" style="${NS('var(--cheek)')}"/>`).join('');
    return {
      eyes: each(ball), lids: each(closed), happy: each(happy),
      angry: fx2(angry, L, R), sad: fx2(sad, L, R),
      mouthSm: f.noSmile ? '' : sm, mouthOpen: op, mouthFlat: flat, mouthO: oo, mouthSad: sadM,
      heart: (f.cover ? each((p) => cover(p) + heartEye(p)) : each(heartEye)),
      cheeks, nose: f.nose || '', extra: f.extra || '',
    };
  }
  function fx2(fn, L, R) { return fn(L, 1) + fn(R, -1); }

  // ------------------------------------------------------------ species
  // each build() returns { tail, ears:[l,r]|'', base, paws:[l,r], face, acc, clip?, patch? }
  const SPECIES = {
    blob: {
      label: 'Blob', colors: { fur: '#8fd8c0', furL: '#d6f6ea', ear: '#ff9fb7', dark: '#5db39a' }, sound: 'bloop',
      build() {
        const shape = 'M2.4 19.6C1.4 11.4 5.6 3.6 12 3.6S22.6 11.4 21.6 19.6C21.3 21.6 19 22 12 22S2.7 21.6 2.4 19.6z';
        return {
          tail: `<path d="M12 4.2Q10.6 1.4 13.2 .2" style="${LN('var(--edge)', 2.1)}"/><path d="M12 4.2Q10.6 1.4 13.2 .2" style="${LN('var(--dark)', 1.3)}"/><ellipse cx="14.2" cy="-.1" rx="2.1" ry="1.2" transform="rotate(-25 14.2 -.1)" style="${ST('#8be08f', 0.4)}"/>`,
          ears: '',
          base: `<path d="${shape}" style="${ST('var(--fur)', 0.55)}"/><ellipse cx="12" cy="19.2" rx="7.4" ry="2.5" style="${NS('var(--furL)')};opacity:.55"/><ellipse cx="7.2" cy="8.6" rx="1.7" ry="2.7" transform="rotate(32 7.2 8.6)" style="${NS('#fff')};opacity:.55"/><circle cx="9.6" cy="5.9" r=".6" style="${NS('#fff')};opacity:.6"/>`,
          paws: [`<ellipse cx="7.8" cy="21.4" rx="2.5" ry="1.25" style="${ST('var(--dark)', 0.45)}"/>`, `<ellipse cx="16.2" cy="21.4" rx="2.5" ry="1.25" style="${ST('var(--dark)', 0.45)}"/>`],
          face: { eyes: [[8.2, 12.6], [15.8, 12.6]], rx: 1.05, ry: 1.5, mouth: { x: 12, y: 15, w: 1.5, h: 0.9, kind: 'u' }, cheeks: [[5.4, 15.2, 1.5, 0.85], [18.6, 15.2, 1.5, 0.85]] },
          acc: { cx: 12, top: 4.2, eyes: [[8.2, 12.6], [15.8, 12.6]], bow: [17.2, 6.4], lens: 3.2 },
        };
      },
    },

    kitty: {
      label: 'Kitty', colors: null /* uses the fur presets */, sound: 'meow', patterns: true,
      build(o) {
        const ear = (cls) => `<path d="M3.4 9.2L3.8 2.4Q4 .9 5.3 1.7L10.8 4.8z" style="${ST(o.earFill || 'var(--fur)', 0.5)}"/><path d="M5 7.2L5.2 3.8L8.8 5.9z" style="${NS('var(--ear)')}"/>`;
        const tailD = 'M16.6 19.8C22.4 20.8 24 15.2 21.8 12.2';
        const tailC = o.tailFill || 'var(--fur)';
        return {
          tail: `<path d="${tailD}" style="${LN('var(--edge)', 3.1)}"/><path d="${tailD}" style="${LN(tailC, 2.1)}"/>${o.tailExtra ? `<path d="${tailD}" style="${LN('var(--pA)', 2.1)};stroke-dasharray:1.1 1.7"/>` : ''}`,
          ears: [ear(), mirror(ear())],
          base: `<ellipse cx="12" cy="17.4" rx="6.8" ry="5.2" style="${ST('var(--fur)', 0.5)}"/><ellipse cx="12" cy="10.3" rx="9.9" ry="7.6" style="${ST('var(--fur)', 0.5)}"/><ellipse cx="12" cy="18.7" rx="3.9" ry="3.1" style="${NS('var(--furL)')}"/>${o.overlay || ''}`,
          clip: '<ellipse cx="12" cy="17.4" rx="6.8" ry="5.2"/><ellipse cx="12" cy="10.3" rx="9.9" ry="7.6"/>',
          paws: [`<ellipse cx="8.4" cy="21" rx="2.5" ry="1.45" style="${ST(o.pawFill || 'var(--furL)', 0.45)}"/>`, `<ellipse cx="15.6" cy="21" rx="2.5" ry="1.45" style="${ST(o.pawFill || 'var(--furL)', 0.45)}"/>`],
          face: {
            eyes: [[7.9, 10.5], [16.1, 10.5]], rx: 0.95, ry: 1.3,
            mouth: { x: 12, y: 13.1, w: 1.9, h: 0.9 },
            nose: `<path d="M11.1 12.1h1.8l-.9 1z" style="${ST('var(--nose)', 0.25, 'var(--nose)')}"/>`,
            cheeks: [[5.2, 12.6, 1.5, 0.85], [18.8, 12.6, 1.5, 0.85]],
            extra: `<path d="M4.6 11.7L1.2 10.8M4.5 12.9L1 13.4" style="${LN('var(--edge)', 0.3)}"/><path d="M19.4 11.7L22.8 10.8M19.5 12.9L23 13.4" style="${LN('var(--edge)', 0.3)}"/>`,
          },
          acc: { cx: 12, top: 3.3, eyes: [[7.9, 10.5], [16.1, 10.5]], bow: [6.4, 4.6], lens: 3.3 },
        };
      },
    },

    pup: {
      label: 'Puppy', colors: { fur: '#d9a066', furL: '#f7e3c0', ear: '#ff9fb0', dark: '#8a5a35' }, sound: 'woof', patterns: true,
      build(o) {
        const ear = () => `<path d="M3.9 5.4C1.2 5.8.5 10.8 1.5 14c.4 1.3 2.2 1.5 3.2.4c1.3-1.6 1.9-5.4 1.3-8.6z" style="${ST(o.earFill || 'var(--dark)', 0.5)}"/>`;
        const tailD = 'M17.6 19.8Q21.4 19.2 21.6 15.4';
        return {
          tail: `<path d="${tailD}" style="${LN('var(--edge)', 3)}"/><path d="${tailD}" style="${LN(o.tailFill || 'var(--fur)', 2.1)}"/>`,
          ears: [ear(), mirror(ear())],
          base: `<ellipse cx="12" cy="17.6" rx="6.6" ry="5" style="${ST('var(--fur)', 0.5)}"/><ellipse cx="12" cy="10.6" rx="9.4" ry="7.3" style="${ST('var(--fur)', 0.5)}"/><ellipse cx="12" cy="18.8" rx="3.7" ry="3" style="${NS('var(--furL)')}"/><ellipse cx="12" cy="13.5" rx="4.7" ry="3.3" style="${NS('var(--furL)')}"/>${o.overlay || ''}`,
          clip: '<ellipse cx="12" cy="17.6" rx="6.6" ry="5"/><ellipse cx="12" cy="10.6" rx="9.4" ry="7.3"/>',
          paws: [`<ellipse cx="8.5" cy="21" rx="2.4" ry="1.45" style="${ST('var(--furL)', 0.45)}"/>`, `<ellipse cx="15.5" cy="21" rx="2.4" ry="1.45" style="${ST('var(--furL)', 0.45)}"/>`],
          face: {
            eyes: [[7.9, 10.2], [16.1, 10.2]], rx: 0.95, ry: 1.3,
            mouth: { x: 12, y: 13.7, w: 1.9, h: 0.9 },
            nose: `<ellipse cx="12" cy="12.3" rx="1.55" ry="1.05" style="${NS('var(--ink)')}"/><ellipse cx="11.5" cy="11.95" rx=".5" ry=".28" style="${NS('#fff')};opacity:.7"/><path d="M12 13.2v.5" style="${LN('var(--ink)', 0.4)}"/>`,
            cheeks: [[5, 12.7, 1.4, 0.85], [19, 12.7, 1.4, 0.85]],
          },
          acc: { cx: 12, top: 3.9, eyes: [[7.9, 10.2], [16.1, 10.2]], bow: [17.6, 4.8], lens: 3.3 },
        };
      },
    },

    bunny: {
      label: 'Bunny', colors: { fur: '#f4efee', furL: '#ffffff', ear: '#ffb3c1', dark: '#cfc3c3' }, sound: 'squeak',
      build() {
        const ear = () => `<ellipse cx="8.4" cy="3.6" rx="2.3" ry="5.8" transform="rotate(-8 8.4 3.6)" style="${ST('var(--fur)', 0.5)}"/><ellipse cx="8.5" cy="4.1" rx="1.05" ry="4.1" transform="rotate(-8 8.5 4.1)" style="${NS('var(--ear)')}"/>`;
        return {
          tail: `<circle cx="18.8" cy="19.8" r="2.1" style="${ST('var(--furL)', 0.5)}"/>`,
          ears: [ear(), mirror(ear())],
          base: `<ellipse cx="12" cy="18" rx="6.3" ry="4.7" style="${ST('var(--fur)', 0.5)}"/><ellipse cx="12" cy="11.5" rx="8.7" ry="6.9" style="${ST('var(--fur)', 0.5)}"/><ellipse cx="12" cy="19" rx="3.6" ry="3" style="${NS('var(--furL)')}"/>`,
          paws: [`<ellipse cx="8.6" cy="21" rx="2.3" ry="1.4" style="${ST('var(--furL)', 0.45)}"/>`, `<ellipse cx="15.4" cy="21" rx="2.3" ry="1.4" style="${ST('var(--furL)', 0.45)}"/>`],
          face: {
            eyes: [[8.2, 11.3], [15.8, 11.3]], rx: 0.92, ry: 1.25,
            mouth: { x: 12, y: 13.6, w: 1.5, h: 0.8 },
            nose: `<path d="M11.2 12.4h1.6l-.8 .95z" style="${ST('var(--nose)', 0.25, 'var(--nose)')}"/>`,
            cheeks: [[5.3, 13, 1.45, 0.85], [18.7, 13, 1.45, 0.85]],
            openMouth: `<ellipse cx="12" cy="14.4" rx="1.2" ry="1.1" style="${ST('var(--mouth)', 0.4, 'var(--ink)')}"/><rect x="11.35" y="13.35" width=".6" height="1" rx=".2" style="${NS('#fff')}"/><rect x="12.05" y="13.35" width=".6" height="1" rx=".2" style="${NS('#fff')}"/>`,
          },
          acc: { cx: 12, top: 5.2, eyes: [[8.2, 11.3], [15.8, 11.3]], bow: [16.6, 6.8], lens: 3.1 },
        };
      },
    },

    fox: {
      label: 'Fox', colors: { fur: '#f08a3c', furL: '#fff3e2', ear: '#3b2a24', dark: '#3b2a24' }, sound: 'yip',
      build() {
        const ear = () => `<path d="M3 9.4L2.4 1.2Q2.5.3 3.4.7L10.4 4.8z" style="${ST('var(--fur)', 0.5)}"/><path d="M2.4 1.2Q2.5.3 3.4.7L5.4 2L2.7 4.2z" style="${NS('var(--dark)')}"/><path d="M4.6 7.4L4.4 3.6L8.2 5.8z" style="${NS('#ffd9c0')}"/>`;
        const tailPath = 'M16.2 20.2C22.8 21.8 25.4 15.6 22.4 10.2C21.8 13.2 19.6 15.4 17 16.4z';
        return {
          tail: `<path d="${tailPath}" style="${ST('var(--fur)', 0.5)}"/><path d="M22.4 10.2C24 13 24 15.6 22.6 17.6C21 17.2 20.4 15.6 20.8 13.6C21.4 12.6 21.9 11.4 22.4 10.2z" style="${NS('var(--furL)')}"/>`,
          ears: [ear(), mirror(ear())],
          base: `<ellipse cx="12" cy="17.6" rx="6.2" ry="5" style="${ST('var(--fur)', 0.5)}"/><path d="M1.8 9.4C2.4 4.8 7 2.8 12 2.8s9.6 2 10.2 6.6c.3 2.4-2.8 6.2-10.2 7.2C4.6 15.6 1.5 11.8 1.8 9.4z" style="${ST('var(--fur)', 0.5)}"/><path d="M2.2 10.2Q6.4 9.4 12 13.6Q17.6 9.4 21.8 10.2Q20.4 15.2 12 16.1Q3.6 15.2 2.2 10.2z" style="${NS('var(--furL)')}"/><ellipse cx="12" cy="18.8" rx="3.5" ry="3.1" style="${NS('var(--furL)')}"/>`,
          paws: [`<ellipse cx="8.6" cy="21" rx="2.3" ry="1.45" style="${ST('var(--dark)', 0.45)}"/>`, `<ellipse cx="15.4" cy="21" rx="2.3" ry="1.45" style="${ST('var(--dark)', 0.45)}"/>`],
          face: {
            eyes: [[7.7, 10], [16.3, 10]], rx: 0.92, ry: 1.25,
            mouth: { x: 12, y: 14.4, w: 1.6, h: 0.8 },
            nose: `<ellipse cx="12" cy="13.2" rx="1.25" ry=".85" style="${NS('var(--dark)')}"/>`,
            cheeks: [[5.2, 12.4, 1.4, 0.8], [18.8, 12.4, 1.4, 0.8]],
          },
          acc: { cx: 12, top: 3.4, eyes: [[7.7, 10], [16.3, 10]], bow: [6.8, 4.6], lens: 3.3 },
        };
      },
    },

    panda: {
      label: 'Panda', colors: { fur: '#f7f7f4', furL: '#ffffff', ear: '#ff9fb0', dark: '#2b2b31' }, sound: 'squeak',
      build() {
        const patch = () => `<ellipse cx="7.9" cy="10.8" rx="2.3" ry="2.9" transform="rotate(22 7.9 10.8)" style="${NS('var(--dark)')}"/>`;
        return {
          tail: `<circle cx="18.2" cy="20" r="1.5" style="${ST('var(--furL)', 0.5)}"/>`,
          ears: [`<circle cx="4.8" cy="4.6" r="2.6" style="${ST('var(--dark)', 0.4, 'var(--dark)')}"/>`, `<circle cx="19.2" cy="4.6" r="2.6" style="${ST('var(--dark)', 0.4, 'var(--dark)')}"/>`],
          base: `<ellipse cx="4.8" cy="17" rx="2" ry="3.2" transform="rotate(14 4.8 17)" style="${ST('var(--dark)', 0.4, 'var(--dark)')}"/><ellipse cx="19.2" cy="17" rx="2" ry="3.2" transform="rotate(-14 19.2 17)" style="${ST('var(--dark)', 0.4, 'var(--dark)')}"/><ellipse cx="12" cy="17.6" rx="6.6" ry="5.2" style="${ST('var(--fur)', 0.5)}"/><ellipse cx="12" cy="10.2" rx="9.6" ry="7.4" style="${ST('var(--fur)', 0.5)}"/>${patch()}${mirror(patch())}`,
          paws: [`<ellipse cx="8.4" cy="21" rx="2.5" ry="1.45" style="${ST('var(--dark)', 0.4, 'var(--dark)')}"/>`, `<ellipse cx="15.6" cy="21" rx="2.5" ry="1.45" style="${ST('var(--dark)', 0.4, 'var(--dark)')}"/>`],
          face: {
            eyes: [[7.9, 10.6], [16.1, 10.6]], rx: 1, ry: 1.3, eyec: '#ffffff', sclera: true, pupil: '#1d1d22', lidc: '#ffffff',
            mouth: { x: 12, y: 13.4, w: 1.7, h: 0.85, kind: 'u' },
            nose: `<ellipse cx="12" cy="12.2" rx="1.3" ry=".85" style="${NS('var(--dark)')}"/>`,
            cheeks: [[4.9, 13, 1.3, 0.8], [19.1, 13, 1.3, 0.8]],
          },
          acc: { cx: 12, top: 3.2, eyes: [[7.9, 10.6], [16.1, 10.6]], bow: [6.2, 4.6], lens: 3.3 },
        };
      },
    },

    penguin: {
      label: 'Penguin', colors: { fur: '#37456a', furL: '#f7f7f2', ear: '#ff9fb0', dark: '#273352' }, sound: 'squeak',
      build() {
        return {
          tail: `<path d="M17.2 20L21.4 21.6L16.6 21.8z" style="${ST('var(--dark)', 0.4)}"/>`,
          ears: '',
          base: `<ellipse cx="8.2" cy="21.6" rx="2.6" ry="1" style="${ST('#ffa733', 0.4)}"/><ellipse cx="15.8" cy="21.6" rx="2.6" ry="1" style="${ST('#ffa733', 0.4)}"/><path d="M12 3.6C6.6 3.6 3 8 3 13.4C3 18.4 5.6 21.6 12 21.6S21 18.4 21 13.4C21 8 17.4 3.6 12 3.6z" style="${ST('var(--fur)', 0.55)}"/><ellipse cx="12" cy="16.2" rx="5.9" ry="5.4" style="${NS('var(--furL)')}"/><path d="M5.6 11.2C5.6 8.6 8.4 7.4 10.4 9.2Q12 10.2 13.6 9.2C15.6 7.4 18.4 8.6 18.4 11.2C18.4 14 15.2 15 12 15S5.6 14 5.6 11.2z" style="${NS('var(--furL)')}"/>`,
          paws: [`<ellipse cx="3.2" cy="15.2" rx="1.7" ry="4.3" transform="rotate(14 3.2 15.2)" style="${ST('var(--dark)', 0.45)}"/>`, `<ellipse cx="20.8" cy="15.2" rx="1.7" ry="4.3" transform="rotate(-14 20.8 15.2)" style="${ST('var(--dark)', 0.45)}"/>`],
          face: {
            eyes: [[8.7, 10.4], [15.3, 10.4]], rx: 0.9, ry: 1.2, noSmile: false,
            mouth: { x: 12, y: 13.7, w: 1.1, h: 0.7, kind: 'u' },
            nose: `<path d="M10.5 11.9Q12 11.1 13.5 11.9Q12 13.4 10.5 11.9z" style="${ST('#ffa733', 0.3)}"/>`,
            cheeks: [[6.6, 12.4, 1.2, 0.75], [17.4, 12.4, 1.2, 0.75]],
            openMouth: `<path d="M10.6 12.2Q12 11.4 13.4 12.2Q12.4 15.2 12 15.2Q11.6 15.2 10.6 12.2z" style="${ST('#ff7a59', 0.3)}"/>`,
          },
          acc: { cx: 12, top: 4.4, eyes: [[8.7, 10.4], [15.3, 10.4]], bow: [16.4, 5.8], lens: 3 },
        };
      },
    },

    frog: {
      label: 'Frog', colors: { fur: '#7ccb5c', furL: '#dcf4ad', ear: '#ff9fb0', dark: '#4e9a3a' }, sound: 'ribbit',
      build() {
        const bulge = () => `<circle cx="7.2" cy="7.6" r="3.5" style="${ST('var(--fur)', 0.5)}"/>`;
        const white = ([x, y]) => `<circle cx="${x}" cy="${y}" r="2.45" style="${NS('#fff')}"/>`;
        return {
          tail: '',
          ears: '',
          base: `<ellipse cx="12" cy="15.8" rx="10.3" ry="6.6" style="${ST('var(--fur)', 0.55)}"/><ellipse cx="12" cy="17.6" rx="6.6" ry="4.1" style="${NS('var(--furL)')}"/>${bulge()}${mirror(bulge())}${white([7.2, 7.6])}${white([16.8, 7.6])}<circle cx="11" cy="11.7" r=".28" style="${NS('var(--dark)')}"/><circle cx="13" cy="11.7" r=".28" style="${NS('var(--dark)')}"/>`,
          paws: [`<ellipse cx="6" cy="21.2" rx="3.1" ry="1.3" style="${ST('var(--dark)', 0.45)}"/>`, `<ellipse cx="18" cy="21.2" rx="3.1" ry="1.3" style="${ST('var(--dark)', 0.45)}"/>`],
          face: {
            eyes: [[7.3, 7.7], [16.7, 7.7]], rx: 1.15, ry: 1.7, cover: 2.55, eyec: '#2a2530',
            mouth: { x: 12, y: 13.4, w: 5.8, h: 1.5, kind: 'u' },
            cheeks: [[4.2, 13.6, 1.6, 0.9], [19.8, 13.6, 1.6, 0.9]],
            openMouth: `<path d="M6.2 13.2Q12 19.4 17.8 13.2Q12 14.8 6.2 13.2z" style="${ST('var(--mouth)', 0.4, 'var(--ink)')}"/><ellipse cx="12" cy="16.4" rx="2.6" ry="1" style="${NS('#ff8fa3')}"/>`,
          },
          acc: { cx: 12, top: 6.2, eyes: [[7.3, 7.7], [16.7, 7.7]], bow: [12, 6.6], lens: 4.6 },
        };
      },
    },

    ghost: {
      label: 'Ghost', colors: { fur: '#eef0ff', furL: '#ffffff', ear: '#ffb7d0', dark: '#c8cdf0' }, sound: 'woo',
      build() {
        const body = 'M3 20.2V11C3 5.4 7 2.4 12 2.4S21 5.4 21 11V20.2Q18 23.4 15 20.2Q12 23.4 9 20.2Q6 23.4 3 20.2z';
        return {
          tail: `<path d="M19.6 18.4Q23.8 19 23.2 14.4" style="${LN('var(--edge)', 2.7)}"/><path d="M19.6 18.4Q23.8 19 23.2 14.4" style="${LN('var(--fur)', 1.8)}"/>`,
          ears: '',
          base: `<path d="${body}" style="${ST('var(--fur)', 0.55)};opacity:.97"/><path d="M5.4 12.6C5.4 8 8 5.2 11 4.6" style="${LN('#fff', 1.1)};opacity:.7"/><path d="M4.4 19Q6 20.6 7.6 19.2M10.4 19.2Q12 20.8 13.6 19.2M16.4 19.2Q18 20.6 19.6 19" style="${LN('var(--dark)', 0.3)};opacity:.7"/>`,
          clip: `<path d="${body}"/>`,
          paws: [`<ellipse cx="2.4" cy="14.6" rx="1.7" ry="2.5" transform="rotate(28 2.4 14.6)" style="${ST('var(--fur)', 0.45)}"/>`, `<ellipse cx="21.6" cy="14.6" rx="1.7" ry="2.5" transform="rotate(-28 21.6 14.6)" style="${ST('var(--fur)', 0.45)}"/>`],
          face: {
            eyes: [[8.2, 10.6], [15.8, 10.6]], rx: 1.1, ry: 1.65,
            mouth: { x: 12, y: 14.1, w: 1.5, h: 0.9, kind: 'u' },
            cheeks: [[5.6, 13.2, 1.5, 0.85], [18.4, 13.2, 1.5, 0.85]],
          },
          acc: { cx: 12, top: 3.2, eyes: [[8.2, 10.6], [15.8, 10.6]], bow: [17, 4.6], lens: 3.4 },
        };
      },
    },
  };

  const NAMES = Object.keys(SPECIES);
  const LABELS = {};
  NAMES.forEach((n) => { LABELS[n] = SPECIES[n].label; });
  const isSmooth = (s) => !!SPECIES[s];

  // ------------------------------------------------------------ palette
  const KITTY_FUR = {
    white:  { fur: '#f6f4f1', furL: '#ffffff', ear: '#ffb3c1', dark: '#c9c4c0' },
    black:  { fur: '#4a4a52', furL: '#6a6a73', ear: '#c98fa0', dark: '#2a2a30' },
    orange: { fur: '#f0a050', furL: '#fbe0bd', ear: '#ffb3a5', dark: '#c46f1c' },
    gray:   { fur: '#a4a9b0', furL: '#dde0e4', ear: '#e6b9c3', dark: '#6d737a' },
    cream:  { fur: '#f3e1bf', furL: '#fff6e0', ear: '#f0b9ae', dark: '#c9a46a' },
  };

  function paletteFor(sp, look, pixelVars) {
    const S = SPECIES[sp];
    let c = S.colors || KITTY_FUR[look.fur] || KITTY_FUR.white;
    if (HEX.test(look.furColor || '')) {
      const h = look.furColor;
      c = { fur: h, furL: mixc(h, '#ffffff', 0.62), ear: S.colors ? S.colors.ear : mixc(h, '#ff9fb0', 0.55), dark: (sp === 'panda' || sp === 'penguin' || sp === 'fox') ? c.dark : mixc(h, '#000000', 0.3) };
    }
    const out = {
      fur: c.fur, furL: c.furL, ear: c.ear, dark: c.dark,
      edge: mixc(sp === 'penguin' || sp === 'panda' ? c.dark : c.fur, '#000000', sp === 'penguin' ? 0.3 : 0.42),
      ink: '#2a2530', eyec: '#2a2530', cheek: '#ff8fa8', mouth: '#7a2d3d', halo: '#ffffff', screen: '#050505',
    };
    if (pixelVars) { out.pA = pixelVars.pA; out.pB = pixelVars.pB; }
    return out;
  }

  // ----------------------------------------------------------- patterns
  function patternFor(sp, look) {
    const S = SPECIES[sp];
    if (!S.patterns) return {};
    const p = look.pattern;
    if (p === 'tabby') {
      return {
        tailExtra: true,
        overlay: `<g style="${LN('var(--pA)', 0.8)}"><path d="M12 3.3v2.5M9.2 3.7l.5 2M14.8 3.7l-.5 2M2.8 9.2h2.5M2.9 11.2h2.2M21.2 9.2h-2.5M21.1 11.2h-2.2M6.4 15.8h2.2M6.2 18h2.4M17.6 15.8h-2.2M17.8 18h-2.4"/></g>`,
      };
    }
    if (p === 'calico') {
      return { tailFill: 'var(--pB)', overlay: `<g style="clip-path:url(#CLIP)"><ellipse cx="6.2" cy="6" rx="3.6" ry="3.1" style="${NS('var(--pA)')}"/><ellipse cx="18" cy="5.6" rx="4" ry="3.6" style="${NS('var(--pB)')}"/><ellipse cx="8" cy="17" rx="2.4" ry="2.8" style="${NS('var(--pA)')}"/><ellipse cx="16.4" cy="19" rx="2.4" ry="2.4" style="${NS('var(--pB)')}"/></g>` };
    }
    if (p === 'tuxedo') {
      return { overlay: `<g style="clip-path:url(#CLIP)"><path d="M0 0H24V10.4Q18 7.6 13 9.6L12 5.6L11 9.6Q6 7.6 0 10.4z" style="${NS('var(--pA)')}"/><path d="M4 14H0V24H24V14H20Q18 17 12 14Q6 17 4 14z" style="${NS('var(--pA)')};opacity:.0"/></g>`, tailFill: 'var(--pA)' };
    }
    if (p === 'points') {
      return { earFill: 'var(--pA)', pawFill: 'var(--pA)', tailFill: 'var(--pA)', overlay: `<g style="clip-path:url(#CLIP)"><ellipse cx="12" cy="12" rx="5.6" ry="4.4" style="${NS('var(--pA)')};opacity:.9"/></g>` };
    }
    return {};
  }

  // ----------------------------------------------------------------- FX
  const heart = (x, y, s) => `<path d="M${x} ${y + 1.4 * s}C${x - 2.6 * s} ${y - 0.2 * s} ${x - 1.5 * s} ${y - 2 * s} ${x} ${y - 0.7 * s}C${x + 1.5 * s} ${y - 2 * s} ${x + 2.6 * s} ${y - 0.2 * s} ${x} ${y + 1.4 * s}z" style="${ST('var(--red)', 0.3, '#fff')}"/>`;
  const zed = (x, y, s) => `<path d="M${x} ${y}h${2.4 * s}l${-2.4 * s} ${2.6 * s}h${2.4 * s}" style="${LN('var(--ink)', 0.6)}"/>`;
  const puff = (x, y, r) => `<path d="M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z" style="${ST('#fff', 0.3, 'var(--edge)')}"/>`;
  const note = (x, y) => `<path d="M${x + 2.1} ${y}a1.2 .9 -20 1 1 -2.4 0a1.2 .9 -20 1 1 2.4 0z" style="${NS('var(--ink)')}"/><path d="M${x + 2.1} ${y}v-4.2q1.6 .2 1.7 2.2" style="${LN('var(--ink)', 0.5)}"/>`;

  function fxMarkup() {
    const dots = [9, 12, 15].map((x, i) => `<g class="d${i + 1}"><circle cx="${x}" cy="-2.6" r=".75" style="${NS('var(--ink)')}"/></g>`).join('');
    const paper = `<g class="strip"><rect x="-13" y="19" width="16.4" height="3" rx=".6" style="${ST('#fff', 0.4)}"/><path d="M-11.4 20.1h2M-7.4 20.1h3.4M-2.8 20.1h2M-10 21.1h3M-5 21.1h2.2" style="${LN('#9a9a9a', 0.4)}"/></g>`;
    return [
      `<g class="fx hearts" opacity="0">${heart(-1.2, 0.6, 1.1)}${heart(25.2, -1.6, 0.9)}</g>`,
      `<g class="fx steam" opacity="0">${puff(5, -1.6, 1.3)}${puff(18.6, -2.6, 1.5)}</g>`,
      `<g class="fx dots" opacity="0">${dots}</g>`,
      `<g class="fx zzz" opacity="0">${zed(19.2, 1.2, 1)}${zed(22, -2.4, 0.8)}</g>`,
      `<g class="fx paper" opacity="0">${paper}</g>`,
      `<g class="fx notes" opacity="0">${note(-1.6, 1)}${note(24, -1.4)}</g>`,
      FX.propsMarkup('smooth'),
    ].join('');
  }

  // ------------------------------------------------- pixelated / dot-matrix
  // The vector art is re-sampled on a grid by an SVG filter, so every animation keeps working live.
  // pixel: square cells.  dots: the same cells shown as round dots.
  const CELL_PIXEL = 0.8; // pixelated: slightly finer than the old pets so faces keep their detail
  const CELL_DOTS = 1;    // dot-matrix: exactly the old pets' grid, so the dots are the same size
  function gridFilter(id, mode) {
    const CELL = mode === 'dots' ? CELL_DOTS : CELL_PIXEL;
    const sample = CELL * 0.3;
    const off = (CELL - sample) / 2;
    return `<defs><filter id="${id}" filterUnits="userSpaceOnUse" x="-16" y="-16" width="58" height="52" color-interpolation-filters="sRGB">`
      + `<feFlood x="${off}" y="${off}" width="${sample}" height="${sample}" flood-color="#000"/>`
      + `<feComposite width="${CELL}" height="${CELL}"/><feTile result="grid"/>`
      + '<feComposite in="SourceGraphic" in2="grid" operator="in"/>'
      + `<feMorphology operator="dilate" radius="${off}"/>`
      + '<feComponentTransfer result="px"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>'
      + '</filter>'
      // dot-matrix: the same cells, shown through a mask of round dots (crisp at any size)
      + (mode === 'dots'
        ? `<pattern id="${id}p" patternUnits="userSpaceOnUse" width="${CELL}" height="${CELL}"><rect width="${CELL}" height="${CELL}" fill="#000"/><circle cx="${CELL / 2}" cy="${CELL / 2}" r="${CELL * 0.46}" fill="#fff"/></pattern>`
          + `<mask id="${id}m" maskUnits="userSpaceOnUse" x="-16" y="-16" width="58" height="52"><rect x="-16" y="-16" width="58" height="52" fill="url(#${id}p)"/></mask>`
        : '')
      + '</defs>';
  }

  // ------------------------------------------------------------- markup
  let uid = 0;
  function markup(look) {
    const sp = SPECIES[look.style] ? look.style : 'blob';
    const S = SPECIES[sp];
    const pat = patternFor(sp, look);
    const id = 'bc' + (++uid);
    const B = S.build(pat);
    const F = faceParts(B.face);
    const overlay = (B.base || '').replace(/url\(#CLIP\)/g, `url(#${id})`);
    const defs = B.clip ? `<defs><clipPath id="${id}">${B.clip}</clipPath></defs>` : '';
    const earL = B.ears ? `<g class="ear ear-l">${B.ears[0]}</g><g class="ear ear-r">${B.ears[1]}</g>` : '';
    const acc = look.acc && FX.ACC_NAMES.includes(look.acc) ? FX.smoothAcc(look.acc, B.acc) : '';
    const shades = look.acc === 'shades' ? acc : '';
    const rest = look.acc === 'shades' ? '' : acc;
    const inner = [
      defs,
      '<g class="shadow" style="opacity:.2"><ellipse cx="12" cy="22.5" rx="9" ry="1.15" fill="#000"/></g>',
      '<g class="body-g">',
        `<g class="tail tail-a">${B.tail || ''}</g>`,
        earL,
        `<g class="base">${overlay}</g>`,
        `<g class="paw paw-l">${B.paws[0]}</g><g class="paw paw-r">${B.paws[1]}</g>`,
        '<g class="face">', F.cheeks, F.extra, `<g class="nose">${F.nose}</g>`, '</g>',
        '<g class="look">',
          `<g class="eyes">${F.eyes}</g>`,
          `<g class="lids" opacity="0">${F.lids}</g>`,
          `<g class="e-happy">${F.happy}</g>`,
          `<g class="e-angry">${F.angry}</g>`,
          `<g class="e-sad">${F.sad}</g>`,
          `<g class="e-heart">${F.heart}</g>`,
          shades,
        '</g>',
        `<g class="m-smile">${F.mouthSm}</g>`,
        `<g class="m-flat">${F.mouthFlat}</g>`,
        `<g class="m-sad">${F.mouthSad}</g>`,
        `<g class="m-o">${F.mouthO}</g>`,
        `<g class="m-open" opacity="0">${F.mouthOpen}</g>`,
        `<g class="acc">${rest}</g>`,
      '</g>',
      fxMarkup(),
    ].join('');
    if (look.render !== 'pixel' && look.render !== 'dots') return inner;
    const fid = 'gf' + uid;
    const wrapped = `<g class="rfx" style="filter:url(#${fid})">${inner}</g>`;
    return gridFilter(fid, look.render) + (look.render === 'dots' ? `<g mask="url(#${fid}m)">${wrapped}</g>` : wrapped);
  }

  const api = { SPECIES, NAMES, LABELS, isSmooth, markup, paletteFor, KITTY_FUR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SMOOTH = api;
})(typeof window !== 'undefined' ? window : globalThis);
