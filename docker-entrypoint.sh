#!/bin/sh
# Sobe a API (porta 3001) e o site estático (porta 3000) em paralelo
node --input-type=module <<'EOF' &
import http from 'http';
import handler from './api/save.js';
const fn = handler.default || handler;
http.createServer(async (req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    try { req.body = body ? JSON.parse(body) : {}; } catch(e) { req.body = {}; }
    await fn(req, res);
  });
}).listen(3001, () => console.log('API rodando em http://localhost:3001'));
EOF

serve -s . -l 3000
