// middleware.js — Vercel Routing Middleware
// Só entrega /vital, /arquivos e /docs com sessão válida; sem ela, devolve a
// página de login e o conteúdo protegido nunca sai do servidor.
import { isProtectedPath, isSessionValid, LOGIN_HTML } from './api/_auth.js';

export const config = {
  matcher: ['/vital', '/vital/:path*', '/arquivos/:path*', '/docs/:path*'],
};

export default async function middleware(request) {
  const { pathname } = new URL(request.url);
  if (!isProtectedPath(pathname) || (await isSessionValid(request.headers.get('cookie')))) {
    // Segue para o arquivo estático
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }
  return new Response(LOGIN_HTML, {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
