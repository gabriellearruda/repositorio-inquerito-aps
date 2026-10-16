// api/save.js — Vercel Serverless Function
// Recebe o HTML editado, aplica ao vital/index.html e commita no GitHub.
// O token do GitHub nunca vai ao browser — fica protegido aqui no servidor.

const attempts = new Map();
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return { blocked: false };
  }
  if (entry.count >= LIMIT) {
    return { blocked: true, retryIn: Math.ceil((entry.firstAt + WINDOW_MS - now) / 1000) };
  }
  entry.count++;
  return { blocked: false };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const rl = checkRateLimit(ip);
  if (rl.blocked) return res.status(429).json({ error: `Muitas tentativas. Tente em ${rl.retryIn}s.` });

  const { password, html, ping, source } = req.body || {};

  const adminPassword = process.env.SENHADOPAINEL;
  if (!adminPassword) return res.status(500).json({ error: 'SENHADOPAINEL não configurado no servidor' });
  if (password !== adminPassword) return res.status(401).json({ error: 'Senha incorreta' });

  attempts.delete(ip);
  if (ping) return res.status(200).json({ ok: true });

  // Repositório definido só por variáveis de ambiente (funciona em forks)
  const token  = process.env.GITHUB_TOKEN;
  const owner  = process.env.GITHUB_OWNER;
  const repo   = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  for (const [name, value] of Object.entries({ GITHUB_TOKEN: token, GITHUB_OWNER: owner, GITHUB_REPO: repo })) {
    if (!value) return res.status(500).json({ error: `${name} não configurado no servidor` });
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/vital/index.html`;
  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Devolve o HTML atual do repositório (o gerenciador edita a partir dele)
  if (source) {
    try {
      const srcRes = await fetch(`${apiUrl}?ref=${branch}`, {
        headers: { ...ghHeaders, Accept: 'application/vnd.github.raw+json' },
      });
      if (!srcRes.ok) throw new Error('Erro ao buscar arquivo: ' + srcRes.status);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(await srcRes.text());
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (!html || typeof html !== 'string') return res.status(400).json({ error: 'HTML inválido' });

  // Bloqueia commit acidental da senha real no HTML
  if (html.includes(adminPassword)) {
    return res.status(400).json({ error: 'Conteúdo inválido: contém a senha do painel' });
  }

  try {

    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: ghHeaders });
    if (!getRes.ok) throw new Error('Erro ao buscar arquivo: ' + getRes.status);
    const { sha } = await getRes.json();

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Atualização de conteúdo via gerenciador',
        content: Buffer.from(html, 'utf-8').toString('base64'),
        sha,
        branch,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error('GitHub: ' + (err.message || putRes.status));
    }

    return res.status(200).json({ ok: true, message: 'Publicado! O site será atualizado em ~60 segundos.' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
