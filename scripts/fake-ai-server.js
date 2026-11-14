'use strict';
// A fake AI server for tests and manual checks: speaks the OpenAI chat API and the Anthropic Messages API.
// Run it on its own with:  node scripts/fake-ai-server.js 47999
const http = require('node:http');

// One fake server that speaks both the OpenAI chat API and the Anthropic Messages API.
function fakeServer(port = 0) {
  const seen = [];
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const j = body ? JSON.parse(body) : null;
      seen.push({ url: req.url, headers: req.headers, body: j });
      const sse = (events) => { res.writeHead(200, { 'Content-Type': 'text/event-stream' }); for (const e of events) res.write(e); res.end(); };
      if (req.method === 'GET' && /\/models/.test(req.url)) {
        if (req.headers.authorization === 'Bearer bad' || req.headers['x-api-key'] === 'bad') { res.writeHead(401); return res.end('{"error":{"message":"invalid key"}}'); }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ data: [{ id: 'fake-large' }, { id: 'fake-small' }, { id: 'text-embedding-3' }], has_more: false, first_id: 'fake-large', last_id: 'fake-small' }));
      }
      if (req.url.endsWith('/chat/completions')) {
        const hadTool = j.messages.some((m) => m.role === 'tool');
        const d = (o) => `data: ${JSON.stringify(o)}\n\n`;
        if (!hadTool) {
          return sse([
            d({ choices: [{ delta: { role: 'assistant', tool_calls: [{ index: 0, id: 'call_abc', type: 'function', function: { name: 'get_local_time', arguments: '' } }] } }] }),
            d({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{' } }] } }] }),
            d({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '}' } }] } }] }),
            d({ choices: [{ delta: {}, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 50, completion_tokens: 7 } }),
            'data: [DONE]\n\n',
          ]);
        }
        return sse([d({ choices: [{ delta: { content: 'It is ' } }] }), d({ choices: [{ delta: { content: 'noon.' } }] }), 'data: [DONE]\n\n']);
      }
      if (req.url.endsWith('/v1/messages')) {
        const ev = (type, o) => `event: ${type}\ndata: ${JSON.stringify({ type, ...o })}\n\n`;
        const hadResult = j.messages.some((m) => Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_result'));
        const start = ev('message_start', { message: { id: 'msg_1', type: 'message', role: 'assistant', model: j.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 40, output_tokens: 1 } } });
        if (!hadResult) {
          return sse([start,
            ev('content_block_start', { index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } }),
            ev('content_block_delta', { index: 0, delta: { type: 'thinking_delta', thinking: 'The user wants the time.' } }),
            ev('content_block_delta', { index: 0, delta: { type: 'signature_delta', signature: 'SIG123' } }),
            ev('content_block_stop', { index: 0 }),
            ev('content_block_start', { index: 1, content_block: { type: 'tool_use', id: 'toolu_1', name: 'get_local_time', input: {} } }),
            ev('content_block_delta', { index: 1, delta: { type: 'input_json_delta', partial_json: '{' } }),
            ev('content_block_delta', { index: 1, delta: { type: 'input_json_delta', partial_json: '}' } }),
            ev('content_block_stop', { index: 1 }),
            ev('message_delta', { delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 12 } }),
            ev('message_stop', {})]);
        }
        return sse([start,
          ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }),
          ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'It is noon.' } }),
          ev('content_block_stop', { index: 0 }),
          ev('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 5 } }),
          ev('message_stop', {})]);
      }
      res.writeHead(404); res.end();
    });
  });
  return new Promise((resolve) => srv.listen(port, '127.0.0.1', () => resolve({ srv, seen, url: 'http://127.0.0.1:' + srv.address().port })));
}

module.exports = fakeServer;
if (require.main === module) fakeServer(Number(process.argv[2]) || 47999).then(({ url }) => console.log('fake AI server on ' + url));
