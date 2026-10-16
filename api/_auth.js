// api/_auth.js — sessão por cookie assinado (HMAC), compartilhada entre
// middleware.js (Vercel), api/save.js e server.mjs (Docker).
// Arquivos com "_" na pasta api/ não viram rotas na Vercel.

export const COOKIE_NAME = 'vital_session';
export const SESSION_MAX_AGE = 24 * 60 * 60; // 24 horas, em segundos

// Caminhos que exigem login
export const PROTECTED_PREFIXES = ['/vital', '/arquivos', '/docs'];

export function isProtectedPath(pathname) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

// Comparação em tempo constante
export function safeEqual(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function createSessionToken(secret) {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  return `${exp}.${await hmac(secret, exp)}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || !secret) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(secret, exp));
}

export function readCookie(cookieHeader, name = COOKIE_NAME) {
  for (const part of (cookieHeader || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

export function isSessionValid(cookieHeader) {
  return verifySessionToken(readCookie(cookieHeader), process.env.SESSION_SECRET);
}

export function sessionCookie(token, secure) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie(secure) {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

// Página de login, servida no lugar do conteúdo protegido
export const LOGIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Acesso restrito — Inquérito APS por WhatsApp</title>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  background:#0A1356;font-family:'Inter',-apple-system,sans-serif;
  display:flex;align-items:center;justify-content:center;padding:2rem;
}
#pw-form{display:flex;flex-direction:column;align-items:center;gap:.8rem;width:100%;max-width:320px}
#pw-eyebrow{
  font-size:.6rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:rgba(255,203,55,.8);margin-bottom:.4rem;text-align:center;
}
#pw-title{
  font-family:'Source Serif 4',Georgia,serif;font-size:1.3rem;font-weight:300;
  color:#fff;text-align:center;margin-bottom:.2rem;
}
#pw-input{
  width:100%;padding:.65rem 1rem;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);
  color:#fff;font-family:'Inter',sans-serif;font-size:.88rem;
  outline:none;border-radius:4px;transition:border-color .15s;
  text-align:center;letter-spacing:.08em;
}
#pw-input::placeholder{color:rgba(255,255,255,.25);letter-spacing:normal}
#pw-input:focus{border-color:rgba(255,203,55,.5)}
#pw-btn{
  width:100%;padding:.65rem 1rem;
  background:rgba(255,203,55,.15);border:1px solid rgba(255,203,55,.35);
  color:rgba(255,203,55,.9);font-family:'Inter',sans-serif;font-size:.8rem;
  font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  cursor:pointer;border-radius:4px;transition:background .15s;
}
#pw-btn:hover{background:rgba(255,203,55,.25)}
#pw-btn:disabled{opacity:.5;cursor:default}
#pw-error{font-size:.75rem;color:rgba(227,106,87,.9);display:none;text-align:center}
</style>
</head>
<body>
<form id="pw-form">
  <span id="pw-eyebrow">Acesso restrito</span>
  <div id="pw-title">Inquérito APS por WhatsApp</div>
  <input id="pw-input" type="password" placeholder="Senha" autocomplete="current-password" autofocus>
  <button id="pw-btn" type="submit">Entrar</button>
  <span id="pw-error">Senha incorreta</span>
</form>
<script>
document.getElementById('pw-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  var input = document.getElementById('pw-input');
  var err = document.getElementById('pw-error');
  var btn = document.getElementById('pw-btn');
  btn.disabled = true;
  err.style.display = 'none';
  try {
    var res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: true, password: input.value.trim() })
    });
    if (res.ok) { location.reload(); return; }
    var data = await res.json().catch(function () { return {}; });
    err.textContent = data.error || 'Senha incorreta';
  } catch (ex) {
    err.textContent = 'Erro de conexão com o servidor';
  }
  btn.disabled = false;
  err.style.display = 'block';
  input.value = '';
  input.focus();
});
</script>
</body>
</html>`;
