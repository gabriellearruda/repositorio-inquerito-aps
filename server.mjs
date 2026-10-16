// Servidor local (Docker): serve os arquivos estáticos e a API /api/save na mesma porta,
// emulando o ambiente da Vercel (inclusive o login do middleware.js).
import http from 'http';
import fs from 'fs';
import path from 'path';
import handler from './api/save.js';
import { isProtectedPath, isSessionValid, LOGIN_HTML } from './api/_auth.js';

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
  res.send = (data) => { res.end(data); return res; };
  return res;
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(ROOT, urlPath);
  const rel = path.relative(ROOT, file);
  // Bloqueia saída da pasta e arquivos/pastas ocultos (.env, .git...)
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).some((p) => p.startsWith('.'))) {
    res.statusCode = 404; return res.end('Not found');
  }
  if (isProtectedPath(urlPath) && !(await isSessionValid(req.headers.cookie))) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(LOGIN_HTML);
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  if (isProtectedPath(urlPath)) res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/save')) {
    // IP real da conexão (o cliente não pode forjar o rate limit)
    req.headers['x-forwarded-for'] = req.socket.remoteAddress;
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }
      try { await handler(req, vercelRes(res)); }
      catch (e) { if (!res.headersSent) vercelRes(res).status(500).json({ error: e.message }); }
    });
    return;
  }
  serveStatic(req, res).catch(() => { res.statusCode = 500; res.end(); });
}).listen(PORT, () => console.log(`Site + API em http://localhost:${PORT}/vital`));
