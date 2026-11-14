'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MD = require('../md.js');

test('plain text stays one paragraph, untouched', () => {
  assert.deepEqual(MD.parse('Hello there.\nSecond line.'), [{ t: 'p', spans: [{ t: 'text', s: 'Hello there.\nSecond line.' }] }]);
});

test('fenced code block with language', () => {
  const b = MD.parse('Here:\n```js\nconst a = 1;\n  b();\n```\nDone.');
  assert.equal(b.length, 3);
  assert.deepEqual(b[1], { t: 'code', lang: 'js', text: 'const a = 1;\n  b();', closed: true });
  assert.equal(b[0].spans[0].s, 'Here:');
  assert.equal(b[2].spans[0].s, 'Done.');
});

test('unclosed fence while streaming is still a code block', () => {
  const b = MD.parse('```python\nprint(1)');
  assert.deepEqual(b, [{ t: 'code', lang: 'python', text: 'print(1)', closed: false }]);
});

test('markers inside code are left alone', () => {
  const b = MD.parse('```\n**not bold** `x`\n# not a heading\n```');
  assert.equal(b[0].text, '**not bold** `x`\n# not a heading');
});

test('inline code and bold', () => {
  assert.deepEqual(MD.inline('Run `npm start` **now** ok'), [
    { t: 'text', s: 'Run ' }, { t: 'code', s: 'npm start' }, { t: 'text', s: ' ' }, { t: 'b', s: 'now' }, { t: 'text', s: ' ok' },
  ]);
});

test('lone asterisks and maths are not bold', () => {
  assert.deepEqual(MD.inline('2 ** 3 and *dances*'), [{ t: 'text', s: '2 ** 3 and *dances*' }]);
});

test('headings become a bold line, bullets become dots', () => {
  assert.deepEqual(MD.inline('## Plan'), [{ t: 'b', s: 'Plan' }]);
  assert.deepEqual(MD.inline('- first'), [{ t: 'text', s: '• first' }]);
  assert.deepEqual(MD.inline('  * nested'), [{ t: 'text', s: '  • nested' }]);
  assert.deepEqual(MD.inline('-5 degrees'), [{ t: 'text', s: '-5 degrees' }]);
});

test('tool progress lines pass through', () => {
  const s = '[Bloop / search_web…]\n↳ 1. Result';
  assert.equal(MD.parse(s)[0].spans[0].s, s);
});

test('html is never interpreted (it is only ever text)', () => {
  const b = MD.parse('<img src=x onerror=alert(1)>');
  assert.deepEqual(b, [{ t: 'p', spans: [{ t: 'text', s: '<img src=x onerror=alert(1)>' }] }]);
});

test('empty and null input', () => {
  assert.deepEqual(MD.parse(''), []);
  assert.deepEqual(MD.parse(null), []);
});
