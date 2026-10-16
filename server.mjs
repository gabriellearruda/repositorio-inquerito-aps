// Servidor local (Docker): serve os arquivos estáticos e a API /api/save na mesma porta,
// emulando o ambiente da Vercel.
import http from 'http';
import fs from 'fs';
import path from 'path';
import handler from './api/save.js';

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve('.');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

// Helpers no estilo Vercel (res.status().json())
function vercelRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/save')) {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }
      try { await handler(req, vercelRes(res)); }
      catch (e) { if (!res.headersSent) vercelRes(res).status(500).json({ error: e.message }); }
    });
    return;
  }
  serveStatic(req, res);
}).listen(PORT, () => console.log(`Site + API em http://localhost:${PORT}/vital`));
