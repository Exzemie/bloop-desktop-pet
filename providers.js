'use strict';
/*
 * Where Bloop's brain lives. One place that knows every AI provider:
 *   - Ollama and LM Studio run on your own computer (free, private).
 *   - Cloud providers (Anthropic Claude, OpenAI, Gemini, OpenRouter, Groq, Mistral, DeepSeek, xAI, Together, or any
 *     OpenAI-compatible server) need an API key and are billed by that provider.
 *
 * Every provider is streamed into the same small shape the chat loop in main.js already understood from Ollama:
 *   { message: { content?, thinking?, tool_calls? }, done?, raw? }
 * so the tool loop, nudges, honesty check and stop button work the same whichever brain is plugged in.
 *
 * API keys are encrypted with the operating system's keychain (Electron safeStorage) and never leave the main process:
 * the chat window only ever sees "a key is saved, ending in abcd".
 */
const fs = require('fs');
const path = require('path');

// The chat loop's tool definitions are OpenAI-style ({ type: 'function', function: { name, description, parameters } }).
const CATALOG = [
  { id: 'ollama', label: 'Ollama (on this computer)', short: 'Ollama', kind: 'ollama', local: true, keyless: true, base: 'http://127.0.0.1:11434' },
  { id: 'lmstudio', label: 'LM Studio (on this computer)', short: 'LM Studio', kind: 'openai', local: true, keyless: true, base: 'http://127.0.0.1:1234/v1' },
  { id: 'anthropic', label: 'Anthropic Claude', short: 'Claude', kind: 'anthropic', base: 'https://api.anthropic.com',
    keyUrl: 'https://console.anthropic.com/settings/keys', keyHint: 'sk-ant-…',
    defaultModel: 'claude-opus-5-5', suggest: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-2'] },
  { id: 'openai', label: 'OpenAI', short: 'OpenAI', kind: 'openai', base: 'https://api.openai.com/v1',
    keyUrl: 'https://platform.openai.com/api-keys', keyHint: 'sk-…', usage: true, maxParam: 'max_completion_tokens',
    filter: /^(gpt-|o\d|chatgpt-)/i, exclude: /-instruct|-search|transcribe|tts|audio|realtime|image|codex/i,
    prefer: [/^gpt-5(\.\d+)?-mini$/, /^gpt-5(\.\d+)?$/, /^gpt-4\.1-mini$/, /^gpt-4o-mini$/] },
  { id: 'gemini', label: 'Google Gemini', short: 'Gemini', kind: 'openai', base: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyUrl: 'https://aistudio.google.com/apikey', keyHint: 'AIza…', filter: /gemini/i, exclude: /embedding|image|tts|live|native-audio/i,
    prefer: [/^gemini-[\d.]+-flash$/, /^gemini-[\d.]+-pro$/, /^gemini-[\d.]+-flash/], vision: /./ },
  { id: 'openrouter', label: 'OpenRouter (hundreds of models)', short: 'OpenRouter', kind: 'openai', base: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai/keys', keyHint: 'sk-or-…', usage: true, defaultModel: 'openrouter/auto',
    headers: { 'X-Title': 'Bloop desktop pet' } },
  { id: 'groq', label: 'Groq (very fast)', short: 'Groq', kind: 'openai', base: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com/keys', keyHint: 'gsk_…', usage: true, exclude: /whisper|tts|guard|playai|orpheus/i,
    prefer: [/llama-3\.3-70b/, /gpt-oss-120b/, /llama/] },
  { id: 'mistral', label: 'Mistral', short: 'Mistral', kind: 'openai', base: 'https://api.mistral.ai/v1',
    keyUrl: 'https://console.mistral.ai/api-keys', exclude: /embed|ocr|moderation|transcri|voxtral/i,
    prefer: [/^mistral-medium-latest$/, /^mistral-small-latest$/, /^mistral-large-latest$/], vision: /pixtral|medium|small|large/i },
  { id: 'deepseek', label: 'DeepSeek', short: 'DeepSeek', kind: 'openai', base: 'https://api.deepseek.com/v1',
    keyUrl: 'https://platform.deepseek.com/api_keys', prefer: [/^deepseek-chat$/], vision: /^$/ },
  { id: 'xai', label: 'xAI Grok', short: 'Grok', kind: 'openai', base: 'https://api.x.ai/v1',
    keyUrl: 'https://console.x.ai', keyHint: 'xai-…', exclude: /image|imagine/i, prefer: [/^grok-4/, /^grok-3-mini/, /^grok/], vision: /vision|grok-4/i },
  { id: 'together', label: 'Together AI', short: 'Together', kind: 'openai', base: 'https://api.together.xyz/v1',
    keyUrl: 'https://api.together.ai/settings/api-keys', exclude: /embed|rerank|flux|stable-diffusion|whisper|guard|sonic|cartesia/i,
    prefer: [/Llama-3\.3-70B-Instruct-Turbo/i, /Instruct-Turbo/i] },
  { id: 'custom', label: 'Custom (any OpenAI-compatible server)', short: 'Custom', kind: 'openai', keyOptional: true, base: '' },
];
const BY_ID = Object.fromEntries(CATALOG.map((p) => [p.id, p]));
const GENERIC_EXCLUDE = /embed|whisper|tts|transcri|rerank|moderation|dall-e|text-to-|speech/i;
// Claude models that accept server-side refusal fallbacks (fallbacks: "default").
const CLAUDE_FALLBACK = /^claude-(fable-5-[12]|opus-5(-5)?|sonnet-5-5)$/;
const MODEL_TTL = 10 * 60 * 1000;

class ProviderError extends Error {
  constructor(msg, status) { super(msg); this.name = 'ProviderError'; this.status = status; }
}

module.exports = function createProviders({ app, safeStorage, writeJsonAtomic }) {
  const cfgPath = () => path.join(app.getPath('userData'), 'ai-config.json');
  const DEFAULTS = { provider: 'ollama', keys: {}, base: {}, temperature: 0.4, maxTokens: 0, ctx: 8192, effort: '', cloudVision: false, dailyLimit: 0, usage: null };
  let cfg = null;
  function load() {
    if (cfg) return cfg;
    let saved = {};
    try { saved = JSON.parse(fs.readFileSync(cfgPath(), 'utf8')) || {}; } catch { /* first run */ }
    cfg = { ...DEFAULTS, ...saved, keys: { ...(saved.keys || {}) }, base: { ...(saved.base || {}) } };
    if (!BY_ID[cfg.provider]) cfg.provider = 'ollama';
    return cfg;
  }
  const persist = () => { try { writeJsonAtomic(cfgPath(), cfg); } catch (e) { console.error('ai-config save failed', e); } };

  // ------------------------------------------------------------------ keys
  let encOk = null; // is an OS keychain available? (asked once)
  async function canEncrypt() {
    if (encOk === null) { try { encOk = !!(await safeStorage.isAsyncEncryptionAvailable()); } catch { encOk = false; } }
    return encOk;
  }
  async function getKey(pid) {
    const k = load().keys[pid];
    if (!k || !k.data) return '';
    if (k.plain) return Buffer.from(k.data, 'base64').toString('utf8');
    try {
      const r = await safeStorage.decryptStringAsync(Buffer.from(k.data, 'base64'));
      if (r.shouldReEncrypt) await storeKey(pid, r.result); // the keychain rotated its key
      return r.result;
    } catch { return ''; }
  }
  async function storeKey(pid, key) {
    const enc = await canEncrypt();
    load().keys[pid] = {
      data: (enc ? await safeStorage.encryptStringAsync(key) : Buffer.from(key, 'utf8')).toString('base64'),
      plain: !enc, tail: key.slice(-4),
    };
    persist();
  }

  // ------------------------------------------------------------- providers
  const prov = (pid) => BY_ID[pid || load().provider] || BY_ID.ollama;
  const baseOf = (p) => String(load().base[p.id] || p.base || '').replace(/\/+$/, '');
  const isCloud = (pid) => !prov(pid).local;
  const hasKey = (p) => p.keyless || p.keyOptional || !!(load().keys[p.id] && load().keys[p.id].data);
  const validBase = (u) => { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; } catch { return false; } };

  function catalog() {
    const c = load();
    return CATALOG.map((p) => ({
      id: p.id, label: p.label, short: p.short, kind: p.kind, local: !!p.local, keyless: !!p.keyless, keyOptional: !!p.keyOptional,
      keyUrl: p.keyUrl || '', keyHint: p.keyHint || '', defaultBase: p.base, base: c.base[p.id] || '',
      hasKey: !!(c.keys[p.id] && c.keys[p.id].data), keyTail: (c.keys[p.id] && c.keys[p.id].tail) || '',
      keyEncrypted: !!(c.keys[p.id] && c.keys[p.id].data && !c.keys[p.id].plain),
    }));
  }
  function publicConfig() {
    const c = load();
    return { provider: c.provider, temperature: c.temperature, maxTokens: c.maxTokens, ctx: c.ctx, effort: c.effort,
      cloudVision: !!c.cloudVision, dailyLimit: c.dailyLimit, canEncrypt: encOk !== false, usage: usageToday(), providers: catalog() };
  }
  function setConfig(patch) {
    const c = load();
    patch = patch && typeof patch === 'object' ? patch : {};
    if ('provider' in patch && BY_ID[patch.provider]) c.provider = patch.provider;
    if ('temperature' in patch) c.temperature = Math.max(0, Math.min(2, Number(patch.temperature) || 0));
    if ('maxTokens' in patch) c.maxTokens = Math.max(0, Math.min(200000, Math.round(Number(patch.maxTokens) || 0)));
    if ('ctx' in patch) c.ctx = [2048, 4096, 8192, 16384, 32768, 65536].includes(Number(patch.ctx)) ? Number(patch.ctx) : 8192;
    if ('effort' in patch) c.effort = ['', 'low', 'medium', 'high', 'xhigh', 'max'].includes(patch.effort) ? patch.effort : '';
    if ('cloudVision' in patch) c.cloudVision = !!patch.cloudVision;
    if ('dailyLimit' in patch) c.dailyLimit = Math.max(0, Math.min(100000, Math.round(Number(patch.dailyLimit) || 0)));
    if (patch.base && typeof patch.base === 'object') {
      for (const [pid, url] of Object.entries(patch.base)) {
        if (!BY_ID[pid]) continue;
        const u = String(url || '').trim();
        if (!u) delete c.base[pid];
        else if (validBase(u)) c.base[pid] = u.slice(0, 300);
        else throw new ProviderError('That is not a valid http(s) address.');
        modelCache.delete(pid);
      }
    }
    persist();
    return publicConfig();
  }

  // ---------------------------------------------------------------- usage
  const today = () => new Date().toISOString().slice(0, 10);
  function usageToday() {
    const c = load();
    if (!c.usage || c.usage.day !== today()) c.usage = { day: today(), by: {} };
    return c.usage;
  }
  let usageDirty = false;
  function record(pid, inTok, outTok, requests) {
    const u = usageToday();
    const r = u.by[pid] || (u.by[pid] = { req: 0, in: 0, out: 0 });
    r.req += requests || 0; r.in += inTok || 0; r.out += outTok || 0;
    if (!usageDirty) { usageDirty = true; setTimeout(() => { usageDirty = false; persist(); }, 2000); }
  }
  function cloudRequestsToday() {
    return Object.entries(usageToday().by).filter(([pid]) => BY_ID[pid] && !BY_ID[pid].local).reduce((n, [, r]) => n + r.req, 0);
  }
  // A guard against surprise bills: Settings > AI > Daily cloud request limit.
  function checkLimit(pid) {
    const lim = load().dailyLimit;
    if (!isCloud(pid) || !lim) return null;
    const used = cloudRequestsToday();
    return used >= lim ? `I reached today's cloud limit (${lim} requests). It resets at midnight UTC, or raise it in Settings > AI.` : null;
  }

  // ---------------------------------------------------------------- errors
  function friendly(p, status, detail) {
    const d = String(detail || '').replace(/\s+/g, ' ').slice(0, 220);
    const L = p.short;
    if (status === 401 || status === 403) return `${L} rejected the API key${d ? ' (' + d + ')' : ''}. Check it in Settings > AI.`;
    if (status === 402) return `${L} says the account is out of credit. Add credit on their website, or switch to a local model with /ai ollama.`;
    if (status === 404) return `${L} could not find that model${d ? ' (' + d + ')' : ''}. Pick another with /model.`;
    if (status === 429) return `${L} is rate-limiting this key, or its quota is used up${d ? ' (' + d + ')' : ''}. Wait a moment and try again.`;
    if (status >= 500) return `${L} is having trouble right now (HTTP ${status}). Try again in a moment.`;
    return `${L} returned an error${status ? ' (HTTP ' + status + ')' : ''}: ${d || 'no details'}`;
  }
  const netError = (p, e) => new ProviderError(p.local
    ? `I cannot reach ${p.short} at ${baseOf(p)}. Make sure it is running.`
    : `I cannot reach ${p.short} (${String((e && e.cause && e.cause.code) || (e && e.message) || e).slice(0, 80)}). Check your internet connection.`);

  // ---------------------------------------------------------------- models
  const modelCache = new Map(); // pid -> { at, ids, meta }
  async function listModels(pid, force) {
    const p = prov(pid);
    const hit = modelCache.get(p.id);
    if (!force && hit && Date.now() - hit.at < MODEL_TTL) return hit;
    let ids = [];
    const meta = {};
    if (p.kind === 'ollama') {
      const r = await fetch(baseOf(p) + '/api/tags', { signal: AbortSignal.timeout(2500) });
      if (!r.ok) throw new ProviderError('bad status', r.status);
      ids = ((await r.json()).models || []).map((m) => m.name);
    } else if (p.kind === 'anthropic') {
      const client = await anthropicClient(p);
      for await (const m of client.models.list({ limit: 100 })) { ids.push(m.id); if (ids.length >= 200) break; }
    } else {
      const key = await getKey(p.id);
      const r = await fetch(baseOf(p) + '/models', { headers: { ...(key ? { Authorization: 'Bearer ' + key } : {}), ...(p.headers || {}) }, signal: AbortSignal.timeout(p.local ? 2500 : 12000) });
      if (!r.ok) throw new ProviderError(friendly(p, r.status, await r.text().catch(() => '')), r.status);
      const j = await r.json();
      for (const m of (Array.isArray(j.data) ? j.data : Array.isArray(j.models) ? j.models : [])) {
        const id = String(m.id || m.name || '').replace(/^models\//, '');
        if (!id) continue;
        ids.push(id);
        // OpenRouter says what each model can do
        if (m.architecture || m.supported_parameters) {
          meta[id] = {
            vision: Array.isArray(m.architecture && m.architecture.input_modalities) ? m.architecture.input_modalities.includes('image') : undefined,
            tools: Array.isArray(m.supported_parameters) ? m.supported_parameters.includes('tools') : undefined,
            thinking: Array.isArray(m.supported_parameters) ? m.supported_parameters.includes('reasoning') : undefined,
          };
        }
      }
      ids = ids.filter((id) => !GENERIC_EXCLUDE.test(id) && (!p.filter || p.filter.test(id)) && (!p.exclude || !p.exclude.test(id)));
      if (p.id === 'openrouter') ids = ids.filter((id) => !meta[id] || meta[id].tools !== false);
    }
    const out = { at: Date.now(), ids: [...new Set(ids)].slice(0, 500), meta };
    modelCache.set(p.id, out);
    return out;
  }
  function defaultModel(p, ids) {
    if (p.defaultModel) return p.defaultModel;
    for (const re of p.prefer || []) {
      const hits = ids.filter((id) => re.test(id)).sort().reverse(); // newest version first, roughly
      if (hits.length) return hits[0];
    }
    return ids[0] || '';
  }
  // The short list for the dropdown at the top of the chat. The full list is in Settings.
  function curated(p, ids) {
    if (p.local) return ids;
    const pick = [];
    const add = (id) => { if (id && !pick.includes(id)) pick.push(id); };
    add(defaultModel(p, ids));
    (p.suggest || []).forEach((id) => { if (!ids.length || ids.includes(id)) add(id); });
    for (const re of p.prefer || []) ids.filter((id) => re.test(id)).sort().reverse().slice(0, 2).forEach(add);
    ids.slice(0, 8).forEach((id) => { if (pick.length < 10) add(id); });
    return pick.slice(0, 12);
  }

  async function status() {
    const p = prov();
    const base = { provider: p.id, label: p.label, short: p.short, cloud: !p.local, kind: p.kind };
    if (!hasKey(p)) return { ...base, running: false, needsKey: true, models: [], allModels: [] };
    if (p.id === 'custom' && !baseOf(p)) return { ...base, running: false, needsBase: true, models: [], allModels: [] };
    try {
      const m = await listModels(p.id);
      return { ...base, running: true, models: curated(p, m.ids), allModels: m.ids, defaultModel: defaultModel(p, m.ids) };
    } catch (e) {
      if (p.local) return { ...base, running: false, models: [], allModels: [], error: e.status ? friendly(p, e.status, e.message) : netError(p, e).message };
      // The key is saved but the list could not be fetched (offline, or the provider has no list endpoint):
      // keep going with the suggestions so chatting still works.
      const fallback = p.suggest || (p.defaultModel ? [p.defaultModel] : []);
      return { ...base, running: true, models: fallback, allModels: fallback, defaultModel: defaultModel(p, fallback),
        error: e instanceof ProviderError ? e.message : netError(p, e).message };
    }
  }

  // What can this model do? -> { tools, vision, thinking, known }
  const ollamaCaps = new Map();
  async function caps(model, pid) {
    const p = prov(pid);
    if (p.kind === 'anthropic') return { tools: true, vision: true, thinking: true, known: true };
    if (p.kind === 'ollama') {
      const k = baseOf(p) + '|' + model;
      if (ollamaCaps.has(k)) return ollamaCaps.get(k);
      let c = { tools: true, vision: true, thinking: false, known: false };
      try {
        const r = await fetch(baseOf(p) + '/api/show', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model }), signal: AbortSignal.timeout(4000) });
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j.capabilities)) c = { tools: j.capabilities.includes('tools'), vision: j.capabilities.includes('vision'), thinking: j.capabilities.includes('thinking'), known: true };
        }
      } catch { /* keep optimistic defaults */ }
      ollamaCaps.set(k, c);
      return c;
    }
    const meta = (modelCache.get(p.id) || { meta: {} }).meta[model] || {};
    const id = String(model || '');
    const vision = meta.vision != null ? meta.vision
      : p.vision ? p.vision.test(id)
        : p.id === 'openai' ? /gpt-4o|gpt-4\.1|gpt-5|^o[134]|chatgpt/i.test(id)
          : p.local || p.id === 'custom' || p.id === 'openrouter'; // unknown: let it try
    const thinking = meta.thinking != null ? meta.thinking : /reasoner|r1|qwq|qwen3|gpt-oss|grok-3-mini|thinking|magistral/i.test(id);
    return { tools: meta.tools !== false, vision, thinking, known: !p.local && p.id !== 'custom' };
  }

  // ------------------------------------------------------------- streaming
  // Turn the chat loop's (Ollama-shaped) conversation into each API's format.
  const mimeOf = (b64) => (String(b64).startsWith('/9j/') ? 'image/jpeg' : String(b64).startsWith('iVBOR') ? 'image/png' : String(b64).startsWith('R0lG') ? 'image/gif' : 'image/webp');
  const NOT_RUN = 'Not run: Bloop runs at most a few actions per step. Call it again if it is still needed.';
  const argsObj = (a) => { if (a && typeof a === 'object') return a; try { return JSON.parse(a || '{}') || {}; } catch { return {}; } };

  function toOpenAI(messages) {
    const out = [];
    let pending = [];
    const closePending = () => { pending.forEach((id) => out.push({ role: 'tool', tool_call_id: id, content: NOT_RUN })); pending = []; };
    let n = 0;
    for (const m of messages) {
      if (!m) continue;
      if (m.role === 'tool') {
        const id = pending.shift() || ('call_orphan_' + (n++));
        out.push({ role: 'tool', tool_call_id: id, content: String(m.content || '') });
        continue;
      }
      closePending();
      if (m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.length) {
        const calls = m.tool_calls.map((c) => {
          const f = c.function || {};
          const id = c.id || ('call_' + (n++));
          pending.push(id);
          return { id, type: 'function', function: { name: String(f.name || ''), arguments: JSON.stringify(argsObj(f.arguments)) } };
        });
        out.push({ role: 'assistant', content: m.content || null, tool_calls: calls });
      } else if (m.role === 'user' && Array.isArray(m.images) && m.images.length) {
        out.push({ role: 'user', content: [{ type: 'text', text: String(m.content || '') }, ...m.images.map((b) => ({ type: 'image_url', image_url: { url: `data:${mimeOf(b)};base64,${b}` } }))] });
      } else if (['system', 'user', 'assistant'].includes(m.role)) {
        out.push({ role: m.role, content: String(m.content || '') });
      }
    }
    closePending();
    return out;
  }

  function toAnthropic(messages) {
    let system = '';
    const out = [];
    let pending = [];
    let n = 0;
    const push = (role, blocks) => {
      blocks = blocks.filter((b) => b && (b.type !== 'text' || b.text));
      if (!blocks.length) return;
      const last = out[out.length - 1];
      if (last && last.role === role) last.content.push(...blocks); else out.push({ role, content: blocks });
    };
    const closePending = () => { if (pending.length) push('user', pending.map((id) => ({ type: 'tool_result', tool_use_id: id, content: NOT_RUN }))); pending = []; };
    for (const m of messages) {
      if (!m) continue;
      if (m.role === 'system') { system += (system ? '\n' : '') + String(m.content || ''); continue; }
      if (m.role === 'tool') {
        const id = pending.shift();
        if (id) push('user', [{ type: 'tool_result', tool_use_id: id, content: String(m.content || '') || '(no output)' }]);
        continue;
      }
      if (m.role === 'user') {
        closePending();
        const imgs = Array.isArray(m.images) ? m.images.map((b) => ({ type: 'image', source: { type: 'base64', media_type: mimeOf(b), data: b } })) : [];
        push('user', [...imgs, { type: 'text', text: String(m.content || '') }]);
        continue;
      }
      if (m.role === 'assistant') {
        closePending();
        if (!out.length) continue; // the conversation must start with the user
        if (Array.isArray(m._raw) && m._raw.length) {
          // replay exactly what Claude sent (thinking blocks and their signatures included)
          out.push({ role: 'assistant', content: m._raw });
          m._raw.forEach((b) => { if (b && b.type === 'tool_use') pending.push(b.id); });
          continue;
        }
        const blocks = [{ type: 'text', text: String(m.content || '') }];
        (m.tool_calls || []).forEach((c) => {
          const f = c.function || {};
          const id = c.id || ('toolu_bloop_' + (n++));
          pending.push(id);
          blocks.push({ type: 'tool_use', id, name: String(f.name || ''), input: argsObj(f.arguments) });
        });
        push('assistant', blocks);
      }
    }
    closePending();
    return { system, messages: out };
  }

  async function* sseLines(res, signal) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    try {
      for (;;) {
        if (signal && signal.aborted) return;
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).replace(/\r$/, '');
          buf = buf.slice(nl + 1);
          yield line;
        }
      }
      if (buf.trim()) yield buf;
    } finally { try { await reader.cancel(); } catch { /* already closed */ } }
  }

  // ---- Ollama (unchanged behaviour: NDJSON straight through)
  async function* ollamaStream(p, { model, messages, tools, think, signal }) {
    const c = load();
    let res;
    try {
      res = await fetch(baseOf(p) + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
        body: JSON.stringify({ model, messages, ...(tools ? { tools } : {}), stream: true, ...(think != null ? { think } : {}), keep_alive: '30m',
          options: { num_predict: c.maxTokens || -1, temperature: c.temperature, repeat_penalty: 1.15, num_ctx: c.ctx || 8192 } }),
      });
    } catch (e) { if (signal && signal.aborted) throw e; throw netError(p, e); }
    if (!res.ok) throw new Error((await res.text()) || 'HTTP ' + res.status);
    for await (const raw of sseLines(res, signal)) {
      const line = raw.trim();
      if (!line) continue;
      let obj;
      try { obj = JSON.parse(line); } catch { continue; }
      if (obj.error) throw new Error(obj.error);
      if (obj.done) record(p.id, obj.prompt_eval_count || 0, obj.eval_count || 0, 1);
      yield obj;
      if (obj.done) return;
    }
  }

  // ---- OpenAI-compatible (OpenAI, Gemini, OpenRouter, Groq, Mistral, DeepSeek, xAI, Together, LM Studio, custom)
  async function* openaiStream(p, { model, messages, tools, wantThink, signal }) {
    const c = load();
    const key = await getKey(p.id);
    const body = { model, messages: toOpenAI(messages), stream: true };
    if (tools && tools.length) body.tools = tools;
    let withTemp = true, maxParam = p.maxParam || 'max_tokens', withUsage = !!p.usage;
    for (let attempt = 0; attempt < 4; attempt++) {
      const b = { ...body };
      if (withTemp) b.temperature = c.temperature;
      if (c.maxTokens) b[maxParam] = c.maxTokens;
      if (withUsage) b.stream_options = { include_usage: true };
      let res;
      try {
        res = await fetch(baseOf(p) + '/chat/completions', {
          method: 'POST', signal,
          headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: 'Bearer ' + key } : {}), ...(p.headers || {}) },
          body: JSON.stringify(b),
        });
      } catch (e) { if (signal && signal.aborted) throw e; throw netError(p, e); }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        // some models refuse optional settings: drop the one they name and try again
        if (res.status === 400 && withTemp && /temperature/i.test(text)) { withTemp = false; continue; }
        if (res.status === 400 && c.maxTokens && /max_tokens|max_completion_tokens/i.test(text)) { maxParam = maxParam === 'max_tokens' ? 'max_completion_tokens' : 'max_tokens'; continue; }
        if (res.status === 400 && withUsage && /stream_options|include_usage/i.test(text)) { withUsage = false; continue; }
        let detail = text;
        try { const j = JSON.parse(text); detail = (j.error && (j.error.message || j.error)) || j.message || text; } catch { /* plain text */ }
        throw new ProviderError(friendly(p, res.status, typeof detail === 'string' ? detail : JSON.stringify(detail)), res.status);
      }
      record(p.id, 0, 0, 1);
      const calls = [];
      let sawText = false;
      for await (const line of sseLines(res, signal)) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        let j;
        try { j = JSON.parse(data); } catch { continue; }
        if (j.error) throw new ProviderError(friendly(p, j.error.code || 0, j.error.message || JSON.stringify(j.error)));
        if (j.usage) record(p.id, j.usage.prompt_tokens || 0, j.usage.completion_tokens || 0, 0);
        const ch = j.choices && j.choices[0];
        const d = ch && ch.delta;
        if (!d) continue;
        const thought = d.reasoning_content || d.reasoning;
        if (thought && wantThink) yield { message: { thinking: String(thought) } };
        if (d.content) { sawText = true; yield { message: { content: String(d.content) } }; }
        for (const tc of d.tool_calls || []) {
          const i = tc.index != null ? tc.index : calls.length;
          const slot = calls[i] || (calls[i] = { id: '', name: '', args: '' });
          if (tc.id) slot.id = tc.id;
          if (tc.function && tc.function.name) slot.name += tc.function.name;
          if (tc.function && tc.function.arguments) slot.args += typeof tc.function.arguments === 'string' ? tc.function.arguments : JSON.stringify(tc.function.arguments);
        }
      }
      const done = calls.filter((x) => x && x.name);
      if (done.length) {
        yield { message: { content: '', tool_calls: done.map((x) => {
          let a; let invalid = false;
          try { a = x.args ? JSON.parse(x.args) : {}; } catch { a = {}; invalid = true; }
          return { id: x.id || undefined, function: { name: x.name, arguments: a }, ...(invalid ? { invalid } : {}) };
        }) } };
      }
      void sawText;
      yield { done: true };
      return;
    }
  }

  // ---- Anthropic Claude, through the official SDK
  let Anthropic = null;
  async function anthropicClient(p) {
    if (!Anthropic) { const m = require('@anthropic-ai/sdk'); Anthropic = m.default || m; }
    return new Anthropic({ apiKey: await getKey(p.id), baseURL: baseOf(p), maxRetries: 2, timeout: 10 * 60 * 1000 });
  }
  async function* anthropicStream(p, { model, messages, tools, wantThink, signal }) {
    const c = load();
    const client = await anthropicClient(p);
    const { system, messages: msgs } = toAnthropic(messages);
    if (!msgs.length) throw new ProviderError('There is nothing to send yet.');
    const opts = { thinking: true, effort: !!c.effort, fallbacks: CLAUDE_FALLBACK.test(model), cache: true, eager: true };
    for (let attempt = 0; attempt < 6; attempt++) {
      const betas = [];
      const params = { model, max_tokens: 32000, messages: msgs };
      if (system) params.system = system;
      if (opts.cache) params.cache_control = { type: 'ephemeral' };
      if (opts.thinking) {
        // Claude decides how much to think. If an old thinking block no longer matches the conversation
        // (Bloop trims old screenshots), it is dropped instead of failing the request.
        params.thinking = { type: 'adaptive', ...(wantThink ? { display: 'summarized' } : {}), block_binding: { prefix_mismatch_behavior: 'drop_block' } };
        betas.push('thinking-binding-controls-2026-08-01');
      }
      if (opts.effort) params.output_config = { effort: c.effort };
      if (opts.fallbacks) { params.fallbacks = 'default'; betas.push('server-side-fallback-2026-07-01'); }
      if (tools && tools.length) {
        params.tools = tools.map((t) => ({ name: t.function.name, description: t.function.description || '', input_schema: t.function.parameters || { type: 'object', properties: {} },
          ...(opts.eager ? { eager_input_streaming: true } : {}) }));
      }
      if (betas.length) params.betas = betas;
      const started = { any: false };
      const json = {}; // tool_use block index -> streamed JSON text
      try {
        const stream = client.beta.messages.stream(params, { signal });
        let inTok = 0, outTok = 0;
        for await (const ev of stream) {
          if (ev.type === 'message_start') {
            const u = ev.message.usage || {};
            inTok = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
          } else if (ev.type === 'content_block_start' && ev.content_block.type === 'tool_use') {
            json[ev.index] = '';
          } else if (ev.type === 'content_block_delta') {
            const d = ev.delta;
            if (d.type === 'text_delta' && d.text) { started.any = true; yield { message: { content: d.text } }; }
            else if (d.type === 'thinking_delta' && d.thinking && wantThink) { started.any = true; yield { message: { thinking: d.thinking } }; }
            else if (d.type === 'input_json_delta') json[ev.index] = (json[ev.index] || '') + (d.partial_json || '');
          } else if (ev.type === 'message_delta') {
            if (ev.usage && ev.usage.output_tokens != null) outTok = ev.usage.output_tokens;
          }
        }
        const final = await stream.finalMessage();
        record(p.id, inTok, outTok, 1);
        const raw = final.content;
        const uses = [];
        raw.forEach((b, i) => {
          if (b.type !== 'tool_use') return;
          // validate the streamed input ourselves: a cut-off or invalid input is reported back, never run
          let a = b.input; let invalid = final.stop_reason === 'max_tokens';
          if (json[i] != null) { try { a = json[i] ? JSON.parse(json[i]) : {}; } catch { invalid = true; } }
          uses.push({ id: b.id, function: { name: b.name, arguments: a && typeof a === 'object' ? a : {} }, ...(invalid ? { invalid: true } : {}) });
        });
        if (final.stop_reason === 'refusal' && !uses.length) {
          yield { message: { content: (started.any ? '\n\n' : '') + '(Claude declined to help with this one.)' } };
        }
        if (uses.length) yield { message: { content: '', tool_calls: uses, _raw: raw } };
        yield { done: true, raw };
        return;
      } catch (e) {
        if (signal && signal.aborted) throw e;
        const status = e && e.status;
        const msg = String((e && e.error && e.error.error && e.error.error.message) || (e && e.message) || e);
        // Older Claude models or a proxy may not know a newer option: drop it and try again.
        if (status === 400 && !started.any) {
          if (opts.fallbacks && /fallback/i.test(msg)) { opts.fallbacks = false; continue; }
          if (opts.eager && /eager_input_streaming/i.test(msg)) { opts.eager = false; continue; }
          if (opts.effort && /effort|output_config/i.test(msg)) { opts.effort = false; continue; }
          if (opts.thinking && /thinking|adaptive|block_binding|anthropic-beta|beta/i.test(msg)) { opts.thinking = false; continue; }
          if (opts.cache && /cache_control/i.test(msg)) { opts.cache = false; continue; }
        }
        if (!status) throw netError(p, e);
        throw new ProviderError(friendly(p, status, msg), status);
      }
    }
    throw new ProviderError(`${p.short} kept rejecting the request. Try another model.`);
  }

  // Stream one reply from the active provider (or `pid`).
  function stream(opts) {
    const p = prov(opts.provider);
    if (!hasKey(p)) throw new ProviderError(`Add your ${p.short} API key first: Settings > AI, or /ai key.`);
    if (p.kind === 'ollama') return ollamaStream(p, opts);
    if (p.kind === 'anthropic') return anthropicStream(p, opts);
    return openaiStream(p, opts);
  }

  async function setKey(pid, key) {
    const p = BY_ID[pid];
    if (!p || p.keyless) return { ok: false, error: 'This provider does not use a key.' };
    key = String(key || '').trim();
    if (!key || key.length > 500 || /\s/.test(key)) return { ok: false, error: 'That does not look like an API key.' };
    const before = load().keys[pid];
    await storeKey(pid, key);
    modelCache.delete(pid);
    try {
      const m = await listModels(pid, true);
      return { ok: true, models: m.ids.length, encrypted: await canEncrypt() };
    } catch (e) {
      const status = e && e.status;
      if (status === 401 || status === 403) {
        if (before) load().keys[pid] = before; else delete load().keys[pid];
        persist();
        return { ok: false, error: friendly(p, status, '') };
      }
      // saved, but could not be checked (offline, or the provider has no model list)
      return { ok: true, unchecked: true, warning: e instanceof ProviderError ? e.message : netError(p, e).message, encrypted: await canEncrypt() };
    }
  }
  function clearKey(pid) { delete load().keys[pid]; modelCache.delete(pid); persist(); return { ok: true }; }
  function keyPage(pid) { const p = BY_ID[pid]; return p && p.keyUrl ? p.keyUrl : ''; }

  return {
    CATALOG, ProviderError, load, publicConfig, setConfig, setKey, clearKey, keyPage, status, listModels, caps, stream, isCloud,
    active: () => prov().id, label: (pid) => prov(pid).short, ollamaBase: () => baseOf(BY_ID.ollama), checkLimit, usageToday, record,
    toOpenAI, toAnthropic, // exported for tests
  };
};
module.exports.CATALOG = CATALOG;
