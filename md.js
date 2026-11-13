'use strict';
/*
 * Tiny, safe formatter for AI replies. Local models answer in Markdown whether you ask them to or not,
 * so instead of showing raw ``` and ** markers, Bloop draws:
 *   - fenced code blocks (with a Copy button)
 *   - `inline code` and **bold**
 *   - "# headings" as a bold line, "- item" / "* item" as "• item"
 * Everything is built with DOM text nodes (never innerHTML), so a reply can never inject markup.
 * parse() is pure and runs in Node too (see test/md.test.js).
 */
(function () {
  const FENCE = /^\s*(```+|~~~+)\s*([\w+#.-]*)\s*$/;
  const INLINE = /(`[^`\n]+`)|(\*\*[^\s*](?:[^*\n]*[^\s*])?\*\*)/g;

  // One line of prose -> spans: { t: 'text' | 'b' | 'code', s }
  function inline(line) {
    const spans = [];
    const push = (t, s) => {
      if (!s) return;
      const last = spans[spans.length - 1];
      if (last && last.t === t && t === 'text') last.s += s; else spans.push({ t, s });
    };
    const heading = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) { push('b', heading[1].replace(/\*\*/g, '')); return spans; }
    line = line.replace(/^(\s*)[-*+]\s+(?=\S)/, '$1• ');
    let at = 0;
    let m;
    INLINE.lastIndex = 0;
    while ((m = INLINE.exec(line))) {
      push('text', line.slice(at, m.index));
      if (m[1]) push('code', m[1].slice(1, -1)); else push('b', m[2].slice(2, -2));
      at = m.index + m[0].length;
    }
    push('text', line.slice(at));
    return spans;
  }

  // text -> blocks: { t: 'p', spans } | { t: 'code', lang, text, closed }
  function parse(text) {
    const blocks = [];
    const lines = String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n');
    let prose = [];
    let code = null;
    const flush = () => {
      if (!prose.length) return;
      const spans = [];
      prose.forEach((ln, i) => {
        for (const s of inline(ln)) {
          const last = spans[spans.length - 1];
          if (last && last.t === 'text' && s.t === 'text') last.s += s.s; else spans.push({ ...s });
        }
        if (i < prose.length - 1) {
          const last = spans[spans.length - 1];
          if (last && last.t === 'text') last.s += '\n'; else spans.push({ t: 'text', s: '\n' });
        }
      });
      // blank lines right next to a code block are already covered by the block's own margin
      if (spans.length) {
        const first = spans[0], last = spans[spans.length - 1];
        if (blocks.length && first.t === 'text') first.s = first.s.replace(/^\n+/, '');
        if (last.t === 'text') last.s = last.s.replace(/\n+$/, '');
      }
      const kept = spans.filter((s) => s.s);
      if (kept.length) blocks.push({ t: 'p', spans: kept });
      prose = [];
    };
    for (const ln of lines) {
      const f = FENCE.exec(ln);
      if (code) {
        if (f && !f[2] && f[1][0] === code.mark[0] && f[1].length >= code.mark.length) {
          blocks.push({ t: 'code', lang: code.lang, text: code.lines.join('\n'), closed: true });
          code = null;
        } else code.lines.push(ln);
      } else if (f) {
        flush();
        code = { mark: f[1], lang: f[2].toLowerCase(), lines: [] };
      } else prose.push(ln);
    }
    if (code) blocks.push({ t: 'code', lang: code.lang, text: code.lines.join('\n'), closed: false }); // still streaming
    else flush();
    return blocks;
  }

  function copyText(text) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* ignore */ }
      ta.remove();
      return ok;
    };
    try {
      // in the app, the main process writes the clipboard (works even when the window is not focused)
      if (window.pet && window.pet.copyText) return window.pet.copyText(text).then(() => true, fallback);
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, fallback);
    } catch { /* fall through */ }
    return Promise.resolve(fallback());
  }

  // Draw `text` into `el` (replacing what was there).
  function render(el, text) {
    const frag = document.createDocumentFragment();
    for (const b of parse(text)) {
      if (b.t === 'code') {
        const box = document.createElement('div');
        box.className = 'md-pre';
        const head = document.createElement('div');
        head.className = 'md-pre-head';
        const lang = document.createElement('span');
        lang.textContent = b.lang || 'code';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'md-copy';
        btn.textContent = 'Copy';
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const ok = await copyText(b.text);
          btn.textContent = ok ? 'Copied' : 'Select + Ctrl+C';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
        });
        head.append(lang, btn);
        const pre = document.createElement('pre');
        pre.textContent = b.text;
        box.append(head, pre);
        frag.appendChild(box);
      } else {
        const p = document.createElement('div');
        p.className = 'md-p';
        for (const s of b.spans) {
          if (s.t === 'text') p.appendChild(document.createTextNode(s.s));
          else {
            const n = document.createElement(s.t === 'b' ? 'b' : 'code');
            n.textContent = s.s;
            p.appendChild(n);
          }
        }
        frag.appendChild(p);
      }
    }
    el.textContent = '';
    el.appendChild(frag);
  }

  const api = { parse, inline, render, copyText };
  if (typeof window !== 'undefined') window.MD = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
