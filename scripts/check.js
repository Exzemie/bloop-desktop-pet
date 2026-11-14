'use strict';
// `npm run check`: syntax-check every script, then draw every look in every style once.
// Works the same on Windows, macOS and Linux (CI runs it on each push).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const scripts = fs.readdirSync(root).filter((f) => f.endsWith('.js'));
for (const f of scripts) execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'inherit' });
console.log('syntax ok: ' + scripts.join(', '));

const CAT = require(path.join(root, 'cat.js'));
let drawn = 0;
for (const render of ['smooth', 'pixel', 'dots']) {
  for (const style of CAT.STYLES) {
    const out = CAT.markup({ style, render, fur: 'white', pattern: 'solid' });
    if (typeof out !== 'string' || !out.length) throw new Error(`empty drawing for ${style} / ${render}`);
    drawn++;
  }
}
console.log('renderers ok: ' + drawn + ' drawings');

// every command the "/" list offers must have a handler (and the catalogue must not drift from the code)
const renderer = fs.readFileSync(path.join(root, 'renderer.js'), 'utf8');
const listed = [...renderer.matchAll(/^ {2}\['([\w]+)', '/gm)].map((m) => m[1]);
const handled = new Set([...renderer.matchAll(/case '([\w]+)':/g)].map((m) => m[1]));
const missing = listed.filter((c) => !handled.has(c));
if (!listed.length) throw new Error('could not find the COMMANDS list in renderer.js');
if (missing.length) throw new Error('commands listed but not handled: ' + missing.join(', '));
console.log('commands ok: ' + listed.length + ' listed, all handled');
