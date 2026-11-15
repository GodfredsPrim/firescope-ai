import { afterEach, describe, expect, it } from 'vitest';
import { createAppServer } from './start.mjs';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let server;
let distRoot;
afterEach(async () => { if (server) await new Promise(resolve => server.close(resolve)); if (distRoot) { await unlink(join(distRoot, 'index.html')); await unlink(join(distRoot, 'archive.json')).catch(() => {}); await rmdir(distRoot); } });
describe('standalone production backend', () => {
  it('serves built assets and private APIs without exposing environment files', async () => {
    distRoot = await mkdtemp(join(tmpdir(), 'firescope-server-test-'));
    await writeFile(join(distRoot, 'index.html'), '<title>FireScope AI</title>');
    await writeFile(join(distRoot, 'archive.json'), '{"version":1,"months":[]}');
    server = createAppServer({ env: { FIRMS_MAP_KEY: 'test-secret' }, distRoot });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/api/health`);
    expect(await health.json()).toEqual({ status: 'ok', service: 'FireScope API', nasaConfigured: true, weatherConfigured: false });
    const page = await fetch(base);
    expect(page.status).toBe(200); expect(await page.text()).toContain('FireScope AI');
    const archive = await fetch(`${base}/archive.json`);
    expect(archive.headers.get('content-type')).toContain('application/json');
    expect(await archive.json()).toEqual({ version: 1, months: [] });
    for (const path of ['/.env.local', '/server/start.mjs', '/api/unknown', '/%2eenv.local', '/..%5c.env.local']) expect((await fetch(base + path)).status).toBe(404);
    expect((await fetch(base, { method: 'POST' })).status).toBe(405);
  });
});
