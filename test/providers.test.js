'use strict';
// providers.js against small fake servers on 127.0.0.1: no real keys, no network, no cost.
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const createProviders = require('../providers.js');

const TOOLS = [{ type: 'function', function: { name: 'get_local_time', description: 'Get the time.', parameters: { type: 'object', properties: {} } } }];

function makeProviders() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bloop-prov-'));
  const app = { getPath: () => dir };
  // a stand-in for the OS keychain: reversible, but not plain text
  const safeStorage = { isAsyncEncryptionAvailable: async () => true, encryptStringAsync: async (s) => Buffer.from([...s].reverse().join('')), decryptStringAsync: async (b) => ({ result: [...b.toString()].reverse().join(''), shouldReEncrypt: false }) };
  const writeJsonAtomic = (f, d) => fs.writeFileSync(f, JSON.stringify(d));
  return { P: createProviders({ app, safeStorage, writeJsonAtomic }), dir };
}

const fakeServer = require('../scripts/fake-ai-server.js');

async function collect(gen) {
  const out = { text: '', thinking: '', calls: null, raw: null };
  for await (const o of gen) {
    if (o.message && o.message.content) out.text += o.message.content;
    if (o.message && o.message.thinking) out.thinking += o.message.thinking;
    if (o.message && o.message.tool_calls) out.calls = o.message;
    if (o.raw) out.raw = o.raw;
    if (o.message && o.message.tool_calls) break; // the chat loop stops reading here too
  }
  return out;
}

test('keys are stored encrypted and never returned', () => {
  const { P, dir } = makeProviders();
  P.setConfig({ provider: 'openai' });
  return P.setKey('openai', 'bad').then(() => {
    const file = fs.readFileSync(path.join(dir, 'ai-config.json'), 'utf8');
    assert.ok(!file.includes('"bad"'));
    const pub = JSON.stringify(P.publicConfig());
    assert.ok(!/"data"/.test(pub));
  });
});

test('OpenAI-compatible: tool call streamed in pieces, then the answer; tool ids line up', async () => {
  const { srv, seen, url } = await fakeServer();
  try {
    const { P } = makeProviders();
    P.setConfig({ provider: 'custom', base: { custom: url + '/v1' } });
    const st = await P.status();
    assert.equal(st.running, true);
    assert.deepEqual(st.allModels, ['fake-large', 'fake-small']); // embeddings filtered out
    const conv = [{ role: 'system', content: 'sys' }, { role: 'user', content: 'time?' }];
    const first = await collect(P.stream({ model: 'fake-large', messages: conv, tools: TOOLS }));
    assert.equal(first.calls.tool_calls[0].function.name, 'get_local_time');
    assert.deepEqual(first.calls.tool_calls[0].function.arguments, {});
    conv.push({ role: 'assistant', content: '', tool_calls: first.calls.tool_calls }, { role: 'tool', tool_name: 'get_local_time', content: '12:00' });
    const second = await collect(P.stream({ model: 'fake-large', messages: conv, tools: TOOLS }));
    assert.equal(second.text, 'It is noon.');
    const sent = seen.filter((x) => x.url.endsWith('/chat/completions'))[1].body.messages;
    assert.equal(sent[2].tool_calls[0].id, 'call_abc');
    assert.equal(sent[3].tool_call_id, 'call_abc');
    assert.equal(P.usageToday().by.custom.req, 2);
  } finally { srv.close(); }
});

test('Anthropic: thinking + tool use, raw blocks replayed unchanged with the tool result', async () => {
  const { srv, seen, url } = await fakeServer();
  try {
    const { P } = makeProviders();
    P.setConfig({ provider: 'anthropic', base: { anthropic: url } });
    const k = await P.setKey('anthropic', 'test-key-0000');
    assert.equal(k.ok, true);
    const conv = [{ role: 'system', content: 'You are Bloop.' }, { role: 'user', content: 'time?' }];
    const first = await collect(P.stream({ model: 'claude-opus-5-5', messages: conv, tools: TOOLS, wantThink: true }));
    assert.equal(first.thinking, 'The user wants the time.');
    assert.equal(first.calls.tool_calls[0].id, 'toolu_1');
    conv.push({ role: 'assistant', content: '', tool_calls: first.calls.tool_calls, _raw: first.calls._raw }, { role: 'tool', tool_name: 'get_local_time', content: '12:00' });
    const second = await collect(P.stream({ model: 'claude-opus-5-5', messages: conv, tools: TOOLS }));
    assert.equal(second.text, 'It is noon.');
    const reqs = seen.filter((x) => x.url.endsWith('/v1/messages'));
    const b1 = reqs[0].body, b2 = reqs[1].body;
    // the SDK sends the key as a bearer token (older versions used x-api-key)
    assert.ok(reqs[0].headers['x-api-key'] === 'test-key-0000' || reqs[0].headers.authorization === 'Bearer test-key-0000');
    assert.match(String(reqs[0].headers['anthropic-beta']), /thinking-binding-controls-2026-08-01/);
    assert.match(String(reqs[0].headers['anthropic-beta']), /server-side-fallback-2026-07-01/);
    assert.equal(b1.system, 'You are Bloop.');
    assert.equal(b1.fallbacks, 'default');
    assert.equal(b1.thinking.type, 'adaptive');
    assert.equal(b1.thinking.display, 'summarized');
    assert.equal(b1.temperature, undefined);
    assert.equal(b1.tools[0].input_schema.type, 'object');
    assert.equal(b1.tools[0].eager_input_streaming, true);
    const asst = b2.messages[1];
    assert.equal(asst.role, 'assistant');
    assert.equal(asst.content[0].type, 'thinking');
    assert.equal(asst.content[0].signature, 'SIG123');
    assert.equal(b2.messages[2].content[0].type, 'tool_result');
    assert.equal(b2.messages[2].content[0].tool_use_id, 'toolu_1');
  } finally { srv.close(); }
});

test('a rejected key is not kept, and the error says what to do', async () => {
  const { srv, url } = await fakeServer();
  try {
    const { P } = makeProviders();
    P.setConfig({ base: { openai: url + '/v1' } });
    const r = await P.setKey('openai', 'bad');
    assert.equal(r.ok, false);
    assert.match(r.error, /rejected the API key/);
    assert.equal(P.publicConfig().providers.find((p) => p.id === 'openai').hasKey, false);
  } finally { srv.close(); }
});

test('daily cloud limit stops requests', () => {
  const { P } = makeProviders();
  P.setConfig({ dailyLimit: 2 });
  assert.equal(P.checkLimit('openai'), null);
  P.record('openai', 0, 0, 2);
  assert.match(P.checkLimit('openai'), /today's cloud limit/);
  assert.equal(P.checkLimit('ollama'), null); // local brains are never limited
});

test('translation: missing tool results are filled in, conversation starts with the user', () => {
  const { P } = makeProviders();
  const conv = [
    { role: 'system', content: 's' },
    { role: 'assistant', content: 'hello from history' },
    { role: 'user', content: 'go', images: ['/9j/AAAA'] },
    { role: 'assistant', content: '', tool_calls: [{ function: { name: 'a', arguments: {} } }, { function: { name: 'b', arguments: '{"x":1}' } }] },
    { role: 'tool', tool_name: 'a', content: 'ok' },
    { role: 'user', content: 'next' },
  ];
  const A = P.toAnthropic(conv);
  assert.equal(A.messages[0].role, 'user');
  assert.equal(A.messages[0].content[0].source.media_type, 'image/jpeg');
  const results = A.messages[2].content.filter((b) => b.type === 'tool_result');
  assert.equal(results.length, 2);
  assert.deepEqual(A.messages[1].content[1].input, { x: 1 });
  const O = P.toOpenAI(conv);
  assert.equal(O.filter((m) => m.role === 'tool').length, 2);
  assert.equal(O[2].content[1].image_url.url.slice(0, 23), 'data:image/jpeg;base64,');
});
