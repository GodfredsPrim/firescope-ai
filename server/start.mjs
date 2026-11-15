import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEnvFile } from 'node:process';
import { contextApi } from './context-api.mjs';
import { localApi } from './local-api.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
export function createAppServer({ env = process.env, distRoot = resolve('dist') } = {}) {
  const context = contextApi(env), fires = localApi(env), clients = new Map();
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        const ip = req.socket.remoteAddress || 'unknown', now = Date.now();
        const prior = clients.get(ip), budget = prior && now < prior.until ? prior : { count: 0, until: now + 60000 };
        budget.count++; clients.set(ip, budget);
        if (clients.size > 10000) for (const [key, value] of clients) if (value.until < now) clients.delete(key);
        if (budget.count > 60) { res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '60' }); res.end('{"error":"Too many requests. Wait a minute before retrying."}'); return; }
        if (url.pathname === '/api/health') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ status: 'ok', service: 'FireScope API', nasaConfigured: !!env.FIRMS_MAP_KEY, weatherConfigured: !!env.OPENWEATHERMAP_API_KEY })); return; }
        await context(req, res, async () => { await fires(req, res, () => { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"API endpoint not found."}'); }); });
        return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
      const pathname = decodeURIComponent(url.pathname);
      const segments = pathname.split('/');
      if (segments.some(part => part.startsWith('.') || part.includes('\\')) || pathname.includes('\0')) { res.writeHead(404); res.end(); return; }
      const target = resolve(distRoot, pathname === '/' ? 'index.html' : `.${pathname}`);
      if (!target.startsWith(resolve(distRoot) + sep)) { res.writeHead(404); res.end(); return; }
      const bytes = await readFile(target);
      res.setHeader('Content-Type', types[extname(target)] || 'application/octet-stream');
      res.setHeader('Cache-Control', pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
      res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { if (!res.headersSent) res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { loadEnvFile('.env.local'); } catch { /* Deployment may provide environment variables directly. */ }
  const port = Number(process.env.PORT || 4173), host = process.env.HOST || '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  createAppServer().listen(port, host, () => console.log(`FireScope production server listening on http://${host}:${port}`));
}
